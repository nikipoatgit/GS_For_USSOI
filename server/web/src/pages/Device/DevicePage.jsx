// Device.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";

// shared
import { GLOBAL_CSS } from "../../shared/theme.js";

// features / ws
import { useWebSocket } from "./useWebSocket.js";
import { useWebRTC, DEFAULT_STUN } from "./useWebRTC.js";
import { useH264Player } from "./useH264Player.js";
import { useJpegPlayer } from "./useJpegPlayer.js";

// features / video
import { VideoPlayer } from "./VideoPlayer.jsx";

// features / telemetry
import { parseTelemetry } from "./parseTelemetry.js";
import { TelemetryBar } from "./TelemetryBar.jsx";

// features / settings
import { SettingsPanel } from "./SettingsPanel.jsx";
import { ClientConfigOverlay } from "./ClientConfigOverlay.jsx";

// features / overlays
import { Navbar } from "./Navbar.jsx";
import { LogPanel, MAX_LOGS } from "./LogPanel.jsx";
import { AboutOverlay, ToastContainer } from "./AboutOverlay.jsx";

// features / map
import { MiniMap } from "./MiniMap.jsx";

function normalizeStreamMode(rawMode) {
    const raw = String(rawMode ?? "NONE").toLowerCase();
    const isHighFps = raw === "hfh264" || raw === "hf_h264" || raw === "hspeed" || raw === "high_speed" || raw === "highspeed";

    if (raw === "webrtc") return { playerMode: "webrtc", highFpsMode: false };
    if (raw === "h264") return { playerMode: "mse", highFpsMode: false };
    if (isHighFps) return { playerMode: "mse", highFpsMode: true };
    return { playerMode: "none", highFpsMode: false };
}

