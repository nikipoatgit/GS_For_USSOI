// ─── pages/Device/DevicePage.jsx ─────────────────────────────────────────────
// GCS Control Panel — root component for /Device/:DeviceId
// Replaces gcs/App.jsx — all imports are relative to pages/Device/

import {useState, useEffect, useRef, useCallback} from "react";
import {useParams} from "react-router-dom";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import {useWebSocket} from "./hooks/useWebSocket.js";
import {useWebRTC} from "./hooks/useWebRTC.js";

// ── Components ────────────────────────────────────────────────────────────────
import {Navbar} from "./components/Navbar.jsx";
import {LogPanel} from "./components/LogPanel.jsx";
import {VideoPlayer} from "./components/VideoPlayer.jsx";
import {TelemetryBar} from "./components/TelemetryBar.jsx";
import {SettingsPanel} from "./components/SettingsPanel.jsx";
import {ClientConfigOverlay} from "./components/ClientConfigOverlay.jsx";
import {AboutOverlay} from "./components/AboutOverlay.jsx";
import {MiniMap} from "./components/MiniMap.jsx";
import {ToastContainer} from "./components/ToastContainer.jsx";

// ── Utils ─────────────────────────────────────────────────────────────────────
import {GLOBAL_CSS} from "./utils/styles.js";
import {STUN_SERVERS, MAX_LOGS} from "./utils/constants.js";
import {parseTelemetry} from "./utils/helpers.js";

// ─────────────────────────────────────────────────────────────────────────────

