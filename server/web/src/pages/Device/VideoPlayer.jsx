// features/video/VideoPlayer.jsx
// Video canvas + overlay controls. Hover to reveal control bar.

import { useState } from "react";
import { C } from "../../shared/theme.js";
import { IconBtn } from "../../shared/ui.jsx";

// ── Stream mode icon ──────────────────────────────────────────────────────────
function ModeIcon({ mode }) {
  if (mode === "webrtc") return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <path d="M12 6L18 17H6L12 6Z" stroke={C.lineMd} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="12" cy="6"  r="3" fill="#4285F4" className="rtc-node rtc-node-1"/>
      <circle cx="18" cy="17" r="3" fill="#EA4335" className="rtc-node rtc-node-2"/>
      <circle cx="6"  cy="17" r="3" fill="#34A853" className="rtc-node rtc-node-3"/>
    </svg>
  );
  if (mode === "mse") return (
    <svg width={26} height={13} viewBox="0 0 32 14" fill="none">
      <text x="1"  y="11" className="mse-char mse-c1">H</text>
      <text x="9"  y="11" className="mse-char mse-c2">2</text>
      <text x="17" y="11" className="mse-char mse-c3">6</text>
      <text x="25" y="11" className="mse-char mse-c4">4</text>
    </svg>
  );
  return null;
}

// ── Status dot row ────────────────────────────────────────────────────────────
function StatusRow({ indicators, streamMode }) {
  return (
    <div style={{
      position: "absolute", top: 10, right: 12,
      display: "flex", gap: 10, alignItems: "center",
    }}>
      <ModeIcon mode={streamMode}/>
      {["device", "stream", "record", "tunnel"].map(id => (
        <span key={id} style={{
          display: "flex", alignItems: "center", gap: 4,
          color: indicators[id] ? C.t1 : C.t3, transition: "color 0.35s",
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background:   indicators[id] ? C.green : C.lineMd,
            animation:    indicators[id] ? "blink 2s infinite" : "none",
            display:      "inline-block", flexShrink: 0,
            transition:   "background 0.35s",
          }}/>
          <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2 }}>
            {id}
          </span>
        </span>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function VideoPlayer({
  videoRef, containerRef, indicators, streamMode,
  isVideoOn, isAudioOn,
  onPlayPause, onMute, onFlip, onRotate,
  onSwitchCamera, onFullscreen, onSettingsToggle,
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      id="video-container"
      ref={containerRef}
      style={{
        width: "96%", margin: "0 auto",
        aspectRatio: "16 / 9",
        background: "#000",
        borderRadius: C.r,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${C.line}`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <video ref={videoRef} style={{ width: "100%", height: "100%", display: "block" }}
        autoPlay playsInline muted/>

      <StatusRow indicators={indicators} streamMode={streamMode}/>

      {/* Control bar — fades in on hover */}
      <div className="ctrl-bar" style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
        padding: "20px 2px 6px",
        opacity: hover ? 1 : 0,
        transition: "opacity 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconBtn onClick={onPlayPause} title={isVideoOn ? "Pause" : "Play"}>
            {isVideoOn ? "⏸" : "▶"}
          </IconBtn>

          {/* Progress / live strip */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, padding: "0 6px" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)", borderRadius: 1 }}>
              <div style={{ width: "100%", height: "100%", background: C.red, borderRadius: 1 }}/>
            </div>
            <span style={{
              fontSize: 8, fontWeight: 700, color: C.red,
              letterSpacing: 1.5, animation: "blink 2s infinite",
            }}>LIVE</span>
          </div>

          <IconBtn onClick={onSwitchCamera} title="Switch Camera">⇄</IconBtn>
          <IconBtn onClick={onRotate}       title="Rotate">↻</IconBtn>
          <IconBtn onClick={onFlip}         title="Flip">↔</IconBtn>
          <IconBtn onClick={onMute}         title={isAudioOn ? "Mute" : "Unmute"}>
            {isAudioOn ? "🔊" : "🔇"}
          </IconBtn>
          <IconBtn onClick={onSettingsToggle} title="Settings">⚙</IconBtn>
          <IconBtn onClick={onFullscreen}     title="Fullscreen">⛶</IconBtn>
        </div>
      </div>
    </div>
  );
}