export default function Device() {
    const { DeviceId } = useParams();

    // ── UI visibility ──────────────────────────────────────────────────────────
    const [logCollapsed, setLogCollapsed] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [mapVisible, setMapVisible] = useState(false);

    // ── System state ───────────────────────────────────────────────────────────
    const [logs, setLogs] = useState([]);
    const [toasts] = useState([]);
    const [telemetry, setTelemetry] = useState(null);
    const [indicators, setIndicators] = useState({ device: false, stream: false, record: false, tunnel: false });
    const [uiState, setUiState] = useState(null);

    // ── Stream / device config ─────────────────────────────────────────────────
    const [clientConfig, setClientConfig] = useState({ webrtc: true, mse: false, hfh264: false, highFpsSupported: false });
    const [streamMode, setStreamMode] = useState("webrtc");   
    const [tunnelMode, setTunnelMode] = useState(null);
    const [tunnelNames, setTunnelNames] = useState([]);
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [deviceInfoExtended, setDeviceInfoExtended] = useState(null); // <-- FIXED: Added missing state hook variable
    const [cameraRes, setCameraRes] = useState(null);

    // ── Video playback state ───────────────────────────────────────────────────
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [rotation, setRotation] = useState(0);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const videoRef = useRef(null);   // <video> element, used for webrtc mode
    const canvasRef = useRef(null);  // <canvas> element, used for mse/h264 mode (WebCodecs)
    const containerRef = useRef(null);
    const [iceServers, setIceServers] = useState([...DEFAULT_STUN]);
    const deviceIndicatorTimer = useRef(null);
    const rtcHandlersRef = useRef({ handleSdp: null, addIceCandidate: null });

    // ── Video Stats State ──────────────────────────────────────────────────────
    const [videoStats, setVideoStats] = useState({ fps: 0, latency: 0 });

    // ── Hooks instantiation ────────────────────────────────────────────────────
    const addLog = useCallback((type, message, details = "") => {
        setLogs(prev => {
            const entry = { id: Date.now() + Math.random(), type, message, details };
            return [entry, ...prev].slice(0, MAX_LOGS);
        });
    }, []);

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

    const applyTelemetry = useCallback((t) => {
        setTelemetry(t);
        clearTimeout(deviceIndicatorTimer.current);
        setIndicators(prev => ({
            ...prev,
            device: true,
            stream: t.streaming ?? prev.stream,
            record: t.recording ?? prev.record,
            tunnel: t.tunnel ?? prev.tunnel,
        }));
        deviceIndicatorTimer.current = setTimeout(
            () => setIndicators(prev => ({ ...prev, device: false })), 6000
        );
    }, []);

    // ── Incoming message router ────────────────────────────────────────────────
    const handleMessage = useCallback((d) => {
        switch (d.type) {
            case "telem": {
                const t = parseTelemetry(d.hex ?? d.d);
                if (!t) break;
                applyTelemetry(t);
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
                        const hfSupported = p.HFSupport === true
                            || String(p.HFSupport).toLowerCase() === "true"
                            || String(p.HFSupport) === "1";
                        const mode = normalizeStreamMode(p.Stream_mode);
                        setStreamMode(mode.playerMode);
                        setClientConfig(prev => ({
                            ...prev,
                            webrtc: mode.playerMode === "webrtc",
                            mse: mode.playerMode === "mse",
                            hfh264: mode.highFpsMode,
                            highFpsSupported: hfSupported,
                        }));
                        if (mode.playerMode === "none") addLog("warn", "Stream Disabled", "Device in NONE mode");
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
                    case "get_identity": {
                        if (d.data) {
                            setDeviceInfo({
                                Device: d.data.Device,
                                CPU: d.data.CPU,
                                Sim: d.data.Sim
                            });
                        }
                        break;
                    }
                    case "get_info": {
                        if (d.data) {
                            setDeviceInfoExtended(d.data); 
                        }
                        break;
                    }
                    case "get_res":
                    case "get_stream_res":
                    case "get_record_res": {
                        if (d.data?.cameras) setCameraRes(d.data);
                        else if (param?.resolutions) setCameraRes(param);
                        break;
                    }
                    case "webrtc_sdp":
                        rtcHandlersRef.current.handleSdp?.(param?.sdp, { cmdId: d.cmdId });
                        break;
                    case "webrtc_ice":
                        rtcHandlersRef.current.addIceCandidate?.(param?.candidate ?? param, { cmdId: d.cmdId });
                        break;
                    default: break;
                }
                break;
            }
            case "error":
            case "nack": break;
            case "data": {
                if (d.cmd === "tunnels" && Array.isArray(d.tunnels)) setTunnelNames(d.tunnels);
                break;
            }
            default:
                console.log("[WS] unhandled type:", d.type);
        }
    }, [applyTelemetry, applyUiState, addLog]);

    const { initDecoder: attachH264, feedFrame: feedH264, reset: resetH264 } = useH264Player(setVideoStats);
    const { initDecoder: attachJpeg, feedFrame: feedJpeg, reset: resetJpeg } = useJpegPlayer(setVideoStats);

    // hfh264 mode streams JPEG snapshots, not H264 NALs (see HFH264Media.java) —
    // route to the matching player. Everything downstream (attachVideo,
    // feedFrame, resetH264Player) keeps its old name so no other call site
    // in this file needs to change.
    const isHighFps = clientConfig.hfh264;
    const attachVideo = isHighFps ? attachJpeg : attachH264;
    const feedFrame = isHighFps ? feedJpeg : feedH264;
    const resetH264Player = useCallback(() => { resetH264(); resetJpeg(); }, [resetH264, resetJpeg]);
    const { connect: connectControl, disconnect: disconnectControl, sendCmd } = useWebSocket({ onLog: addLog, onMessage: handleMessage });
    
    // ── FIXED: fetchInfo declared down here so sendCmd dependency is fully initialized
    const fetchInfo = useCallback(() => {
        sendCmd({ cmd: "get_info" });
    }, [sendCmd]);

    const handleStreamMessage = useCallback(() => { }, []);
    const { connect: connectStream, disconnect: disconnectStream } = useWebSocket({
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
        if (canvasRef.current) attachVideo(canvasRef.current);
        connectStream(DeviceId, "/ws/user/stream");
        return () => {
            disconnectStream();
            resetH264Player();
        };
    }, [DeviceId, isMseStream, connectStream, disconnectStream, attachVideo, resetH264Player]);

    // ── Stream commands ────────────────────────────────────────────────────────
    const startStream = useCallback(async () => {
        if (isMseStream && DeviceId) connectStream(DeviceId, "/ws/user/stream");
        if (isMseStream && canvasRef.current) attachVideo(canvasRef.current);
        sendCmd({ cmd: "start_stream" });
        if (streamMode === "webrtc") await startOffer();
    }, [DeviceId, connectStream, streamMode, isMseStream, startOffer, attachVideo, sendCmd]);

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
    const stopRecording = useCallback(() => sendCmd({ cmd: "stop_recording" }), [sendCmd]);
    const startTunnel = useCallback(() => sendCmd({ cmd: "start_tunnel", tunnelName: tunnelNames[0] ?? "" }), [sendCmd, tunnelNames]);
    const stopTunnel = useCallback(() => sendCmd({ cmd: "stop_tunnel", tunnelName: tunnelNames[0] ?? "" }), [sendCmd, tunnelNames]);

    // ── Quality commands ───────────────────────────────────────────────────────
    const setStreamRes = useCallback((w, h, fps) => sendCmd({ cmd: "set_stream_res", param: { res: { width: w, height: h, fps } } }), [sendCmd]);
    const setRecordRes = useCallback((w, h, fps) => sendCmd({ cmd: "set_record_res", param: { res: { width: w, height: h, fps } } }), [sendCmd]);
    const setStreamBitrate = useCallback((kbps) => sendCmd({ cmd: "set_stream_res", param: { bitrate: kbps * 1000 } }), [sendCmd]);
    const setRecordBitrate = useCallback((kbps) => sendCmd({ cmd: "set_record_res", param: { bitrate: kbps * 1000 } }), [sendCmd]);

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
        sendCmd({ cmd: "mute", param: { state: !next } });
    }, [isAudioOn, sendCmd]);

    const handleFlip = useCallback(() => {
        setIsFlipped(f => !f);
        sendCmd({ cmd: "flip" });
    }, [sendCmd]);

    const handleRotate = useCallback(() => {
        setRotation(r => (r + 90) % 360);
        if (streamMode === "webrtc") sendCmd({ cmd: "rotate" });
    }, [streamMode, sendCmd]);

    const [currentCamId, setCurrentCamId] = useState(0);

    const handleSwitchCamera = useCallback(() => {
        const cameras = cameraRes?.cameras ?? [];
        if (cameras.length === 0) return;
        const currentIndex = cameras.findIndex(c => Number(c.cameraId) === currentCamId);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % cameras.length;
        const nextCamId = Number(cameras[nextIndex].cameraId);
        setCurrentCamId(nextCamId);
        sendCmd({ cmd: "switch", param: { camId: nextCamId } });
    }, [cameraRes, currentCamId, sendCmd]);

    const handleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    }, []);

    const handleSaveConfig = useCallback((cfg) => {
        const isWebRTC = cfg.mode === "webrtc";
        const isMse = cfg.mode === "h264" || cfg.mode === "hfh264";
        const isNone = cfg.mode === "none";

        setClientConfig(prev => ({
            ...prev,
            webrtc: isWebRTC,
            mse: isMse,
            hfh264: cfg.mode === "hfh264",
        }));
        setStreamMode(isWebRTC ? "webrtc" : isMse ? "mse" : "none");

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

    return (
        <>
            <style>{GLOBAL_CSS}</style>

            <ClientConfigOverlay open={configOpen} config={clientConfig}
                onClose={() => setConfigOpen(false)} onSave={handleSaveConfig} />

            <AboutOverlay
                open={aboutOpen}
                deviceInfo={deviceInfo}
                extendedInfo={deviceInfoExtended}
                onFetchInfo={fetchInfo}
                onClose={() => setAboutOpen(false)}
            />

            <ToastContainer toasts={toasts} />

            <MiniMap lat={telemetry?.lat} lon={telemetry?.lon} accuracy={telemetry?.accuracy}
                visible={mapVisible} onToggle={() => setMapVisible(v => !v)} />

            <Navbar onClientDetails={() => setAboutOpen(true)} />

            <div style={{ display: "flex", height: "calc(100vh - 54px)", overflow: "hidden" }}>
                <main style={{
                    flex: 1, padding: "12px 14px", overflowY: "auto",
                    minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", gap: 8,
                }}>
                    <div style={{ position: "relative", width: "100%", flex: "0 0 auto" }}>
                        <VideoPlayer
                            videoRef={videoRef} canvasRef={canvasRef} containerRef={containerRef}
                            indicators={indicators} streamMode={streamMode}
                            rotation={rotation} isFlipped={isFlipped}
                            isVideoOn={isVideoOn} isAudioOn={isAudioOn}
                            onPlayPause={togglePlayPause} onMute={toggleMute}
                            onFlip={handleFlip} onRotate={handleRotate}
                            onSwitchCamera={handleSwitchCamera} onFullscreen={handleFullscreen}
                            onSettingsToggle={() => setSettingsOpen(s => !s)}
                            currentCamId={currentCamId}
                            videoStats={videoStats}
                        >
                            <SettingsPanel
                                open={settingsOpen}
                                cameraRes={cameraRes}
                                streamMode={streamMode}
                                highFpsMode={clientConfig.hfh264}
                                tunnelMode={tunnelMode}
                                tunnelNames={tunnelNames}
                                uiState={uiState}
                                onChangeSetup={() => { setConfigOpen(true); setSettingsOpen(false); }}
                                onStreamRes={setStreamRes}
                                onRecordRes={setRecordRes}
                                onStreamBitrate={setStreamBitrate}
                                onRecordBitrate={setRecordBitrate}
                                onStartRecord={startRecording}
                                onStopRecord={stopRecording}
                                onStartStream={startStream}
                                onStopStream={stopStream}
                                onStartTunnel={startTunnel}
                                onStopTunnel={stopTunnel}
                                addLog={addLog}
                            />
                        </VideoPlayer>
                    </div>
                    <TelemetryBar telemetry={telemetry} />
                </main>

                <LogPanel logs={logs} collapsed={logCollapsed} onToggle={() => setLogCollapsed(c => !c)} />
            </div>
        </>
    );
}