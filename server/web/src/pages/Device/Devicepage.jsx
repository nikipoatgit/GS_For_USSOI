// ─── pages/Device/DevicePage.jsx ─────────────────────────────────────────────
// GCS Control Panel — single-file, everything inlined.
// Protocol (new):
//   OUT  { cmd, cmdId, deviceId, ...extra }
//   IN   { type:"ack"|"nack"|"telem"|"ui_state"|"data", cmd, cmdId, ... }
//   ui_state payload: { actions:{stream,record}, tunnels:{<n>:<state>} }

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const RECONNECT_MS = 3_000;
const MAX_LOGS     = 100;

const STUN_SERVERS = [
    { urls: "stun:stun.l.google.com:19302"        },
    { urls: "stun:stun1.l.google.com:19302"       },
    { urls: "stun:stun2.l.google.com:19302"       },
    { urls: "stun:stun.services.mozilla.com:3478" },
    { urls: "stun:stun.stunprotocol.org:3478"     },
];

const LOG_STYLES = {
    success: { icon: "✓", color: "#4ade80" },
    error:   { icon: "✕", color: "#f87171" },
    info:    { icon: "·", color: "#60a5fa" },
    warn:    { icon: "!", color: "#fbbf24" },
};

const NET_TYPE_LABELS = { 0:"CELL",1:"WIFI",2:"BT",3:"ETH",4:"VPN",5:"WIFI_A",6:"LoWPAN",7:"USB" };
const DATA_NET_LABELS = {
    0:"?",1:"GPRS",2:"EDGE",3:"UMTS",4:"CDMA",5:"EVDO0",6:"EVDOA",7:"1xRTT",
    8:"HSDPA",9:"HSUPA",10:"HSPA",11:"IDEN",12:"EVDOB",13:"LTE",14:"EHRPD",
    15:"HSPAP",16:"GSM",17:"TDSCDMA",18:"IWLAN",19:"LTE_CA",20:"NR",
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL CSS  (same theme, unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root {
    height: 100%; background: #07090e; color: #c9d1d9;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 13px; line-height: 1.5;
  }
  ::-webkit-scrollbar        { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track  { background: transparent; }
  ::-webkit-scrollbar-thumb  { background: #30363d; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #484f58; }
  @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes deepPulse  { 0%,100%{opacity:0.2} 50%{opacity:1.0} }
  @keyframes mseColor   { 0%{fill:#4285F4} 25%{fill:#EA4335} 50%{fill:#FBBC05} 75%{fill:#34A853} 100%{fill:#4285F4} }
  .rtc-node   { animation: deepPulse 6s ease-in-out infinite; }
  .rtc-node-1 { animation-delay: 0s; }
  .rtc-node-2 { animation-delay: 2s; }
  .rtc-node-3 { animation-delay: 4s; }
  .mse-char { font-family:monospace; font-weight:700; font-size:11px; animation: mseColor 4s linear infinite; }
  .mse-c1 { animation-delay:  0s; }
  .mse-c2 { animation-delay: -1s; }
  .mse-c3 { animation-delay: -2s; }
  .mse-c4 { animation-delay: -3s; }
  #video-container:hover .video-ctrl-bar { opacity: 1 !important; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  ::selection { background: #1f6feb; color: #fff; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function stat(v) { return v != null ? v : "--"; }

function signalBars(dbm) {
    if (dbm == null || dbm >= 0) return 0;
    if (dbm >= -70)  return 4;
    if (dbm >= -90)  return 3;
    if (dbm >= -110) return 2;
    if (dbm >= -130) return 1;
    return 0;
}
function wifiBars(dbm) {
    if (dbm == null || dbm >= 0) return 0;
    if (dbm >= -20) return 4;
    if (dbm >= -40) return 3;
    if (dbm >= -70) return 2;
    if (dbm >= -90) return 1;
    return 0;
}

function parseTelemetry(hex) {
    if (!hex || hex.length < 92) return null;
    try {
        const bytes = new Uint8Array(46);
        for (let i = 0; i < 46; i++) bytes[i] = parseInt(hex.slice(i*2, i*2+2), 16);
        const dv = new DataView(bytes.buffer);
        const status      = hex.length >= 93 ? parseInt(hex[92], 16) : 0;
        const batCurrent  = dv.getInt16(0,  true);
        const batLevel    = dv.getUint8(2);
        const batTemp     = dv.getFloat32(3, true);
        const signal      = dv.getInt16(8,  true);
        const wifiSignal  = dv.getInt16(10, true);
        const netType     = NET_TYPE_LABELS[dv.getUint8(12)] ?? String(dv.getUint8(12));
        const dataNet     = DATA_NET_LABELS[dv.getUint8(13)] ?? String(dv.getUint8(13));
        const upload      = dv.getInt32(14, true) / 100;
        const download    = dv.getInt32(18, true) / 100;
        const dataUsed    = dv.getInt32(22, true) / 100;
        const lat         = dv.getFloat32(26, true);
        const lon         = dv.getFloat32(30, true);
        const accuracy    = dv.getFloat32(34, true);
        const speed       = dv.getFloat32(38, true) * 3.6;
        const altitude    = dv.getFloat32(42, true);
        return { batCurrent, batLevel, batTemp, signal, wifiSignal,
            netType, dataNet, upload, download, dataUsed,
            lat, lon, accuracy, speed, altitude, status };
    } catch(e) { console.error("[parseTelemetry]", e); return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// useWebSocket
// Fire-and-forget: no client-side timeout, no pending tracking.
// UI truth comes exclusively from server-pushed ui_state messages.
// NACK is still logged. No revert callbacks — server corrects state.
// deviceId / timestamp NOT added — server knows the session from WS connection.
// cmdId IS added — server needs it to match ACK/NACK back to the right request.
// ─────────────────────────────────────────────────────────────────────────────
let _cmdCounter = 0;
function genCmdId() { return `c${Date.now()}_${++_cmdCounter}`; }

function useWebSocket({ onLog, onMessage }) {
    const wsRef          = useRef(null);
    const reconnectTimer = useRef(null);
    const deviceIdRef    = useRef(null);

    // Send: stamps cmdId only. No deviceId / timestamp / timeout.
    const sendCmd = useCallback((data) => {
        if (data.type === "cmd") delete data.type;
        data.cmdId = genCmdId();

        console.log("[WS OUT]", JSON.stringify(data));

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        } else {
            onLog("error", "Offline", `Cannot send: ${data.cmd}`);
        }
    }, [onLog]);

    const connect = useCallback((deviceId) => {
        if (deviceId) deviceIdRef.current = deviceId;
        const id = deviceIdRef.current;
        const WS_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/user?deviceId=${id}`;

        if (wsRef.current) {
            const old = wsRef.current;
            old.onopen = old.onmessage = old.onclose = old.onerror = null;
            old.close();
        }
        console.log("[WS] connecting ->", WS_URL);
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            onLog("info", "WebSocket", `Connected · ${id} · ${new Date().toLocaleTimeString()}`);
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
            // request initial device state on connect
            sendCmd({ cmd: "get_tunnels" });
            sendCmd({ cmd: "get_params"  });
            sendCmd({ cmd: "get_res"     });
        };

        ws.onmessage = (e) => {
            let d;
            try { d = JSON.parse(e.data); } catch { return; }
            console.log("[WS IN]", JSON.stringify(d));
            onMessage(d);
            // Log NACKs — no pending map to resolve, ui_state corrects everything
            if (d.type === "nack") {
                onLog("error", "NACK", `${d.cmd ?? "?"}: ${d.error ?? "rejected"}`);
            }
        };

        ws.onclose = () => {
            onLog("warn", "WebSocket", `Closed – reconnecting in ${RECONNECT_MS/1000}s`);
            if (!reconnectTimer.current) {
                reconnectTimer.current = setTimeout(() => {
                    reconnectTimer.current = null;
                    connect();
                }, RECONNECT_MS);
            }
        };
        ws.onerror = () => onLog("error", "WebSocket Error", new Date().toLocaleTimeString());
    }, [onLog, onMessage, sendCmd]);

    const disconnect = useCallback(() => {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
        if (wsRef.current) {
            const ws = wsRef.current;
            ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
            ws.close();
            wsRef.current = null;
        }
    }, []);

    return { connect, disconnect, sendCmd };
}

// ─────────────────────────────────────────────────────────────────────────────
// useWebRTC
// ─────────────────────────────────────────────────────────────────────────────
function useWebRTC({ iceServers, videoRef, sendCmd, onLog }) {
    const pcRef = useRef(null);

    const closePc = useCallback(() => {
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        onLog("warn", "WebRTC", "Connection closed");
    }, [videoRef, onLog]);

    const initPc = useCallback(() => {
        closePc();
        const pc = new RTCPeerConnection({ iceServers });
        pcRef.current = pc;
        onLog("info", "WebRTC", "Peer connection initialised");

        pc.oniceconnectionstatechange = () => {
            const s = pc.iceConnectionState;
            const t = (s==="connected"||s==="completed") ? "success"
                : (s==="failed"||s==="disconnected"||s==="closed") ? "error" : "info";
            onLog(t, "ICE State", s);
        };
        pc.onconnectionstatechange = () => {
            onLog(pc.connectionState==="connected"?"success":"info", "RTC State", pc.connectionState);
        };

        const remoteStream = new MediaStream();
        if (videoRef.current) { videoRef.current.srcObject = remoteStream; videoRef.current.muted = false; }

        pc.ontrack = (event) => {
            remoteStream.addTrack(event.track);
            onLog("success", "Track Received", `kind=${event.track.kind}`);
            videoRef.current?.play().catch(() => {});
        };

        // ICE candidates -> server (new format: params wrapper)
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendCmd({
                    cmd: "webrtc_ice",
                    params: {
                        candidate:     event.candidate.candidate,
                        sdpMid:        event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                    },
                });
            }
        };
        return pc;
    }, [iceServers, closePc, videoRef, sendCmd, onLog]);

    // SDP offer received from device (via server ACK)
    const handleOffer = useCallback(async (sdp) => {
        if (!pcRef.current) initPc();
        try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type:"offer", sdp }));
            const answer = await pcRef.current.createAnswer({ offerToReceiveVideo:true, offerToReceiveAudio:true });
            await pcRef.current.setLocalDescription(answer);
            sendCmd({ cmd:"webrtc_offer", params:{ sdp: answer.sdp } });
            onLog("success", "SDP Answer Sent", new Date().toLocaleTimeString());
        } catch(err) {
            onLog("error", "Offer handling failed", err.message);
        }
    }, [initPc, sendCmd, onLog]);

    const addIceCandidate = useCallback((payload) => {
        if (!pcRef.current || !payload) return;
        pcRef.current.addIceCandidate(new RTCIceCandidate({
            candidate:     payload.candidate,
            sdpMid:        payload.sdpMid,
            sdpMLineIndex: payload.sdpMLineIndex,
        })).catch(err => console.error("[RTC] addIceCandidate failed:", err));
    }, []);

    return { initPc, closePc, handleOffer, addIceCandidate };
}

// ─────────────────────────────────────────────────────────────────────────────
// ── COMPONENTS (inlined) ──────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ onClientDetails }) {
    const [gh, setGh] = useState(false);
    return (
        <nav style={{
            background:"rgba(13,17,23,0.95)", backdropFilter:"blur(6px)",
            borderBottom:"1px solid #21262d", padding:"0 16px", height:44,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            position:"sticky", top:0, zIndex:50,
        }}>
            <div style={{ display:"flex", alignItems:"center", gap:24 }}>
                <a href="#" style={{ fontSize:15, fontWeight:700, color:"#e6edf3", letterSpacing:1, textDecoration:"none" }}>
                    USSOI<span style={{ color:"#58a6ff" }}>·</span>GCS
                </a>
                <a href="https://github.com/nikipoatgit" target="_blank" rel="noopener noreferrer"
                   style={{ fontSize:12, color:gh?"#c9d1d9":"#484f58", textDecoration:"none",
                       display:"flex", alignItems:"center", gap:4, transition:"color 0.15s" }}
                   onMouseEnter={() => setGh(true)} onMouseLeave={() => setGh(false)}>
                    <span>⌥</span> github/nikipoatgit
                </a>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <button onClick={onClientDetails} style={{
                    background:"none", border:"none", color:"#8b949e",
                    cursor:"pointer", fontSize:12, padding:"4px 0",
                }}>Client Details</button>
                <button style={{
                    padding:"4px 12px", fontSize:12, border:"1px solid #30363d",
                    borderRadius:4, background:"rgba(22,27,34,0.8)", color:"#c9d1d9", cursor:"pointer",
                }}>Logout</button>
            </div>
        </nav>
    );
}

// ── LogPanel ──────────────────────────────────────────────────────────────────
function LogPanel({ logs, collapsed, onToggle }) {
    return (
        <aside style={{
            position:"relative", width:collapsed?36:280, minWidth:collapsed?36:280,
            background:"#0d1117", borderLeft:"1px solid #21262d",
            overflowY:"auto", maxHeight:"calc(100vh - 44px)",
            transition:"width 0.2s, min-width 0.2s", flexShrink:0,
        }}>
            <button onClick={onToggle} style={{
                position:"absolute", top:8, right:collapsed?6:8,
                background:"transparent", border:"1px solid #30363d", borderRadius:3,
                color:"#484f58", cursor:"pointer", padding:"2px 6px", fontSize:11, zIndex:2,
            }}>{collapsed ? "»" : "«"}</button>
            {!collapsed && (
                <div style={{ padding:"10px 12px 16px" }}>
                    <h2 style={{ fontSize:12, fontWeight:700, color:"#e6edf3", textTransform:"uppercase",
                        letterSpacing:1.5, marginBottom:12, marginTop:4, paddingRight:28 }}>System Log</h2>
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                        {logs.length === 0 && <p style={{ color:"#484f58", fontSize:11, fontStyle:"italic" }}>No entries yet.</p>}
                        {logs.map((entry) => {
                            const s = LOG_STYLES[entry.type] ?? LOG_STYLES.info;
                            return (
                                <div key={entry.id} style={{
                                    background:"#161b22", border:"1px solid #21262d",
                                    borderLeft:`2px solid ${s.color}`, borderRadius:2,
                                    padding:"6px 10px", display:"flex", gap:8,
                                }}>
                                    <span style={{ color:s.color, fontWeight:700, flexShrink:0, fontSize:12, lineHeight:"18px" }}>{s.icon}</span>
                                    <div style={{ minWidth:0 }}>
                                        <p style={{ fontSize:12, fontWeight:600, color:"#e6edf3" }}>{entry.message}</p>
                                        <p style={{ fontSize:10, color:"#8b949e", marginTop:1, wordBreak:"break-all", lineHeight:1.4 }}>{entry.details}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </aside>
    );
}

// ── ToastContainer ────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
    if (!toasts.length) return null;
    return (
        <div style={{
            position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
            zIndex:200, display:"flex", flexDirection:"column", alignItems:"center",
            gap:6, pointerEvents:"none",
        }}>
            {toasts.map((t) => (
                <div key={t.id} style={{
                    background:"#161b22", border:"1px solid #30363d", borderRadius:3,
                    color:"#e6edf3", padding:"8px 20px", fontSize:12, fontWeight:500,
                    boxShadow:"0 4px 14px rgba(0,0,0,0.6)",
                }}>{t.message}</div>
            ))}
        </div>
    );
}

// ── MiniMap ───────────────────────────────────────────────────────────────────
// FIX: initialises once; uses getZoom() to keep current zoom level on update
function MiniMap({ lat, lon, accuracy, visible, onToggle }) {
    const containerRef = useRef(null);
    const mapRef       = useRef(null);
    const markerRef    = useRef(null);
    const circleRef    = useRef(null);

    // init once after mount — Leaflet must already be loaded in the page
    useEffect(() => {
        if (!window.L || mapRef.current || !containerRef.current) return;
        const L   = window.L;
        const iLat = lat || 20.5937;
        const iLon = lon || 78.9629;

        const map = L.map(containerRef.current, {
            center:[iLat, iLon], zoom:16, minZoom:1, maxZoom:22, zoomControl:false,
        });

        const satellite = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            { maxZoom:22 }
        );
        const labels = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            { maxZoom:22 }
        );
        const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:19 });
        L.layerGroup([satellite, labels]).addTo(map);
        L.control.layers({ "Street":osm, "Satellite":satellite, "Hybrid":L.layerGroup([satellite,labels]) }).addTo(map);

        const icon = L.divIcon({
            html:`<div style="width:10px;height:10px;background:#f85149;border:2px solid #fff;border-radius:50%;"></div>`,
            className:"", iconSize:[10,10], iconAnchor:[5,5],
        });
        markerRef.current = L.marker([iLat, iLon], { icon }).addTo(map);
        circleRef.current = L.circle([iLat, iLon], {
            radius:accuracy||0, color:"#1f6feb", weight:1, fillColor:"#1f6feb", fillOpacity:0.15,
        }).addTo(map);
        mapRef.current = map;
        // trigger size calc in case container was hidden at init
        setTimeout(() => map.invalidateSize(), 200);
    }, []); // run once — intentionally no deps

    // update position on new telemetry
    useEffect(() => {
        if (!mapRef.current || lat == null || lon == null) return;
        const pos = [lat, lon];
        markerRef.current?.setLatLng(pos);
        circleRef.current?.setLatLng(pos);
        circleRef.current?.setRadius(accuracy || 0);
        // keep current zoom — don't reset to 16 every telemetry tick
        mapRef.current.setView(pos, mapRef.current.getZoom(), { animate:true });
    }, [lat, lon, accuracy]);

    // recalculate tile layout when panel becomes visible
    useEffect(() => {
        if (visible && mapRef.current) {
            setTimeout(() => mapRef.current?.invalidateSize(), 150);
        }
    }, [visible]);

    return (
        <div style={{
            position:"fixed", bottom:16, right:16, zIndex:60,
            display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6,
        }}>
            <div ref={containerRef} style={{
                width:310, height:200, borderRadius:3, overflow:"hidden",
                border:"1px solid #21262d", display:visible?"block":"none",
            }} />
            <button onClick={onToggle} style={{
                background:"rgba(13,17,23,0.9)", border:"1px solid #30363d", borderRadius:3,
                width:34, height:34, color:"#8b949e", cursor:"pointer", fontSize:14,
                display:"flex", alignItems:"center", justifyContent:"center", transition:"color 0.15s",
            }}
                    onMouseEnter={e => e.currentTarget.style.color="#e6edf3"}
                    onMouseLeave={e => e.currentTarget.style.color="#8b949e"}
            >◎</button>
        </div>
    );
}

// ── TelemetryBar ──────────────────────────────────────────────────────────────
function SignalBars({ count }) {
    return (
        <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:15 }}>
            {[4,7,11,15].map((h,i) => (
                <span key={i} style={{
                    width:3, height:h, borderRadius:1,
                    background:i<count?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.15)",
                }} />
            ))}
        </div>
    );
}
function WifiIcon({ count }) {
    const c = (idx) => idx<count?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.15)";
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
            <path fill={c(3)} transform="translate(0,-2)" d="M21.192 8.808a13 13 0 00-18.384 0l1.414 1.414a11 11 0 0115.556 0l1.414-1.414z"/>
            <path fill={c(2)} transform="translate(0,-2)" d="M18.364 11.636a9 9 0 00-12.728 0l1.414 1.414a7 7 0 019.9 0l1.414-1.414z"/>
            <path fill={c(1)} transform="translate(0,-2.3)" d="M15.536 14.464a5 5 0 00-7.072 0l1.414 1.414a3 3 0 014.242 0l1.414-1.414z"/>
            <circle fill={c(0)} cx="12" cy="15" r="1.25"/>
        </svg>
    );
}
function Sep() { return <span style={{ width:1, height:14, background:"#21262d", flexShrink:0 }} />; }
function TItem({ icon, value, unit, iconColor, title }) {
    return (
        <div title={title} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ color:iconColor??"#8b949e", fontSize:11 }}>{icon}</span>
            <span style={{ fontWeight:600, color:"#e6edf3" }}>{value}</span>
            {unit && <span style={{ color:"#484f58" }}>{unit}</span>}
        </div>
    );
}
function TelemetryBar({ telemetry: t }) {
    const sig  = t ? signalBars(t.signal)   : 0;
    const wifi = t ? wifiBars(t.wifiSignal) : 0;
    return (
        <div style={{ width:"96%", margin:"8px auto 0", background:"#0d1117",
            border:"1px solid #21262d", borderRadius:4, padding:"8px 14px" }}>
            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:"8px 16px" }}>
                <TItem icon="▣" iconColor="#3fb950" title="Battery"     value={stat(t?.batLevel)}                       unit="%"/>
                <TItem icon="◈" iconColor="#f85149" title="Temperature" value={t?.batTemp!=null?t.batTemp.toFixed(1):"--"} unit="°C"/>
                <TItem icon="⚡" iconColor="#d29922" title="Current"    value={stat(t?.batCurrent)}                     unit="mA"/>
                <Sep/>
                <div title="Cell Signal" style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <SignalBars count={sig}/>
                    <span style={{ fontSize:10, background:"#161b22", border:"1px solid #30363d",
                        color:"#c9d1d9", padding:"0 5px", borderRadius:2, fontWeight:600 }}>{stat(t?.dataNet)}</span>
                    <span style={{ fontSize:10, background:"#161b22", border:"1px solid #30363d",
                        color:"#8b949e", padding:"0 5px", borderRadius:2, fontWeight:600 }}>{stat(t?.netType)}</span>
                    <span style={{ fontWeight:600, color:"#e6edf3" }}>{stat(t?.signal)}</span>
                    <span style={{ color:"#484f58" }}>dBm</span>
                </div>
                <Sep/>
                <div title="Wi-Fi" style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <WifiIcon count={wifi}/>
                    <span style={{ fontWeight:600, color:"#e6edf3" }}>{stat(t?.wifiSignal)}</span>
                    <span style={{ color:"#484f58" }}>dBm</span>
                </div>
                <Sep/>
                <div title="Upload / Download" style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ color:"#8b949e", fontSize:11 }}>⇅</span>
                    <span style={{ color:"#3fb950", fontSize:10 }}>↑</span>
                    <span style={{ fontWeight:600, color:"#e6edf3" }}>{stat(t?.upload)}</span>
                    <span style={{ color:"#484f58", margin:"0 3px" }}>/</span>
                    <span style={{ color:"#58a6ff", fontSize:10 }}>↓</span>
                    <span style={{ fontWeight:600, color:"#e6edf3" }}>{stat(t?.download)}</span>
                    <span style={{ color:"#484f58" }}>KBps</span>
                </div>
                <div title="Data Used" style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ color:"#8b949e", fontSize:11 }}>◫</span>
                    <span style={{ fontWeight:600, color:"#e6edf3" }}>{stat(t?.dataUsed)}</span>
                    <span style={{ color:"#484f58" }}>MB</span>
                </div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:"4px 16px",
                marginTop:8, paddingTop:7, borderTop:"1px solid #21262d" }}>
                <div title="GPS" style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ color:"#8b949e", fontSize:11 }}>◎</span>
                    <span style={{ color:"#c9d1d9", fontWeight:500 }}>
            {t ? `${t.lat.toFixed(6)},  ${t.lon.toFixed(6)}` : "--"}
          </span>
                </div>
                <Sep/>
                <TItem icon="△" iconColor="#8b949e" title="Altitude" value={t?.altitude?.toFixed(1)??"--"} unit="m"/>
                <TItem icon="⊕" iconColor="#8b949e" title="Accuracy" value={t?.accuracy?.toFixed(1)??"--"} unit="m"/>
                <TItem icon="▷" iconColor="#8b949e" title="Speed"    value={t?.speed?.toFixed(1)??"--"}    unit="km/h"/>
            </div>
        </div>
    );
}

// ── VideoPlayer ───────────────────────────────────────────────────────────────
function VideoPlayer({
                         videoRef, containerRef, indicators, isVideoOn, isAudioOn,
                         streamMode, onPlayPause, onMute, onFlip, onRotate,
                         onSwitchCamera, onFullscreen, onSettingsToggle,
                     }) {
    const [ctrl, setCtrl] = useState(false);
    const VBtn = ({ onClick, title, children }) => (
        <button onClick={onClick} title={title} style={{
            background:"none", border:"none", color:"#e6edf3", cursor:"pointer",
            padding:"0 9px", fontSize:13, lineHeight:"32px", opacity:0.85, transition:"opacity 0.15s",
        }}
                onMouseEnter={e => e.currentTarget.style.opacity="1"}
                onMouseLeave={e => e.currentTarget.style.opacity="0.85"}
        >{children}</button>
    );
    const ModeIcon = () => {
        if (streamMode === "webrtc") return (
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <path d="M12 6L18 17H6L12 6Z" stroke="#4B5563" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5"/>
                <circle cx="12" cy="6"  r="3" fill="#4285F4" className="rtc-node rtc-node-1"/>
                <circle cx="18" cy="17" r="3" fill="#EA4335" className="rtc-node rtc-node-2"/>
                <circle cx="6"  cy="17" r="3" fill="#34A853" className="rtc-node rtc-node-3"/>
            </svg>
        );
        if (streamMode === "mse") return (
            <svg width={28} height={13} viewBox="0 0 32 14" fill="none">
                <text x="1"  y="11" className="mse-char mse-c1">H</text>
                <text x="9"  y="11" className="mse-char mse-c2">2</text>
                <text x="17" y="11" className="mse-char mse-c3">6</text>
                <text x="25" y="11" className="mse-char mse-c4">4</text>
            </svg>
        );
        return null;
    };
    return (
        <div id="video-container" ref={containerRef} style={{
            width:"96%", margin:"0 auto", aspectRatio:"16 / 9",
            background:"#000", borderRadius:4, overflow:"hidden", position:"relative",
        }}
             onMouseEnter={() => setCtrl(true)}
             onMouseLeave={() => setCtrl(false)}
        >
            <video ref={videoRef} style={{ width:"100%", height:"100%", display:"block" }} autoPlay playsInline muted/>
            {/* Status dots */}
            <div style={{ position:"absolute", top:10, right:12, display:"flex", gap:12, alignItems:"center" }}>
                <span style={{ display:"flex", alignItems:"center" }}><ModeIcon/></span>
                {["device","stream","record","tunnel"].map((id) => (
                    <div key={id} style={{ display:"flex", alignItems:"center", gap:5,
                        color:indicators[id]?"#e6edf3":"#484f58", transition:"color 0.4s" }}>
            <span style={{
                display:"inline-block", width:7, height:7, borderRadius:"50%",
                background:indicators[id]?"#3fb950":"#30363d",
                animation:indicators[id]?"blink 2s infinite":"none", flexShrink:0,
            }}/>
                        <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>{id}</span>
                    </div>
                ))}
            </div>
            {/* Controls */}
            <div className="video-ctrl-bar" style={{
                position:"absolute", bottom:0, left:0, right:0,
                background:"linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                padding:"10px 4px 8px", opacity:ctrl?1:0, transition:"opacity 0.25s",
            }}>
                <div style={{ display:"flex", alignItems:"center", color:"#e6edf3" }}>
                    <VBtn onClick={onPlayPause} title={isVideoOn?"Pause":"Play"}>{isVideoOn?"⏸":"▶"}</VBtn>
                    <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"0 8px" }}>
                        <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.15)", borderRadius:1 }}>
                            <div style={{ width:"100%", height:"100%", background:"#f85149", borderRadius:1 }}/>
                        </div>
                        <span style={{ fontSize:9, fontWeight:700, color:"#f85149", letterSpacing:1, animation:"blink 2s infinite" }}>LIVE</span>
                    </div>
                    <VBtn onClick={onSwitchCamera} title="Switch Camera">⇄</VBtn>
                    <VBtn onClick={onRotate}       title="Rotate">↻</VBtn>
                    <VBtn onClick={onFlip}         title="Flip">↔</VBtn>
                    <VBtn onClick={onMute}         title={isAudioOn?"Mute":"Unmute"}>{isAudioOn?"🔊":"🔇"}</VBtn>
                    <VBtn onClick={onSettingsToggle} title="Settings">⚙</VBtn>
                    <VBtn onClick={onFullscreen}     title="Fullscreen">⛶</VBtn>
                </div>
            </div>
        </div>
    );
}

// ── SettingsPanel ─────────────────────────────────────────────────────────────
const INP = {
    background:"#161b22", border:"1px solid #30363d", borderRadius:3,
    padding:"4px 8px", color:"#e6edf3", fontSize:11, outline:"none",
    width:"100%", fontFamily:"inherit",
};
function SBtn({ children, onClick, disabled, color="#c9d1d9" }) {
    return (
        <button onClick={onClick} disabled={disabled} style={{
            flex:1, padding:"4px 0", borderRadius:3, fontSize:11,
            background:"rgba(22,27,34,0.8)", border:"1px solid #30363d",
            color:disabled?"#30363d":color, cursor:disabled?"not-allowed":"pointer",
            fontFamily:"inherit",
        }}>{children}</button>
    );
}
function SHd({ children }) {
    return <p style={{ fontSize:10, fontWeight:700, color:"#484f58", textTransform:"uppercase", letterSpacing:1, marginBottom:5 }}>{children}</p>;
}
function SDv() { return <div style={{ borderTop:"1px solid #21262d", margin:"8px 0" }}/>; }

// ── QPanel — quality side panel (opens to the LEFT of settings strip) ─────────
// Left col:  resolution presets from real get_res data + FPS picker per preset
// Right col: stream bitrate / record bitrate with separate apply buttons
function QPanel({ cameraRes, onStreamRes, onRecordRes, onStreamBitrate, onRecordBitrate, onClose }) {
    const [w,       setW]       = useState(1280);
    const [h,       setH]       = useState(720);
    const [fpsList, setFpsList] = useState([30]);
    const [fps,     setFps]     = useState(30);
    const [sBps,    setSBps]    = useState(2000);
    const [rBps,    setRBps]    = useState(8000);

    const resolutions = cameraRes?.resolutions ?? [];

    const selectPreset = (res) => {
        setW(res.width); setH(res.height);
        const maxes = [...new Set(res.fpsRanges.map(r => r.max))].sort((a,b)=>a-b);
        setFpsList(maxes);
        setFps(maxes[maxes.length - 1]);
    };

    return (
        <div style={{
            background:"#0d1117", border:"1px solid #21262d", borderRadius:4,
            fontSize:11, display:"flex", boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
            alignSelf:"flex-end",
        }}>
            {/* ── Left: presets ── */}
            <div style={{ width:200, borderRight:"1px solid #21262d", padding:"10px 8px", display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <SHd>Presets</SHd>
                    <button onClick={onClose} style={{ background:"none",border:"none",color:"#484f58",cursor:"pointer",fontSize:14,lineHeight:1 }}>×</button>
                </div>
                {resolutions.length === 0 && (
                    <p style={{ color:"#484f58", fontSize:10, fontStyle:"italic" }}>Waiting for device…</p>
                )}
                <div style={{ overflowY:"auto", maxHeight:260, display:"flex", flexDirection:"column", gap:2 }}>
                    {resolutions.map(res => {
                        const active = res.width===w && res.height===h;
                        return (
                            <button key={`${res.width}x${res.height}`} onClick={() => selectPreset(res)} style={{
                                ...INP, width:"auto", padding:"4px 7px", cursor:"pointer",
                                fontSize:10, textAlign:"left",
                                background: active ? "#1f3a5f" : "#161b22",
                                border: active ? "1px solid #388bfd" : "1px solid #30363d",
                                color:  active ? "#58a6ff" : "#c9d1d9",
                            }}>
                                {res.width}×{res.height}
                            </button>
                        );
                    })}
                </div>

                {/* FPS selector */}
                <div style={{ marginTop:8 }}>
                    <p style={{ color:"#484f58", marginBottom:4, fontSize:10, textTransform:"uppercase", letterSpacing:0.8 }}>FPS</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                        {fpsList.map(f => (
                            <button key={f} onClick={() => setFps(f)} style={{
                                padding:"2px 8px", borderRadius:2, fontSize:10, cursor:"pointer", fontFamily:"inherit",
                                background: fps===f ? "#1f3a5f" : "#161b22",
                                border:     fps===f ? "1px solid #388bfd" : "1px solid #30363d",
                                color:      fps===f ? "#58a6ff" : "#8b949e",
                            }}>{f}</button>
                        ))}
                    </div>
                </div>

                {/* Apply resolution to stream or record */}
                <div style={{ marginTop:10 }}>
                    <p style={{ color:"#484f58", fontSize:10, marginBottom:4 }}>
                        Apply <span style={{ color:"#c9d1d9" }}>{w}×{h} @{fps}fps</span>
                    </p>
                    <div style={{ display:"flex", gap:4 }}>
                        <button onClick={() => onStreamRes(w,h,fps)} style={{
                            flex:1, padding:"4px 0", borderRadius:3, fontSize:10, cursor:"pointer",
                            background:"rgba(22,27,34,0.8)", border:"1px solid #30363d",
                            color:"#3fb950", fontFamily:"inherit",
                        }}>Stream</button>
                        <button onClick={() => onRecordRes(w,h,fps)} style={{
                            flex:1, padding:"4px 0", borderRadius:3, fontSize:10, cursor:"pointer",
                            background:"rgba(22,27,34,0.8)", border:"1px solid #30363d",
                            color:"#d29922", fontFamily:"inherit",
                        }}>Record</button>
                    </div>
                </div>
            </div>

            {/* ── Right: bitrate ── */}
            <div style={{ width:168, padding:"10px 10px" }}>
                <SHd>Bitrate</SHd>

                <p style={{ color:"#3fb950", marginBottom:3, fontSize:10 }}>Stream (KBps)</p>
                <div style={{ display:"flex", gap:4, marginBottom:12 }}>
                    <input type="number" value={sBps} min={100} step={100} onChange={e=>setSBps(+e.target.value)} style={{ ...INP, flex:1 }}/>
                    <button onClick={() => onStreamBitrate(sBps)} style={{
                        padding:"4px 8px", borderRadius:3, fontSize:10, cursor:"pointer",
                        background:"rgba(22,27,34,0.8)", border:"1px solid #3fb950",
                        color:"#3fb950", fontFamily:"inherit", flexShrink:0,
                    }}>Apply</button>
                </div>

                <p style={{ color:"#d29922", marginBottom:3, fontSize:10 }}>Record (KBps)</p>
                <div style={{ display:"flex", gap:4 }}>
                    <input type="number" value={rBps} min={100} step={500} onChange={e=>setRBps(+e.target.value)} style={{ ...INP, flex:1 }}/>
                    <button onClick={() => onRecordBitrate(rBps)} style={{
                        padding:"4px 8px", borderRadius:3, fontSize:10, cursor:"pointer",
                        background:"rgba(22,27,34,0.8)", border:"1px solid #d29922",
                        color:"#d29922", fontFamily:"inherit", flexShrink:0,
                    }}>Apply</button>
                </div>

                <p style={{ color:"#484f58", fontSize:9, marginTop:10, lineHeight:1.5 }}>
                    Bitrate is independent of resolution.
                </p>
            </div>
        </div>
    );
}

function SettingsPanel({
                           open, cameraRes, tunnelMode, tunnelNames, uiState,
                           onChangeSetup, onStreamRes, onRecordRes, onStreamBitrate, onRecordBitrate,
                           onStartRecord, onStartStream, onStopStream, onStartTunnel, onStopTunnel,
                       }) {
    const [qOpen, setQOpen] = useState(false);
    const tunnelDisabled = !tunnelMode || tunnelMode === "null" || tunnelMode === "none";
    if (!open) return null;

    const streamState = uiState?.actions?.stream ?? "IDLE";
    const recordState = uiState?.actions?.record ?? "IDLE";
    const isStreaming  = streamState === "ACTIVE" || streamState === "PROCESSING";
    const isRecording  = recordState === "ACTIVE" || recordState === "PROCESSING";
    const stateColor = (s) => s==="ACTIVE"?"#3fb950":s==="PROCESSING"?"#d29922":s==="ERROR"?"#f85149":"#484f58";

    return (
        <div style={{
            position:"absolute", bottom:50, right:0,
            display:"flex", flexDirection:"row-reverse", alignItems:"flex-end", gap:4, zIndex:30,
        }}>
            {/* Settings strip — always visible */}
            <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:4, padding:12, width:220, fontSize:11 }}>
                <SBtn onClick={onChangeSetup}>Change Stream Mode</SBtn>
                <SDv/>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <SHd>Quality</SHd>
                    <SBtn onClick={() => setQOpen(v=>!v)} color={qOpen?"#58a6ff":"#c9d1d9"}>
                        {qOpen ? "← Hide" : "Configure →"}
                    </SBtn>
                </div>
                <SDv/>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <SHd>Stream</SHd>
                    <span style={{ fontSize:10, color:stateColor(streamState) }}>{streamState}</span>
                </div>
                <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                    <SBtn onClick={onStartStream} color="#3fb950">{isStreaming?"Restart":"Start"}</SBtn>
                    <SBtn onClick={onStopStream}  color="#f85149">Stop</SBtn>
                </div>
                <SDv/>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <SHd>Recording</SHd>
                    <span style={{ fontSize:10, color:stateColor(recordState) }}>{recordState}</span>
                </div>
                <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                    <SBtn onClick={onStartRecord} disabled={isRecording} color={isRecording?"#58a6ff":"#c9d1d9"}>
                        {isRecording?"● REC":"Start"}
                    </SBtn>
                </div>
                <SDv/>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                    <SHd>Tunnel</SHd>
                    {tunnelMode==="bt"  && <span style={{ color:"#58a6ff", fontSize:10 }}>BT</span>}
                    {tunnelMode==="usb" && <span style={{ color:"#3fb950", fontSize:10 }}>USB</span>}
                    {!tunnelMode        && <span style={{ color:"#f85149", fontSize:10 }}>✕</span>}
                </div>
                {tunnelNames?.length > 0 && (
                    <div style={{ marginBottom:6 }}>
                        {tunnelNames.map(name => {
                            const s = uiState?.tunnels?.[name] ?? "IDLE";
                            return (
                                <div key={name} style={{ display:"flex", justifyContent:"space-between", marginBottom:2, fontSize:10 }}>
                                    <span style={{ color:"#8b949e" }}>{name}</span>
                                    <span style={{ color:stateColor(s) }}>{s}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div style={{ display:"flex", gap:4 }}>
                    <SBtn disabled={tunnelDisabled} onClick={onStartTunnel} color="#3fb950">Start</SBtn>
                    <SBtn disabled={tunnelDisabled} onClick={onStopTunnel}  color="#f85149">Stop</SBtn>
                </div>
            </div>

            {/* QPanel sits to the LEFT of the settings strip */}
            {qOpen && (
                <QPanel
                    cameraRes={cameraRes}
                    onStreamRes={onStreamRes}
                    onRecordRes={onRecordRes}
                    onStreamBitrate={onStreamBitrate}
                    onRecordBitrate={onRecordBitrate}
                    onClose={() => setQOpen(false)}
                />
            )}
        </div>
    );
}

// ── ClientConfigOverlay ───────────────────────────────────────────────────────
// Modes: WebRTC | H264 (MSE) | HFH264 (high-fps MSE, shown only if supported)
// Removed: local recording, baudrate, rec bitrate
function ClientConfigOverlay({ open, config, onClose, onSave }) {
    // mode: "webrtc" | "h264" | "hfh264"
    const [mode,   setMode]   = useState(config.hfh264 ? "hfh264" : config.mse ? "h264" : "webrtc");
    const [turns,  setTurns]  = useState([]);

    useEffect(() => {
        if (!open) return;
        setMode(config.hfh264 ? "hfh264" : config.mse ? "h264" : "webrtc");
    }, [open]); // eslint-disable-line

    if (!open) return null;

    const inp2 = {
        background:"#161b22", border:"1px solid #30363d", borderRadius:3,
        padding:"5px 10px", color:"#e6edf3", width:"100%", marginTop:4,
        fontSize:12, fontFamily:"inherit", outline:"none",
    };
    const addT = () => setTurns(t=>[...t,{url:"",user:"",pass:""}]);
    const remT = (i) => setTurns(t=>t.filter((_,j)=>j!==i));
    const updT = (i,k,v) => setTurns(t=>t.map((r,j)=>j===i?{...r,[k]:v}:r));

    const MODES = [
        { id:"webrtc",  label:"WebRTC",          desc:"Low latency, peer-to-peer" },
        { id:"h264",    label:"H264 (MSE)",       desc:"RTSP/HLS over WebSocket" },
        { id:"hfh264",  label:"HFH264 (High FPS)", desc:`High frame-rate H264${!config.highFpsSupported?" · not supported":""}`, disabled:!config.highFpsSupported },
    ];

    return (
        <div style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
            backdropFilter:"blur(4px)", zIndex:100,
            display:"flex", alignItems:"center", justifyContent:"center",
        }} onClick={onClose}>
            <div style={{
                background:"#0d1117", border:"1px solid #30363d", borderRadius:4,
                padding:22, width:"100%", maxWidth:420, color:"#e6edf3", fontSize:12,
            }} onClick={e=>e.stopPropagation()}>

                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                    <h2 style={{ fontSize:14, fontWeight:700, letterSpacing:0.5 }}>Stream Configuration</h2>
                    <button onClick={onClose} style={{ background:"none",border:"none",color:"#8b949e",fontSize:18,cursor:"pointer" }}>×</button>
                </div>

                {/* Stream mode selection */}
                <p style={{ color:"#484f58", fontSize:10, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Stream Mode</p>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
                    {MODES.map(m => (
                        <label key={m.id} style={{
                            display:"flex", alignItems:"center", gap:10, cursor: m.disabled?"not-allowed":"pointer",
                            padding:"8px 10px", borderRadius:3,
                            background: mode===m.id ? "#1f3a5f" : "#161b22",
                            border: mode===m.id ? "1px solid #388bfd" : "1px solid #30363d",
                            opacity: m.disabled ? 0.45 : 1,
                        }}>
                            <input type="radio" name="streamMode" value={m.id}
                                   checked={mode===m.id} disabled={m.disabled}
                                   onChange={() => setMode(m.id)}
                                   style={{ accentColor:"#58a6ff", width:13, height:13 }}/>
                            <div>
                                <div style={{ fontWeight:600, color: mode===m.id?"#58a6ff":"#e6edf3" }}>{m.label}</div>
                                <div style={{ fontSize:10, color:"#484f58", marginTop:1 }}>{m.desc}</div>
                            </div>
                        </label>
                    ))}
                </div>

                {/* TURN servers (WebRTC only) */}
                {mode === "webrtc" && (
                    <div style={{ marginBottom:18 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <p style={{ color:"#484f58", fontSize:10, textTransform:"uppercase", letterSpacing:1 }}>TURN Servers</p>
                            <button onClick={addT} style={{
                                fontSize:11, padding:"3px 10px", borderRadius:3,
                                background:"#161b22", border:"1px solid #30363d",
                                color:"#c9d1d9", cursor:"pointer", fontFamily:"inherit",
                            }}>+ Add</button>
                        </div>
                        {turns.map((t,i) => (
                            <div key={i} style={{ display:"flex", gap:5, marginBottom:5 }}>
                                <input placeholder="turn:server" value={t.url}  onChange={e=>updT(i,"url",e.target.value)}  style={{ ...inp2,flex:2,marginTop:0 }}/>
                                <input placeholder="User"        value={t.user} onChange={e=>updT(i,"user",e.target.value)} style={{ ...inp2,flex:1,marginTop:0 }}/>
                                <input placeholder="Pass"        value={t.pass} onChange={e=>updT(i,"pass",e.target.value)} style={{ ...inp2,flex:1,marginTop:0 }}/>
                                <button onClick={()=>remT(i)} style={{ background:"none",border:"none",color:"#f85149",cursor:"pointer",fontSize:13 }}>✕</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                    <button onClick={() => { onSave({ mode, turn:turns.filter(t=>t.url) }); onClose(); }}
                            style={{
                                background:"#1f6feb", border:"1px solid #388bfd", borderRadius:3,
                                padding:"6px 20px", color:"#fff", fontWeight:600,
                                cursor:"pointer", fontSize:12, fontFamily:"inherit",
                            }}>Apply</button>
                </div>
            </div>
        </div>
    );
}

// ── AboutOverlay ──────────────────────────────────────────────────────────────
function AboutOverlay({ open, deviceInfo, onClose }) {
    if (!open || !deviceInfo) return null;
    const { Device, Dashboard, CPU, Network } = deviceInfo;
    const ram=Dashboard?.RAM, storage=Dashboard?.InternalStorage;
    const ACard = ({ title, icon, children }) => (
        <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:4, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, paddingBottom:8, borderBottom:"1px solid #21262d" }}>
                <span style={{ fontSize:12 }}>{icon}</span>
                <h3 style={{ fontWeight:600, color:"#e6edf3", fontSize:12, letterSpacing:0.3 }}>{title}</h3>
            </div>
            {children}
        </div>
    );
    const ARow = ({ label, value }) => (
        <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0",
            borderBottom:"1px solid rgba(33,38,45,0.5)", fontSize:11 }}>
            <span style={{ color:"#484f58" }}>{label}</span>
            <span style={{ color:"#c9d1d9", textAlign:"right", marginLeft:16, wordBreak:"break-all" }}>{value}</span>
        </div>
    );
    const PBar = ({ value, color }) => (
        <div style={{ height:4, background:"#21262d", borderRadius:2, margin:"6px 0 10px" }}>
            <div style={{ height:4, background:color, borderRadius:2, width:value }}/>
        </div>
    );
    return (
        <div style={{ position:"fixed", top:44, left:0, right:0, bottom:0,
            background:"#07090e", zIndex:80, overflowY:"auto", padding:"20px 20px 40px" }}>
            <div style={{ maxWidth:1100, margin:"0 auto" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                    marginBottom:20, paddingBottom:14, borderBottom:"1px solid #21262d" }}>
                    <div>
                        <h1 style={{ fontSize:20, fontWeight:700, color:"#e6edf3" }}>System Information</h1>
                        <p style={{ color:"#484f58", fontSize:11, marginTop:3 }}>{Device?.Brand} {Device?.Model} — {Device?.DeviceName}</p>
                    </div>
                    <button onClick={onClose} style={{ background:"#161b22", border:"1px solid #30363d",
                        borderRadius:3, color:"#8b949e", padding:"5px 12px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>✕ Close</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:14 }}>
                    {Device && <ACard title="Device Identity" icon="◈">{Object.entries(Device).map(([k,v])=><ARow key={k} label={k} value={String(v)}/>)}</ACard>}
                    {ram && storage && (
                        <ACard title="System Resources" icon="▣">
                            <ARow label="RAM Total" value={ram.Total}/><ARow label="RAM Used" value={ram.Used}/>
                            <PBar value={ram.Usage} color="#1f6feb"/>
                            <ARow label="Storage Total" value={storage.Total}/><ARow label="Storage Free" value={storage.Free}/>
                            <PBar value={storage.Usage} color="#8957e5"/>
                            {Dashboard?.Display && Object.entries(Dashboard.Display).map(([k,v])=><ARow key={k} label={k} value={String(v)}/>)}
                        </ACard>
                    )}
                    {CPU && (
                        <ACard title="CPU" icon="⚙">
                            <ARow label="Processor"    value={CPU.Processor}/>
                            <ARow label="Architecture" value={CPU.Architecture}/>
                            <ARow label="Cores"        value={CPU.Cores}/>
                            <ARow label="Type"         value={CPU.CPUType}/>
                            {CPU.FrequencyRange && <ARow label="Frequency" value={CPU.FrequencyRange}/>}
                            {Array.isArray(CPU.CoreStatus) && (
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginTop:10 }}>
                                    {CPU.CoreStatus.map(c=>(
                                        <div key={c.Core} style={{ background:"#161b22", border:"1px solid #21262d",
                                            borderRadius:3, padding:"5px 8px", textAlign:"center", fontSize:10 }}>
                                            <div style={{ color:"#484f58" }}>Core {c.Core}</div>
                                            <div style={{ color:"#3fb950", fontWeight:700 }}>{c.CurrentFreq}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ACard>
                    )}
                    {Network && (
                        <ACard title="Network" icon="◎">
                            {Object.entries(Network).filter(([,v])=>v!=null&&v!=="").map(([k,v])=>(
                                <ARow key={k} label={k} value={Array.isArray(v)?v.join(", "):String(v)}/>
                            ))}
                        </ACard>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── DevicePage (root)
// ─────────────────────────────────────────────────────────────────────────────
export default function DevicePage() {
    const { DeviceId } = useParams();

    // ── State ──────────────────────────────────────────────────────────────────
    const [logs,         setLogs]         = useState([]);
    const [logCollapsed, setLogCollapsed] = useState(false);
    const [telemetry,    setTelemetry]    = useState(null);
    const [toasts, setToasts] = useState([]);

    // Indicators: "device" from telem heartbeat; stream/record/tunnel from ui_state
    const [indicators, setIndicators] = useState({ device:false, stream:false, record:false, tunnel:false });

    // Authoritative device UI state pushed by server after every state-changing ACK/NACK.
    // shape: { actions:{ stream:"IDLE"|"PROCESSING"|"ACTIVE"|"ERROR", record:"..." }, tunnels:{<name>:"..."} }
    const [uiState, setUiState] = useState(null);

    const [configOpen,   setConfigOpen]   = useState(false);
    const [aboutOpen,    setAboutOpen]    = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [mapVisible,   setMapVisible]   = useState(false);

    const [clientConfig, setClientConfig] = useState({ webrtc:true, mse:false, hfh264:false, highFpsSupported:false });
    const [streamMode,   setStreamMode]   = useState("webrtc");
    const [tunnelMode,   setTunnelMode]   = useState(null);
    const [tunnelNames,  setTunnelNames]  = useState([]);
    const [deviceInfo,   setDeviceInfo]   = useState(null);
    const [cameraRes,    setCameraRes]    = useState(null);

    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [rotation,  setRotation]  = useState(0);

    const videoRef        = useRef(null);
    const containerRef    = useRef(null);
    const iceServers      = useRef([...STUN_SERVERS]);
    const deviceIndicatorTimer = useRef(null);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const addLog = useCallback((type, message, details="") => {
        setLogs(prev => {
            const entry = { id:Date.now()+Math.random(), type, message, details };
            return [entry, ...prev].slice(0, MAX_LOGS);
        });
    }, []);

    // Apply server-pushed ui_state to local indicators and state
    const applyUiState = useCallback((payload) => {
        if (!payload) return;
        setUiState(payload);
        const actions = payload.actions ?? {};
        const tunnels = payload.tunnels ?? {};
        setIndicators(prev => ({
            ...prev,
            stream: actions.stream === "ACTIVE",
            record: actions.record === "ACTIVE",
            tunnel: Object.values(tunnels).some(s => s === "ACTIVE"),
        }));
    }, []);

    // ── Message handler ────────────────────────────────────────────────────────
    const handleMessage = useCallback((d) => {
        switch (d.type) {

            case "telem": {
                const t = parseTelemetry(d.hex);
                if (!t) break;
                setTelemetry(t);
                // flash device indicator with auto-off after 6s
                clearTimeout(deviceIndicatorTimer.current);
                setIndicators(prev => ({ ...prev, device:true }));
                deviceIndicatorTimer.current = setTimeout(
                    () => setIndicators(prev => ({ ...prev, device:false })), 6000
                );
                break;
            }

            // ── NEW: ui_state — authoritative stream/record/tunnel status ─────────
            // Sent by server after every ACK/NACK that mutates device state.
            // Format:
            //   { "type":"ui_state", "timestamp":...,
            //     "payload":{ "actions":{ "stream":"ACTIVE", "record":"IDLE" },
            //                 "tunnels":{ "bt-01":"IDLE", "usb-0":"ACTIVE" } } }
            case "ui_state": {
                console.log("[ui_state]", d.payload);
                applyUiState(d.payload);
                break;
            }

            // ACKs that carry data payloads
            case "ack": {
                switch (d.cmd) {
                    case "get_params": {
                        // { type:"ack", cmd:"get_params", params:{ high_fps_support, stream_type, is_params_set } }
                        const p = d.params;
                        if (p) {
                            addLog("info", "Params", `mode=${p.stream_type} set=${p.is_params_set} hfps=${p.high_fps_support}`);
                            // Sync client UI to what device reports
                            const mode = p.stream_type?.toLowerCase() === "webrtc" ? "webrtc"
                                : (p.stream_type?.toLowerCase() === "h264" || p.stream_type?.toLowerCase() === "hfh264") ? "mse"
                                    : "webrtc";
                            setStreamMode(mode);
                            setClientConfig(prev => ({
                                ...prev,
                                webrtc:   mode === "webrtc",
                                mse:      mode === "mse",
                                hfh264:   p.stream_type?.toLowerCase() === "hfh264",
                                highFpsSupported: !!p.high_fps_support,
                            }));
                        }
                        break;
                    }
                    case "get_tunnels": {
                        const list = d.tunnels ?? [];
                        setTunnelNames(list);
                        if (list.length > 0) {
                            const n = list[0].toLowerCase();
                            setTunnelMode(n.includes("bt")?"bt":n.includes("usb")?"usb":n);
                        }
                        break;
                    }
                    case "get_res":
                    case "get_stream_res":
                    case "get_record_res": {
                        // Real shape: { type:"ack", cmd:"get_res", params:{ cameraId, type, resolutions:[{width,height,fpsRanges}] } }
                        if (d.params?.resolutions) setCameraRes(d.params);
                        break;
                    }
                    case "webrtc_offer":
                        if (d.params?.sdp) handleOffer(d.params.sdp);
                        break;
                    case "webrtc_ice":
                        if (d.params) addIceCandidate(d.params);
                        break;
                    case "identity":
                        if (d.params) setDeviceInfo(d.params);
                        break;
                    default: break;
                }
                break;
            }

            case "nack": break; // already logged by useWebSocket onmessage

            // legacy fallback
            case "data": {
                if (d.cmd === "tunnels" && Array.isArray(d.tunnels)) setTunnelNames(d.tunnels);
                break;
            }

            default:
                console.log("[WS] unhandled type:", d.type);
        }
    }, [applyUiState, addLog]); // handleOffer/addIceCandidate added after hook init via ref

    const { connect, disconnect, sendCmd } = useWebSocket({ onLog:addLog, onMessage:handleMessage });
    const { initPc, closePc, handleOffer, addIceCandidate } = useWebRTC({
        iceServers:iceServers.current, videoRef, sendCmd, onLog:addLog,
    });

    useEffect(() => {
        connect(DeviceId);
        return () => { disconnect(); closePc(); clearTimeout(deviceIndicatorTimer.current); };
    }, [DeviceId]); // eslint-disable-line

    // ── Stream controls ────────────────────────────────────────────────────────
    // No revert callbacks — server pushes ui_state after every action, which is
    // the single source of truth for all button states.
    const startStream = useCallback(() => {
        if (streamMode === "webrtc") initPc();
        sendCmd({ cmd:"start_stream" });
    }, [streamMode, initPc, sendCmd]);

    const stopStream = useCallback(() => {
        sendCmd({ cmd:"stop_stream" });
        closePc();
    }, [sendCmd, closePc]);

    const startRecording = useCallback(() => {
        sendCmd({ cmd:"start_recording" });
    }, [sendCmd]);

    // Tunnel identified by name string
    const startTunnel = useCallback(() => {
        sendCmd({ cmd:"start_tunnel", tunnelName: tunnelNames[0] ?? "" });
    }, [sendCmd, tunnelNames]);

    const stopTunnel = useCallback(() => {
        sendCmd({ cmd:"stop_tunnel", tunnelName: tunnelNames[0] ?? "" });
    }, [sendCmd, tunnelNames]);

    // ── Quality controls — stream and record are separate commands ────────────
    const setStreamRes = useCallback((w, h, fps) => {
        sendCmd({ cmd:"set_stream_res", params:{ width:w, height:h, fps } });
    }, [sendCmd]);

    const setRecordRes = useCallback((w, h, fps) => {
        sendCmd({ cmd:"set_record_res", params:{ width:w, height:h, fps } });
    }, [sendCmd]);

    const setStreamBitrate = useCallback((kbps) => {
        sendCmd({ cmd:"set_stream_res", params:{ bitrate: kbps * 1000 } });
    }, [sendCmd]);

    const setRecordBitrate = useCallback((kbps) => {
        sendCmd({ cmd:"set_record_res", params:{ bitrate: kbps * 1000 } });
    }, [sendCmd]);

    // ── Video controls ─────────────────────────────────────────────────────────
    const applyTransform = useCallback((rot, flip) => {
        if (videoRef.current) videoRef.current.style.transform = `rotate(${rot}deg) scaleX(${flip?-1:1})`;
    }, []);

    const togglePlayPause = useCallback(() => {
        const next = !isVideoOn;
        setIsVideoOn(next);          // local toggle for instant feedback (play/pause is client-local)
        sendCmd({ cmd: next ? "play" : "pause" });
    }, [isVideoOn, sendCmd]);

    const toggleMute = useCallback(() => {
        const next = !isAudioOn;
        setIsAudioOn(next);          // local toggle — mute state not in ui_state
        sendCmd({ cmd: next ? "play" : "mute" });
    }, [isAudioOn, sendCmd]);

    const handleFlip = useCallback(() => {
        setIsFlipped(f => { applyTransform(rotation, !f); return !f; });
        sendCmd({ cmd:"flip" });
    }, [rotation, applyTransform, sendCmd]);

    const handleRotate = useCallback(() => {
        if (streamMode === "webrtc") {
            sendCmd({ cmd:"rotate" });
        } else {
            setRotation(r => { const next=(r+90)%360; applyTransform(next,isFlipped); return next; });
        }
    }, [streamMode, sendCmd, applyTransform, isFlipped]);

    const handleSwitchCamera = useCallback(() => {
        sendCmd({ cmd:"switch" });
    }, [sendCmd]);

    const handleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    }, []);

    // ── Config ─────────────────────────────────────────────────────────────────
    const handleSaveConfig = useCallback((cfg) => {
        // cfg.mode: "webrtc" | "h264" | "hfh264"
        const mode = cfg.mode === "webrtc" ? "webrtc" : "mse";
        setClientConfig(prev => ({ ...prev, webrtc: mode==="webrtc", mse: mode==="mse", hfh264: cfg.mode==="hfh264" }));
        setStreamMode(mode);
        if (cfg.turn?.length) {
            iceServers.current = [
                ...STUN_SERVERS,
                ...cfg.turn.map(t => ({ urls:t.url, username:t.user||undefined, credential:t.pass||undefined })),
            ];
        }
        // Tell device the stream type directly
        sendCmd({ cmd:"set_params", stream_type: cfg.mode });
        addLog("info", "Config", `Mode → ${cfg.mode.toUpperCase()}`);
    }, [sendCmd, addLog]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{GLOBAL_CSS}</style>

            <ClientConfigOverlay open={configOpen} config={clientConfig}
                                 onClose={() => setConfigOpen(false)} onSave={handleSaveConfig}/>

            <AboutOverlay open={aboutOpen} deviceInfo={deviceInfo}
                          onClose={() => setAboutOpen(false)}/>

            <ToastContainer toasts={toasts}/>

            <MiniMap lat={telemetry?.lat} lon={telemetry?.lon} accuracy={telemetry?.accuracy}
                     visible={mapVisible} onToggle={() => setMapVisible(v=>!v)}/>

            <Navbar onClientDetails={() => setAboutOpen(true)}/>

            <div style={{ display:"flex", height:"calc(100vh - 44px)", overflow:"hidden" }}>
                <main style={{ flex:1, padding:"10px 14px", overflowY:"auto", minWidth:0 }}>
                    <div style={{ position:"relative" }}>
                        <VideoPlayer
                            videoRef={videoRef} containerRef={containerRef}
                            indicators={indicators} isVideoOn={isVideoOn} isAudioOn={isAudioOn}
                            streamMode={streamMode}
                            onPlayPause={togglePlayPause} onMute={toggleMute}
                            onFlip={handleFlip} onRotate={handleRotate}
                            onSwitchCamera={handleSwitchCamera} onFullscreen={handleFullscreen}
                            onSettingsToggle={() => setSettingsOpen(s=>!s)}
                        />
                        <div style={{ position:"absolute", bottom:0, right:"2%" }}>
                            <SettingsPanel
                                open={settingsOpen}
                                cameraRes={cameraRes}
                                tunnelMode={tunnelMode}
                                tunnelNames={tunnelNames}
                                uiState={uiState}
                                onChangeSetup={() => { setConfigOpen(true); setSettingsOpen(false); }}
                                onStreamRes={setStreamRes}
                                onRecordRes={setRecordRes}
                                onStreamBitrate={setStreamBitrate}
                                onRecordBitrate={setRecordBitrate}
                                onStartRecord={startRecording}
                                onStartStream={startStream}
                                onStopStream={stopStream}
                                onStartTunnel={startTunnel}
                                onStopTunnel={stopTunnel}
                            />
                        </div>
                    </div>
                    <TelemetryBar telemetry={telemetry}/>
                </main>

                <LogPanel logs={logs} collapsed={logCollapsed}
                          onToggle={() => setLogCollapsed(c=>!c)}/>
            </div>
        </>
    );
}