export default function DevicePage() {

    // ── Read device ID from route (/Device/:DeviceId) ───────────────────────────
    const {DeviceId} = useParams();

    // ── UI state ─────────────────────────────────────────────────────────────────
    const [logs, setLogs] = useState([]);
    const [logCollapsed, setLogCollapsed] = useState(false);
    const [telemetry, setTelemetry] = useState(null);
    const [indicators, setIndicators] = useState({
        device: false, stream: false, record: false, tunnel: false,
    });
    const [toasts, setToasts] = useState([]);

    // ── Overlay / panel state ─────────────────────────────────────────────────────
    const [configOpen, setConfigOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [mapVisible, setMapVisible] = useState(false);

    // ── Device / stream state ─────────────────────────────────────────────────────
    const [clientConfig, setClientConfig] = useState({webrtc: true, mse: false, local: false});
    const [streamMode, setStreamMode] = useState("webrtc"); // "webrtc" | "mse" | "local"
    const [tunnelMode, setTunnelMode] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [cameraRes, setCameraRes] = useState(null);

    // ── Video transform state ──────────────────────────────────────────────────────
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [rotation, setRotation] = useState(0);

    // ── Refs ──────────────────────────────────────────────────────────────────────
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const iceServers = useRef([...STUN_SERVERS]);
    const indicatorTimers = useRef({});

    // ════════════════════════════════════════════════════════════════════════════
    // LOG helper
    // ════════════════════════════════════════════════════════════════════════════
    const addLog = useCallback((type, message, details = "") => {
        console.log(`[LOG][${type.toUpperCase()}] ${message} | ${details}`);
        setLogs((prev) => {
            const entry = {id: Date.now() + Math.random(), type, message, details};
            return [entry, ...prev].slice(0, MAX_LOGS);
        });
    }, []);

    // ════════════════════════════════════════════════════════════════════════════
    // TOAST helper
    // ════════════════════════════════════════════════════════════════════════════
    const showToast = useCallback((message, duration = 2200) => {
        console.log("[Toast]", message);
        const id = Date.now();
        setToasts((t) => [...t, {id, message}]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
    }, []);

    // ════════════════════════════════════════════════════════════════════════════
    // INDICATOR helper
    // ════════════════════════════════════════════════════════════════════════════
    const updateIndicator = useCallback((id, active) => {
        clearTimeout(indicatorTimers.current[id]);
        setIndicators((prev) => ({...prev, [id]: active}));
        if (active) {
            indicatorTimers.current[id] = setTimeout(() => {
                setIndicators((prev) => ({...prev, [id]: false}));
            }, 6000);
        }
    }, []);

    // ════════════════════════════════════════════════════════════════════════════
    // WS MESSAGE HANDLER
    // ════════════════════════════════════════════════════════════════════════════
    const handleMessage = useCallback((d) => {
        switch (d.type) {

            case "state": {
                const c = d.controls;
                if (!c) break;
                updateIndicator("stream", c.stream === 1);
                updateIndicator("record", c.record === 1);
                const tunnelActive = Array.isArray(c.tunnel) && c.tunnel.some((v) => v === 1);
                updateIndicator("tunnel", tunnelActive);
                setIsStreaming(c.stream === 1);
                setIsRecording(c.record === 1);
                console.log("[State]", c);
                break;
            }

            case "data": {
                switch (d.cmd) {

                    case "update_telem": {
                        const t = parseTelemetry(d.hex);
                        if (!t) break;
                        console.log("[Telem] decoded:", t);
                        setTelemetry(t);
                        updateIndicator("device", true);
                        updateIndicator("tunnel", (t.status & 0x1) !== 0);
                        updateIndicator("stream", (t.status & 0x2) !== 0);
                        updateIndicator("record", (t.status & 0x4) !== 0);
                        break;
                    }

                    case "tunnels": {
                        const mode = d.tunnels?.[0] ?? "none";
                        console.log("[Tunnels] mode →", mode, "all:", d.tunnels);
                        setTunnelMode(mode);
                        break;
                    }

                    case "webrtc_answer": {
                        console.log("[WebRTC] answer SDP received");
                        handleOffer(d.payload?.sdp);
                        break;
                    }

                    case "webrtc_ice": {
                        console.log("[WebRTC] remote ICE candidate received");
                        addIceCandidate(d.payload);
                        break;
                    }

                    case "stream_res":
                    case "record_res": {
                        console.log(`[${d.cmd}] params:`, d.params);
                        break;
                    }

                    default:
                        console.log("[WS data] unhandled cmd:", d.cmd);
                }
                break;
            }

            case "deviceInfo": {
                console.log("[DeviceInfo] received:", d.info);
                setDeviceInfo(d.info);
                break;
            }

            case "camRes": {
                console.log("[CamRes] received:", d.cameraResolutions);
                setCameraRes(d.cameraResolutions);
                break;
            }

            default:
                console.log("[WS] unhandled type:", d.type);
        }
    }, [updateIndicator]);

    // ════════════════════════════════════════════════════════════════════════════
    // HOOKS
    // ════════════════════════════════════════════════════════════════════════════
    const {connect, disconnect, sendCmd} = useWebSocket({
        onLog: addLog,
        onMessage: handleMessage,
    });

    const {initPc, closePc, handleOffer, addIceCandidate} = useWebRTC({
        iceServers: iceServers.current,
        videoRef,
        sendCmd,
        onLog: addLog,
    });

    // ════════════════════════════════════════════════════════════════════════════
    // LIFECYCLE — connect with DeviceId from route
    // ════════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        console.log("[DevicePage] mounting — DeviceId:", DeviceId);
        connect(DeviceId);
        return () => {
            console.log("[DevicePage] unmounting");
            disconnect();
            closePc();
        };
    }, [DeviceId]);

    // ════════════════════════════════════════════════════════════════════════════
    // STREAM CONTROLS
    // ════════════════════════════════════════════════════════════════════════════
    const startStream = useCallback(() => {
        console.log("[Stream] starting — mode:", streamMode);
        if (streamMode === "webrtc") initPc();
        sendCmd(
            {type: "cmd", cmd: "start_stream"},
            () => {
                addLog("error", "Start Stream", "device did not ACK");
                setIsStreaming(false);
            }
        );
        setIsStreaming(true);
    }, [streamMode, initPc, sendCmd, addLog]);

    const stopStream = useCallback(() => {
        console.log("[Stream] stopping");
        sendCmd(
            {type: "cmd", cmd: "stop_stream"},
            () => setIsStreaming(true)
        );
        closePc();
        setIsStreaming(false);
    }, [sendCmd, closePc]);

    const startRecording = useCallback(() => {
        console.log("[Record] starting");
        sendCmd(
            {type: "cmd", cmd: "start_recording"},
            () => {
                addLog("error", "Recording", "device did not ACK");
                setIsRecording(false);
            }
        );
    }, [sendCmd, addLog]);

    const startTunnel = useCallback(() => {
        console.log("[Tunnel] start");
        sendCmd({type: "cmd", cmd: "start_tunnel", tunnelId: 0});
    }, [sendCmd]);

    const stopTunnel = useCallback(() => {
        console.log("[Tunnel] stop");
        sendCmd({type: "cmd", cmd: "stop_tunnel", tunnelId: 0});
    }, [sendCmd]);

    // ════════════════════════════════════════════════════════════════════════════
    // QUALITY CONTROLS
    // ════════════════════════════════════════════════════════════════════════════
    const setQuality = useCallback((w, h, fps) => {
        console.log(`[Quality] set → ${w}x${h} @${fps}fps`);
        sendCmd(
            {type: "cmd", cmd: "set_stream_res", params: {width: w, height: h, fps, bitrate: 1000}},
            () => addLog("error", "Quality", "device did not ACK")
        );
    }, [sendCmd, addLog]);

    const setBitrate = useCallback((kbps) => {
        console.log(`[Bitrate] set → ${kbps} KBps`);
        sendCmd(
            {type: "cmd", cmd: "set_stream_res", params: {width: 1280, height: 720, fps: 30, bitrate: kbps * 1000 * 8}},
            () => addLog("error", "Bitrate", "device did not ACK")
        );
    }, [sendCmd, addLog]);

    // ════════════════════════════════════════════════════════════════════════════
    // VIDEO CONTROLS
    // ════════════════════════════════════════════════════════════════════════════
    const applyTransform = useCallback((rot, flip) => {
        if (videoRef.current) {
            const xform = `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`;
            console.log("[Video] transform →", xform);
            videoRef.current.style.transform = xform;
        }
    }, []);

    const togglePlayPause = useCallback(() => {
        const next = !isVideoOn;
        console.log("[Video] play/pause →", next ? "play" : "pause");
        setIsVideoOn(next);
        sendCmd(
            {type: "cmd", cmd: next ? "play" : "pause"},
            () => {
                setIsVideoOn(isVideoOn);
                addLog("error", "Video", "device did not ACK");
            }
        );
    }, [isVideoOn, sendCmd, addLog]);

    const toggleMute = useCallback(() => {
        const next = !isAudioOn;
        console.log("[Audio] mute →", next ? "unmute" : "mute");
        setIsAudioOn(next);
        sendCmd(
            {type: "cmd", cmd: next ? "play" : "mute"},
            () => setIsAudioOn(isAudioOn)
        );
    }, [isAudioOn, sendCmd]);

    const handleFlip = useCallback(() => {
        setIsFlipped((f) => {
            applyTransform(rotation, !f);
            return !f;
        });
    }, [rotation, applyTransform]);

    const handleRotate = useCallback(() => {
        if (streamMode === "webrtc") {
            sendCmd(
                {type: "cmd", cmd: "rotate"},
                () => addLog("error", "Rotate", "device did not ACK")
            );
        } else {
            setRotation((r) => {
                const next = (r + 90) % 360;
                applyTransform(next, isFlipped);
                return next;
            });
        }
    }, [streamMode, sendCmd, addLog, applyTransform, isFlipped]);

    const handleSwitchCamera = useCallback(() => {
        console.log("[Camera] switch");
        sendCmd(
            {type: "cmd", cmd: "rotate"},
            () => addLog("error", "Camera Switch", "device did not ACK")
        );
    }, [sendCmd, addLog]);

    const handleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    // ════════════════════════════════════════════════════════════════════════════
    // CONFIG SAVE
    // ════════════════════════════════════════════════════════════════════════════
    const handleSaveConfig = useCallback((cfg) => {
        console.log("[Config] saved:", cfg);
        const mode = cfg.webrtc ? "webrtc" : cfg.mse ? "mse" : "local";
        setClientConfig({webrtc: cfg.webrtc, mse: cfg.mse, local: cfg.local});
        setStreamMode(mode);
        if (cfg.turn?.length) {
            iceServers.current = [
                ...STUN_SERVERS,
                ...cfg.turn.map((t) => ({
                    urls: t.url,
                    username: t.user || undefined,
                    credential: t.pass || undefined,
                })),
            ];
            console.log("[Config] ICE servers updated:", iceServers.current);
        }
        addLog("info", "Config", `Mode → ${mode.toUpperCase()}`);
    }, [addLog]);

    // ════════════════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════════════════
    return (
        <>
            <style>{GLOBAL_CSS}</style>

            <ClientConfigOverlay
                open={configOpen}
                config={clientConfig}
                onClose={() => setConfigOpen(false)}
                onSave={handleSaveConfig}
            />

            <AboutOverlay
                open={aboutOpen}
                deviceInfo={deviceInfo}
                onClose={() => setAboutOpen(false)}
            />

            <ToastContainer toasts={toasts}/>

            <MiniMap
                lat={telemetry?.lat}
                lon={telemetry?.lon}
                accuracy={telemetry?.accuracy}
                visible={mapVisible}
                onToggle={() => setMapVisible((v) => !v)}
            />

            <Navbar onClientDetails={() => setAboutOpen(true)}/>

            <div
                style={{
                    display: "flex",
                    height: "calc(100vh - 44px)",
                    overflow: "hidden",
                }}
            >
                {/* ── Main content ── */}
                <main
                    style={{
                        flex: 1,
                        padding: "10px 14px",
                        overflowY: "auto",
                        minWidth: 0,
                    }}
                >
                    <div style={{position: "relative"}}>
                        <VideoPlayer
                            videoRef={videoRef}
                            containerRef={containerRef}
                            indicators={indicators}
                            isVideoOn={isVideoOn}
                            isAudioOn={isAudioOn}
                            streamMode={streamMode}
                            onPlayPause={togglePlayPause}
                            onMute={toggleMute}
                            onFlip={handleFlip}
                            onRotate={handleRotate}
                            onSwitchCamera={handleSwitchCamera}
                            onFullscreen={handleFullscreen}
                            onSettingsToggle={() => setSettingsOpen((s) => !s)}
                        />

                        <div
                            style={{
                                position: "absolute",
                                bottom: 0,
                                right: "2%",
                            }}
                        >
                            <SettingsPanel
                                open={settingsOpen}
                                cameraResolutions={cameraRes}
                                tunnelMode={tunnelMode}
                                streamMode={streamMode}
                                isRecording={isRecording}
                                onChangeSetup={() => {
                                    setConfigOpen(true);
                                    setSettingsOpen(false);
                                }}
                                onQuality={setQuality}
                                onBitrate={setBitrate}
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

                {/* ── Log sidebar ── */}
                <LogPanel
                    logs={logs}
                    collapsed={logCollapsed}
                    onToggle={() => setLogCollapsed((c) => !c)}
                />
            </div>
        </>
    );
}
