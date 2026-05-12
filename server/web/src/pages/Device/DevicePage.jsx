// Devicge.jsx
// Root page — orchestrates state, message routing, and commands.
// No UI logic here; every visual concern lives in its feature folder.

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";

// shared
import { GLOBAL_CSS }        from "../../shared/theme.js";

// features / ws
import { useWebSocket }      from "./useWebSocket.js";
import { useWebRTC, DEFAULT_STUN } from "./useWebRTC.js";
import { useH264Player }     from "./useH264Player.js";

// features / video
import { VideoPlayer }       from "./VideoPlayer.jsx";

// features / telemetry
import { parseTelemetry }    from "./parseTelemetry.js";
import { TelemetryBar }      from "./TelemetryBar.jsx";

// features / settings
import { SettingsPanel }          from "./SettingsPanel.jsx";
import { ClientConfigOverlay }    from "./ClientConfigOverlay.jsx";

// features / overlays
import { Navbar }            from "./Navbar.jsx";
import { LogPanel, MAX_LOGS } from "./LogPanel.jsx";
import { AboutOverlay, ToastContainer } from "./AboutOverlay.jsx";

// features / map
import { MiniMap }           from "./MiniMap.jsx";

// ─────────────────────────────────────────────────────────────────────────────
export default function Devicge() {
    const { DeviceId } = useParams();

    // ── UI visibility ──────────────────────────────────────────────────────────
    const [logCollapsed, setLogCollapsed] = useState(false);
    const [configOpen,   setConfigOpen]   = useState(false);
    const [aboutOpen,    setAboutOpen]    = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [mapVisible,   setMapVisible]   = useState(false);

    // ── System state ───────────────────────────────────────────────────────────
    const [logs,        setLogs]        = useState([]);
    const [toasts]      = useState([]);
    const [telemetry,   setTelemetry]   = useState(null);
    const [indicators,  setIndicators]  = useState({ device: false, stream: false, record: false, tunnel: false });
    const [uiState,     setUiState]     = useState(null);

    // ── Stream / device config ─────────────────────────────────────────────────
    const [clientConfig, setClientConfig] = useState({ webrtc: true, mse: false, hfh264: false, highFpsSupported: false });
    const [streamMode,   setStreamMode]   = useState("webrtc");   // "webrtc" | "mse"
    const [tunnelMode,   setTunnelMode]   = useState(null);
    const [tunnelNames,  setTunnelNames]  = useState([]);
    const [deviceInfo,   setDeviceInfo]   = useState(null);
    const [cameraRes,    setCameraRes]    = useState(null);

    // ── Video playback state ───────────────────────────────────────────────────
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [rotation,  setRotation]  = useState(0);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const videoRef             = useRef(null);
    const containerRef         = useRef(null);
    const [iceServers, setIceServers] = useState([...DEFAULT_STUN]);
    const deviceIndicatorTimer = useRef(null);
    const rtcHandlersRef       = useRef({ handleSdp: null, addIceCandidate: null });

    // ── Logging ────────────────────────────────────────────────────────────────
    const addLog = useCallback((type, message, details = "") => {
        setLogs(prev => {
            const entry = { id: Date.now() + Math.random(), type, message, details };
            return [entry, ...prev].slice(0, MAX_LOGS);
        });
    }, []);

    // ── ui_state → indicators ──────────────────────────────────────────────────
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

    // ── Incoming message router ────────────────────────────────────────────────
    const handleMessage = useCallback((d) => {

        // New compact telemetry: { cmd:"t", d:"HEX" }
        if (d.cmd === "t") {
            const t = parseTelemetry(d.d);
            if (t) {
                setTelemetry(t);
                clearTimeout(deviceIndicatorTimer.current);
                setIndicators(prev => ({ ...prev, device: true }));
                deviceIndicatorTimer.current = setTimeout(
                    () => setIndicators(prev => ({ ...prev, device: false })), 6000
                );
            }
            return;
        }

        switch (d.type) {

            case "telem": {
                // Legacy: { type:"telem", hex:"..." }
                const t = parseTelemetry(d.hex ?? d.d);
                if (!t) break;
                setTelemetry(t);
                clearTimeout(deviceIndicatorTimer.current);
                setIndicators(prev => ({ ...prev, device: true }));
                deviceIndicatorTimer.current = setTimeout(
                    () => setIndicators(prev => ({ ...prev, device: false })), 6000
                );
                break;
            }

            case "ui_state":
                applyUiState(d.payload);
                break;

            case "request":
            case "response":
            case "ack": {
                const param = d.param ?? d.params ?? d.data;
                switch (d.cmd) {

                    case "get_params": {
                        const p = d.data ?? d.param ?? d.params;
                        if (!p) break;
                        const raw  = (p.Stream_mode ?? "NONE").toLowerCase();
                        const hfSupported = p.HFSupport === true
                            || String(p.HFSupport).toLowerCase() === "true"
                            || String(p.HFSupport) === "1";
                        const mode = raw === "webrtc" ? "webrtc"
                            : (raw === "h264" || raw === "hfh264") ? "mse"
                                : "none";
                        setStreamMode(mode);
                        setClientConfig(prev => ({
                            ...prev,
                            webrtc: mode === "webrtc",
                            mse:    mode === "mse",
                            hfh264: raw  === "hfh264",
                            highFpsSupported: hfSupported,
                        }));
                        if (mode === "none") addLog("warn", "Stream Disabled", "Device in NONE mode");
                        break;
                    }

                    case "get_tunnels": {
                        const list = d.data?.tunnels ?? d.tunnels ?? [];
                        setTunnelNames(list);
                        if (list.length > 0) {
                            const n = list[0].toLowerCase();
                            setTunnelMode(n.includes("bt") ? "bt" : n.includes("usb") ? "usb" : n);
                        }
                        break;
                    }

                    case "get_res":
                    case "get_stream_res":
                    case "get_record_res": {
                        if (d.data?.cameras)         setCameraRes(d.data);
                        else if (param?.resolutions) setCameraRes(param);
                        break;
                    }

                    case "webrtc_sdp":
                        rtcHandlersRef.current.handleSdp?.(param?.sdp, { cmdId: d.cmdId });
                        break;

                    case "webrtc_ice":
                        rtcHandlersRef.current.addIceCandidate?.(param?.candidate ?? param, { cmdId: d.cmdId });
                        break;

                    case "identity":     if (param)      setDeviceInfo(param);    break;

                    default: break;
                }
                break;
            }

            case "error":
            case "nack": break; // already logged by useWebSocket

            case "data": {
                if (d.cmd === "tunnels" && Array.isArray(d.tunnels)) setTunnelNames(d.tunnels);
                break;
            }

            default:
                console.log("[WS] unhandled type:", d.type);
        }
    }, [applyUiState, addLog]);

    // ── Hooks ──────────────────────────────────────────────────────────────────
    const {
        attachVideo,
        feedFrame,
        reset: resetH264Player,
    } = useH264Player();

    const {
        connect: connectControl,
        disconnect: disconnectControl,
        sendCmd,
    } = useWebSocket({ onLog: addLog, onMessage: handleMessage });

    const handleStreamMessage = useCallback(() => {}, []);

    const {
        connect: connectStream,
        disconnect: disconnectStream,
    } = useWebSocket({
        onLog: addLog,
        onMessage: handleStreamMessage,
        onBinary: feedFrame,
        bootstrapOnOpen: false,
    });

    const { startOffer, closePc, handleSdp, addIceCandidate } = useWebRTC({
        iceServers, videoRef, sendCmd, onLog: addLog,
    });

    useEffect(() => {
        rtcHandlersRef.current = { handleSdp, addIceCandidate };
    }, [handleSdp, addIceCandidate]);

    const isMseStream = clientConfig.mse;

    useEffect(() => {
        connectControl(DeviceId);
        return () => {
            disconnectControl();
            closePc();
            disconnectStream();
            resetH264Player();
            clearTimeout(deviceIndicatorTimer.current);
        };
    }, [DeviceId, connectControl, disconnectControl, closePc, disconnectStream, resetH264Player]);

    useEffect(() => {
        if (!isMseStream || !DeviceId) {
            disconnectStream();
            resetH264Player();
            return;
        }

        if (videoRef.current) {
            attachVideo(videoRef.current);
        }

        connectStream(DeviceId, "/ws/user/stream");

        return () => {
            disconnectStream();
            resetH264Player();
        };
    }, [DeviceId, isMseStream, connectStream, disconnectStream, attachVideo, resetH264Player]);

    // ── Stream commands ────────────────────────────────────────────────────────
    const startStream = useCallback(async () => {
        if (streamMode === "webrtc" && !await startOffer()) return;
        if (isMseStream && videoRef.current) attachVideo(videoRef.current);
        sendCmd({ cmd: "start_stream" });
    }, [streamMode, isMseStream, startOffer, attachVideo, sendCmd]);

    const stopStream = useCallback(() => {
        sendCmd({ cmd: "stop_stream" });
        if (streamMode === "webrtc") {
            closePc();
        } else {
            disconnectStream();
            resetH264Player();
        }
    }, [sendCmd, streamMode, closePc, disconnectStream, resetH264Player]);

    const startRecording = useCallback(() => sendCmd({ cmd: "start_recording" }), [sendCmd]);

    const startTunnel = useCallback(() =>
        sendCmd({ cmd: "start_tunnel", tunnelName: tunnelNames[0] ?? "" }), [sendCmd, tunnelNames]);

    const stopTunnel = useCallback(() =>
        sendCmd({ cmd: "stop_tunnel", tunnelName: tunnelNames[0] ?? "" }), [sendCmd, tunnelNames]);

    // ── Quality commands ───────────────────────────────────────────────────────
    const setStreamRes     = useCallback((w, h, fps) => sendCmd({ cmd: "set_stream_res", param: { res: { width: w, height: h, fps } } }), [sendCmd]);
    const setRecordRes     = useCallback((w, h, fps) => sendCmd({ cmd: "set_record_res", param: { res: { width: w, height: h, fps } } }), [sendCmd]);
    const setStreamBitrate = useCallback((kbps)      => sendCmd({ cmd: "set_stream_res", param: { bitrate: kbps * 1000 } }), [sendCmd]);
    const setRecordBitrate = useCallback((kbps)      => sendCmd({ cmd: "set_record_res", param: { bitrate: kbps * 1000 } }), [sendCmd]);

    // ── Video controls ─────────────────────────────────────────────────────────
    const togglePlayPause = useCallback(() => {
        const next = !isVideoOn;
        setIsVideoOn(next);
        sendCmd({ cmd: next ? "play" : "pause" });
    }, [isVideoOn, sendCmd]);

    const toggleMute = useCallback(() => {
        const next = !isAudioOn;
        setIsAudioOn(next);
        if (videoRef.current) videoRef.current.muted = !next;
        sendCmd({ cmd: next ? "play" : "mute" });
    }, [isAudioOn, sendCmd]);

    const handleFlip = useCallback(() => {
        setIsFlipped(f => !f);
        sendCmd({ cmd: "flip" });
    }, [sendCmd]);

    const handleRotate = useCallback(() => {
        setRotation(r => (r + 90) % 360);
        if (streamMode === "webrtc") {
            sendCmd({ cmd: "rotate" });
        }
    }, [streamMode, sendCmd]);

    const handleSwitchCamera = useCallback((camId = 0) => {
        const id = Number.isInteger(camId) ? camId : 0;
        sendCmd({ cmd: "switch", param: { camId: id } });
    }, [sendCmd]);

    const handleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    }, []);

    // ── Config overlay save ────────────────────────────────────────────────────
    const handleSaveConfig = useCallback((cfg) => {
        const isWebRTC = cfg.mode === "webrtc";
        const isMse    = cfg.mode === "h264" || cfg.mode === "hfh264";
        const isNone   = cfg.mode === "none";

        setClientConfig(prev => ({
            ...prev,
            webrtc: isWebRTC,
            mse:    isMse,
            hfh264: cfg.mode === "hfh264",
        }));
        setStreamMode(isWebRTC ? "webrtc" : isMse ? "mse" : "none");

        // Tear down whatever was previously active
        if (!isWebRTC) closePc();
        if (!isMse) { disconnectStream(); resetH264Player(); }

        if (cfg.turn?.length) {
            setIceServers([
                ...DEFAULT_STUN,
                ...cfg.turn.map(t => ({ urls: t.url, username: t.user || undefined, credential: t.pass || undefined })),
            ]);
        }
        sendCmd({ cmd: "set_params", param: { Stream_mode: cfg.mode.toUpperCase() } });
        addLog("info", "Config", `Mode → ${cfg.mode.toUpperCase()}`);
        if (isNone) addLog("warn", "Stream Disabled", "Device set to NONE mode");
    }, [sendCmd, addLog, closePc, disconnectStream, resetH264Player]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{GLOBAL_CSS}</style>

            {/* Modals */}
            <ClientConfigOverlay open={configOpen} config={clientConfig}
                                 onClose={() => setConfigOpen(false)} onSave={handleSaveConfig}/>

            <AboutOverlay open={aboutOpen} deviceInfo={deviceInfo}
                          onClose={() => setAboutOpen(false)}/>

            <ToastContainer toasts={toasts}/>

            {/* Map */}
            <MiniMap lat={telemetry?.lat} lon={telemetry?.lon} accuracy={telemetry?.accuracy}
                     visible={mapVisible} onToggle={() => setMapVisible(v => !v)}/>

            {/* Shell */}
            <Navbar onClientDetails={() => setAboutOpen(true)}/>

            <div style={{ display: "flex", height: "calc(100vh - 54px)", overflow: "hidden" }}>

                <main style={{
                    flex: 1,
                    padding: "12px 14px",
                    overflowY: "auto",
                    minWidth: 0,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}>
                    <div style={{ position: "relative", width: "100%", flex: "0 0 auto" }}>
                        <VideoPlayer
                            videoRef={videoRef} containerRef={containerRef}
                            indicators={indicators} streamMode={streamMode}
                            rotation={rotation} isFlipped={isFlipped}
                            isVideoOn={isVideoOn} isAudioOn={isAudioOn}
                            onPlayPause={togglePlayPause} onMute={toggleMute}
                            onFlip={handleFlip} onRotate={handleRotate}
                            onSwitchCamera={handleSwitchCamera} onFullscreen={handleFullscreen}
                            onSettingsToggle={() => setSettingsOpen(s => !s)}
                        >
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
                        </VideoPlayer>
                    </div>

                    <TelemetryBar telemetry={telemetry}/>
                </main>

                <LogPanel logs={logs} collapsed={logCollapsed}
                          onToggle={() => setLogCollapsed(c => !c)}/>
            </div>
        </>
    );
}