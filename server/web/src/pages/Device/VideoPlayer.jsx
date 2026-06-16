// features/video/VideoPlayer.jsx

import { C, FONT } from "../../shared/theme.js";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

@keyframes blink {
  0%,100% { opacity:1; }
  50% { opacity:0.4; }
}

.vp-blink {
  animation: blink 2s cubic-bezier(0.4,0,0.6,1) infinite;
}

.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;

  font-size: 22px;
  line-height: 1;
  user-select: none;
}

.vp-root:hover .vp-ctrl-bar {
  opacity: 1;
}

.vp-ctrl-bar {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.vp-icon-btn {
  width: 40px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: none;
  border-radius: 999px;

  background: transparent;
  color: white;

  cursor: pointer;
}

.vp-icon-btn:hover {
  background: rgba(255,255,255,0.14);
}
`;

let stylesInjected = false;

function injectStyles() {
    if (stylesInjected || typeof document === "undefined") return;

    const style = document.createElement("style");
    style.textContent = STYLES;

    document.head.appendChild(style);

    stylesInjected = true;
}

function ModeIcon({ mode }) {
    if (mode === "webrtc") {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    marginRight: 4,
                }}
            >
                <span style={dot("#4285F4")} />
                <span style={dot("#EA4335")} />
                <span style={dot("#34A853")} />
            </div>
        );
    }

    if (mode === "mse") {
        return (
            <span
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: "#fff",
                    marginRight: 4,
                    fontFamily: FONT,
                }}
            >
        H264
      </span>
        );
    }

    return null;
}

function dot(background) {
    return {
        width: 6,
        height: 6,
        borderRadius: "50%",
        background,
        display: "inline-block",
    };
}

function Indicator({ id, active }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
            }}
        >
      <span
          className={active ? "vp-blink" : ""}
          style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              display: "inline-block",
              background: active ? "#22c55e" : "#737686",
          }}
      />

            <span
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#fff",
                    opacity: active ? 1 : 0.4,
                    fontFamily: FONT,
                }}
            >
        {id}
      </span>
        </div>
    );
}

function StatusRow({ indicators, streamMode }) {
    return (
        <div
            style={{
                position: "absolute",
                top: 16,
                right: 16,

                display: "flex",
                alignItems: "center",
                gap: 12,

                padding: "6px 12px",

                borderRadius: 999,

                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(12px)",

                border: "1px solid rgba(255,255,255,0.1)",

                zIndex: 20,
            }}
        >
            <ModeIcon mode={streamMode} />

            {["device", "stream", "record", "tunnel"].map((id) => (
                <Indicator
                    key={id}
                    id={id}
                    active={!!indicators?.[id]}
                />
            ))}
        </div>
    );
}

function ControlBar({
                        isVideoOn,
                        isAudioOn,
                        currentCamId,

                        onPlayPause,
                        onMute,
                        onFlip,
                        onRotate,
                        onSwitchCamera,
                        onFullscreen,
                        onSettingsToggle,
                    }) {
    return (
        <div
            className="vp-ctrl-bar"
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,

                padding: "32px 16px 16px",

                background:
                    "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",

                zIndex: 30,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <button
                    className="vp-icon-btn"
                    onClick={onPlayPause}
                >
          <span className="material-symbols-outlined">
            {isVideoOn ? "pause" : "play_arrow"}
          </span>
                </button>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    <button
                        className="vp-icon-btn"
                        onClick={onSwitchCamera}
                        title="Switch Camera"
                        style={{
                            width: "auto",
                            padding: "0 10px",
                            gap: 4,
                        }}
                    >
            <span className="material-symbols-outlined">
              switch_video
            </span>

                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#fff",
                                minWidth: 10,
                                textAlign: "center",
                            }}
                        >
              {currentCamId}
            </span>
                    </button>

                    <IconButton
                        icon="rotate_right"
                        onClick={onRotate}
                    />

                    <IconButton
                        icon="flip"
                        onClick={onFlip}
                    />

                    <IconButton
                        icon={isAudioOn ? "volume_up" : "volume_off"}
                        onClick={onMute}
                    />

                    <IconButton
                        icon="settings"
                        onClick={onSettingsToggle}
                    />

                    <IconButton
                        icon="fullscreen"
                        onClick={onFullscreen}
                    />
                </div>
            </div>
        </div>
    );
}

function IconButton({ icon, onClick }) {
    return (
        <button
            className="vp-icon-btn"
            onClick={onClick}
        >
      <span className="material-symbols-outlined">
        {icon}
      </span>
        </button>
    );
}

export function VideoPlayer({
                                hiddenVideoRef,
                                videoRef,
                                containerRef,

                                indicators,
                                streamMode,

                                rotation = 0,
                                isFlipped = false,

                                isVideoOn,
                                isAudioOn,

                                currentCamId,
                                videoStats,

                                onPlayPause,
                                onMute,
                                onFlip,
                                onRotate,
                                onSwitchCamera,
                                onFullscreen,
                                onSettingsToggle,

                                children,
                            }) {
    injectStyles();

    const normalizedRotation =
        ((rotation % 360) + 360) % 360;

    const appliedRotation =
        streamMode === "webrtc" ? 0 : normalizedRotation;

    const videoTransform = `
    rotate(${appliedRotation}deg)
    scaleX(${isFlipped ? -1 : 1})
  `;

    return (
        <div
            ref={containerRef}
            className="vp-root"
            style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                margin: "0 auto",
                overflow: "hidden",
                fontFamily: FONT,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,

                    background: "#000",

                    borderRadius: 18,
                    overflow: "hidden",

                    border: `1px solid ${C.lineMd}`,

                    boxShadow: "0 18px 48px rgba(0,0,0,0.42)",
                }}
            >
                {streamMode === "webrtc" && (
                    <video
                        ref={hiddenVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ display: "none" }}
                    />
                )}

                <canvas
                    ref={videoRef}
                    style={{
                        position: "absolute",
                        inset: 0,

                        width: "100%",
                        height: "100%",
                        objectFit: "contain",

                        display: "block",

                        transform: videoTransform,
                        transformOrigin: "center center",

                        transition: "transform 0.18s ease",
                    }}
                />

                <StatusRow
                    indicators={indicators}
                    streamMode={streamMode}
                />

                {streamMode === "mse" && (
                    <div
                        style={{
                            position: "absolute",
                            top: 16,
                            left: 16,

                            display: "flex",
                            alignItems: "center",
                            gap: 10,

                            padding: "6px 10px",

                            borderRadius: 999,

                            background: "rgba(0,0,0,0.45)",
                            backdropFilter: "blur(10px)",

                            border:
                                "1px solid rgba(255,255,255,0.08)",

                            color: "#fff",

                            fontSize: 11,
                            fontWeight: 700,

                            zIndex: 20,
                        }}
                    >
            <span>
              FPS {videoStats?.fps ?? 0}
            </span>

                        <span>
              LAT {videoStats?.latency ?? 0}ms
            </span>
                    </div>
                )}

                <ControlBar
                    isVideoOn={isVideoOn}
                    isAudioOn={isAudioOn}
                    currentCamId={currentCamId}

                    onPlayPause={onPlayPause}
                    onMute={onMute}
                    onFlip={onFlip}
                    onRotate={onRotate}
                    onSwitchCamera={onSwitchCamera}
                    onFullscreen={onFullscreen}
                    onSettingsToggle={onSettingsToggle}
                />
            </div>

            {children}
        </div>
    );
}
