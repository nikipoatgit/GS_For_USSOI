// features/video/VideoPlayer.jsx
// Video canvas + overlay controls. Hover to reveal control bar.
// Visual style matches code.html (Tailwind + Material Symbols).

import { C, FONT } from "../../shared/theme.js";

// ─── Inject required styles once ────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  .vp-blink { animation: blink 2s cubic-bezier(0.4,0,0.6,1) infinite; }
  .vp-live-blink { animation: blink 2s cubic-bezier(0.4,0,0.6,1) infinite; }

  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
    font-size: 22px;
    line-height: 1;
    user-select: none;
  }

  .vp-ctrl-bar {
    opacity: 0;
    transition: opacity 0.3s;
  }
  .vp-root:hover .vp-ctrl-bar {
    opacity: 1;
  }

  .vp-icon-btn {
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 9999px;
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s;
    font-family: inherit;
  }
  .vp-icon-btn:hover { background: rgba(255,255,255,0.15); }

  .vp-play-btn {
    background: rgba(255,255,255,0.1);
  }
  .vp-play-btn:hover { background: rgba(255,255,255,0.22); }
`;

let _stylesInjected = false;
function injectStyles() {
    if (_stylesInjected || typeof document === "undefined") return;
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    _stylesInjected = true;
}

// ─── Stream mode icon (WebRTC coloured dots / H264 label) ────────────────────
function ModeIcon({ mode }) {
    if (mode === "webrtc") return (
        <div style={{ display: "flex", gap: 3, alignItems: "center", marginRight: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4285F4", display: "inline-block" }}/>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EA4335", display: "inline-block" }}/>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34A853", display: "inline-block" }}/>
        </div>
    );
    if (mode === "mse") return (
        <span style={{
            fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 1,
            marginRight: 4, fontFamily: FONT,
        }}>H264</span>
    );
    return null;
}

// ─── Single status indicator pill entry ─────────────────────────────────────
function Indicator({ id, active }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
          className={active ? "vp-blink" : undefined}
          style={{
              width: 6, height: 6, borderRadius: "50%", display: "inline-block",
              background: active ? "#22c55e" : "#737686",
          }}
      />
            <span style={{
                fontSize: 10, fontWeight: 700, color: "#fff",
                letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: FONT,
                opacity: active ? 1 : 0.4,
            }}>{id}</span>
        </div>
    );
}

// ─── Status row (top-right) ──────────────────────────────────────────────────
function StatusRow({ indicators, streamMode }) {
    return (
        <div style={{
            position: "absolute", top: 16, right: 16,
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            padding: "6px 12px",
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.1)",
        }}>
            <ModeIcon mode={streamMode}/>
            {["device", "stream", "record", "tunnel"].map(id => (
                <Indicator key={id} id={id} active={!!indicators[id]}/>
            ))}
        </div>
    );
}

// ─── Control bar (bottom, revealed on hover) ─────────────────────────────────
function ControlBar({ isVideoOn, isAudioOn, onPlayPause, onMute, onFlip, onRotate, onSwitchCamera, onFullscreen, onSettingsToggle }) {
    return (
        <div
            className="vp-ctrl-bar"
            style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "32px 16px 16px",
                background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
            }}
        >

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                {/* Play / Pause */}
                <button className="vp-icon-btn vp-play-btn" onClick={onPlayPause} title={isVideoOn ? "Pause" : "Play"}>
        <span className="material-symbols-outlined">
            {isVideoOn ? "pause" : "play_arrow"}
        </span>
                </button>

                {/* Right-side controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button className="vp-icon-btn" onClick={onSwitchCamera} title="Switch Camera">
                        <span className="material-symbols-outlined">switch_video</span>
                    </button>

                    <button className="vp-icon-btn" onClick={onRotate} title="Rotate">
                        <span className="material-symbols-outlined">rotate_right</span>
                    </button>

                    <button className="vp-icon-btn" onClick={onFlip} title="Flip">
                        <span className="material-symbols-outlined">flip</span>
                    </button>

                    <button className="vp-icon-btn" onClick={onMute} title={isAudioOn ? "Mute" : "Unmute"}>
            <span className="material-symbols-outlined">
                {isAudioOn ? "volume_up" : "volume_off"}
            </span>
                    </button>

                    <button className="vp-icon-btn" onClick={onSettingsToggle} title="Settings">
                        <span className="material-symbols-outlined">settings</span>
                    </button>

                    <button className="vp-icon-btn" onClick={onFullscreen} title="Fullscreen">
                        <span className="material-symbols-outlined">fullscreen</span>
                    </button>
                </div>
            </div>

        </div>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function VideoPlayer({
                                videoRef, containerRef, indicators, streamMode,
                                rotation = 0, isFlipped = false,
                                isVideoOn, isAudioOn,
                                onPlayPause, onMute, onFlip, onRotate,
                                onSwitchCamera, onFullscreen, onSettingsToggle,
                                children,
                            }) {
    injectStyles();

    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const fitScale = normalizedRotation === 90 || normalizedRotation === 270 ? 9 / 16 : 1;
    const videoTransform = `rotate(${normalizedRotation}deg) scaleX(${isFlipped ? -1 : 1}) scale(${fitScale})`;

    return (
        <div
            id="video-container"
            ref={containerRef}
            className="vp-root"
            style={{
                position: "relative",
                width: "100%",
                margin: "0 auto",
                aspectRatio: "16 / 9",
                background: "#000",
                borderRadius: 18,
                overflow: "hidden",
                boxShadow: "0 18px 48px rgba(0,0,0,0.42)",
                border: `1px solid ${C.lineMd}`,
                fontFamily: FONT,
                transition: "border-radius 0.18s ease, box-shadow 0.18s ease",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
            }}
        >
            {/* WebRTC uses <video>; H264/MSE uses <canvas> decoded via WebCodecs */}
            {streamMode === "mse" ? (
                <canvas
                    ref={videoRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                        transform: videoTransform,
                        transformOrigin: "center center",
                        transition: "transform 0.18s ease",
                    }}
                />
            ) : (
                <video
                    ref={videoRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                        transform: videoTransform,
                        transformOrigin: "center center",
                        transition: "transform 0.18s ease",
                    }}
                    autoPlay
                    playsInline
                    muted
                />
            )}

            {/* Status indicators */}
            <StatusRow indicators={indicators} streamMode={streamMode}/>

            {children}

            {/* Controls */}
            <ControlBar
                isVideoOn={isVideoOn}
                isAudioOn={isAudioOn}
                onPlayPause={onPlayPause}
                onMute={onMute}
                onFlip={onFlip}
                onRotate={onRotate}
                onSwitchCamera={onSwitchCamera}
                onFullscreen={onFullscreen}
                onSettingsToggle={onSettingsToggle}
            />
        </div>
    );
}
