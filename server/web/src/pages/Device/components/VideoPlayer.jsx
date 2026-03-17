// ─── VideoPlayer ──────────────────────────────────────────────────────────────
// Video element + hover control bar + status indicator dots.

import { useState } from "react";

// ── Sub-icons ────────────────────────────────────────────────────────────────

function WebRtcIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 6L18 17H6L12 6Z"
        stroke="#4B5563"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <circle cx="12" cy="6"  r="3" fill="#4285F4" className="rtc-node rtc-node-1" />
      <circle cx="18" cy="17" r="3" fill="#EA4335" className="rtc-node rtc-node-2" />
      <circle cx="6"  cy="17" r="3" fill="#34A853" className="rtc-node rtc-node-3" />
    </svg>
  );
}

function MseIcon() {
  return (
    <svg width={28} height={13} viewBox="0 0 32 14" fill="none">
      <text x="1"  y="11" className="mse-char mse-c1">H</text>
      <text x="9"  y="11" className="mse-char mse-c2">2</text>
      <text x="17" y="11" className="mse-char mse-c3">6</text>
      <text x="25" y="11" className="mse-char mse-c4">4</text>
    </svg>
  );
}

function StatusDot({ active }) {
  return (
    <span
      style={{
        display:       "inline-block",
        width:         7,
        height:        7,
        borderRadius:  "50%",
        background:    active ? "#3fb950" : "#30363d",
        animation:     active ? "blink 2s infinite" : "none",
        flexShrink:    0,
      }}
    />
  );
}

// ── Control button ───────────────────────────────────────────────────────────
function CtrlBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background:   "none",
        border:       "none",
        color:        "#e6edf3",
        cursor:       "pointer",
        padding:      "0 9px",
        fontSize:     13,
        lineHeight:   "32px",
        opacity:      0.85,
        transition:   "opacity 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "0.85")}
    >
      {children}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function VideoPlayer({
  videoRef,
  containerRef,
  indicators,
  isVideoOn,
  isAudioOn,
  streamMode,
  onPlayPause,
  onMute,
  onFlip,
  onRotate,
  onSwitchCamera,
  onFullscreen,
  onSettingsToggle,
}) {
  const [ctrlVisible, setCtrlVisible] = useState(false);

  const StreamModeIcon = () => {
    if (streamMode === "webrtc") return <WebRtcIcon />;
    if (streamMode === "mse")    return <MseIcon />;
    return null;
  };

  return (
    <div
      id="video-container"
      ref={containerRef}
      style={{
        width:        "96%",
        margin:       "0 auto",
        aspectRatio:  "16 / 9",
        background:   "#000",
        borderRadius: 4,
        overflow:     "hidden",
        position:     "relative",
      }}
      onMouseEnter={() => setCtrlVisible(true)}
      onMouseLeave={() => setCtrlVisible(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        autoPlay
        playsInline
        muted
      />

      {/* Status indicators — top right */}
      <div
        style={{
          position:   "absolute",
          top:        10,
          right:      12,
          display:    "flex",
          gap:        12,
          alignItems: "center",
        }}
      >
        {/* Stream mode icon */}
        <span style={{ display: "flex", alignItems: "center" }}>
          <StreamModeIcon />
        </span>

        {/* Indicator dots */}
        {["device", "stream", "record", "tunnel"].map((id) => (
          <div
            key={id}
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        5,
              color:      indicators[id] ? "#e6edf3" : "#484f58",
              transition: "color 0.4s",
            }}
          >
            <StatusDot active={indicators[id]} />
            <span
              style={{
                fontSize:      9,
                fontWeight:    700,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {id}
            </span>
          </div>
        ))}
      </div>

      {/* Control bar — bottom, on hover */}
      <div
        className="video-ctrl-bar"
        style={{
          position:   "absolute",
          bottom:     0,
          left:       0,
          right:      0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
          padding:    "10px 4px 8px",
          opacity:    ctrlVisible ? 1 : 0,
          transition: "opacity 0.25s",
        }}
      >
        <div
          style={{
            display:    "flex",
            alignItems: "center",
            color:      "#e6edf3",
          }}
        >
          {/* Play / Pause */}
          <CtrlBtn onClick={onPlayPause} title={isVideoOn ? "Pause" : "Play"}>
            {isVideoOn ? "⏸" : "▶"}
          </CtrlBtn>

          {/* Live bar */}
          <div
            style={{
              flex:         1,
              display:      "flex",
              alignItems:   "center",
              gap:          6,
              padding:      "0 8px",
            }}
          >
            <div
              style={{
                flex:         1,
                height:       3,
                background:   "rgba(255,255,255,0.15)",
                borderRadius: 1,
              }}
            >
              <div
                style={{
                  width:        "100%",
                  height:       "100%",
                  background:   "#f85149",
                  borderRadius: 1,
                }}
              />
            </div>
            <span
              style={{
                fontSize:     9,
                fontWeight:   700,
                color:        "#f85149",
                letterSpacing: 1,
                animation:    "blink 2s infinite",
              }}
            >
              LIVE
            </span>
          </div>

          <CtrlBtn onClick={onSwitchCamera} title="Switch Camera">⇄</CtrlBtn>
          <CtrlBtn onClick={onRotate}       title="Rotate">↻</CtrlBtn>
          <CtrlBtn onClick={onFlip}         title="Flip">↔</CtrlBtn>
          <CtrlBtn onClick={onMute}         title={isAudioOn ? "Mute" : "Unmute"}>
            {isAudioOn ? "🔊" : "🔇"}
          </CtrlBtn>
          <CtrlBtn onClick={onSettingsToggle} title="Settings">⚙</CtrlBtn>
          <CtrlBtn onClick={onFullscreen}     title="Fullscreen">⛶</CtrlBtn>
        </div>
      </div>
    </div>
  );
}
