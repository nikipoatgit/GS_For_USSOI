// ─── SettingsPanel ────────────────────────────────────────────────────────────
// Floating panel anchored inside the video container (bottom-right).
// Opens inline quality sub-panel on demand.

import { useState } from "react";

// ── Shared input style ───────────────────────────────────────────────────────
const inp = {
  background:   "#161b22",
  border:       "1px solid #30363d",
  borderRadius: 3,
  padding:      "4px 8px",
  color:        "#e6edf3",
  fontSize:     11,
  outline:      "none",
  width:        "100%",
  fontFamily:   "inherit",
};

// ── Small action button ──────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, color = "#c9d1d9" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex:         1,
        padding:      "4px 0",
        borderRadius: 3,
        fontSize:     11,
        background:   "rgba(22,27,34,0.8)",
        border:       "1px solid #30363d",
        color:        disabled ? "#30363d" : color,
        cursor:       disabled ? "not-allowed" : "pointer",
        fontFamily:   "inherit",
        transition:   "border-color 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ children }) {
  return (
    <p
      style={{
        fontSize:      10,
        fontWeight:    700,
        color:         "#484f58",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom:  5,
      }}
    >
      {children}
    </p>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Div() {
  return <div style={{ borderTop: "1px solid #21262d", margin: "8px 0" }} />;
}

// ── Tunnel icon ──────────────────────────────────────────────────────────────
function TunnelBadge({ mode }) {
  if (mode === "bt")  return <span style={{ color: "#58a6ff", fontSize: 10 }}>BT</span>;
  if (mode === "usb") return <span style={{ color: "#3fb950", fontSize: 10 }}>USB</span>;
  return <span style={{ color: "#f85149", fontSize: 10 }}>✕</span>;
}

// ── Quality sub-panel ────────────────────────────────────────────────────────
function QualityPanel({ cameraResolutions, onQuality, onBitrate, onClose }) {
  const [w, setW]       = useState(1280);
  const [h, setH]       = useState(720);
  const [fps, setFps]   = useState(30);
  const [bps, setBps]   = useState(100);

  return (
    <div
      style={{
        background:   "#0d1117",
        border:       "1px solid #21262d",
        borderRadius: 4,
        padding:      12,
        display:      "flex",
        gap:          14,
        fontSize:     11,
        marginBottom: 4,
      }}
    >
      {/* Camera preset list */}
      {cameraResolutions?.length > 0 && (
        <div style={{ maxHeight: 180, overflowY: "auto" }}>
          <SectionHead>Presets</SectionHead>
          {cameraResolutions.map((cam) => (
            <div key={cam.facing} style={{ marginBottom: 8 }}>
              <p
                style={{
                  textTransform: "capitalize",
                  color:         "#8b949e",
                  marginBottom:  4,
                  fontSize:      10,
                }}
              >
                {cam.facing}
              </p>
              <div
                style={{
                  display:             "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap:                 3,
                }}
              >
                {cam.resolutions.map((r) => (
                  <button
                    key={`${r.width}x${r.height}`}
                    onClick={() => { setW(r.width); setH(r.height); }}
                    style={{
                      ...inp,
                      width:    "auto",
                      padding:  "3px 5px",
                      cursor:   "pointer",
                      fontSize: 10,
                    }}
                  >
                    {r.width}×{r.height}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings form */}
      <div style={{ width: 190 }}>
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            marginBottom:   8,
          }}
        >
          <SectionHead>Stream Settings</SectionHead>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border:     "none",
              color:      "#484f58",
              cursor:     "pointer",
              fontSize:   14,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Resolution */}
        <p style={{ color: "#484f58", marginBottom: 3, fontSize: 10 }}>Resolution</p>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <input type="number" placeholder="W" value={w}
            onChange={(e) => setW(+e.target.value)} style={{ ...inp, width: "50%" }} />
          <input type="number" placeholder="H" value={h}
            onChange={(e) => setH(+e.target.value)} style={{ ...inp, width: "50%" }} />
        </div>

        {/* FPS + apply */}
        <p style={{ color: "#484f58", marginBottom: 3, fontSize: 10 }}>FPS</p>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <input type="number" value={fps}
            onChange={(e) => setFps(+e.target.value)} style={{ ...inp }} />
          <button
            onClick={() => onQuality(w, h, fps)}
            style={{
              ...inp,
              width:    "auto",
              padding:  "4px 10px",
              cursor:   "pointer",
              color:    "#58a6ff",
              flexShrink: 0,
            }}
          >
            Apply
          </button>
        </div>

        {/* Bitrate + apply */}
        <p style={{ color: "#484f58", marginBottom: 3, fontSize: 10 }}>Bitrate (KBps)</p>
        <div style={{ display: "flex", gap: 4 }}>
          <input type="number" value={bps}
            onChange={(e) => setBps(+e.target.value)} style={{ ...inp }} />
          <button
            onClick={() => onBitrate(bps)}
            style={{
              ...inp,
              width:    "auto",
              padding:  "4px 10px",
              cursor:   "pointer",
              color:    "#58a6ff",
              flexShrink: 0,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function SettingsPanel({
  open,
  cameraResolutions,
  tunnelMode,
  streamMode,
  isRecording,
  onChangeSetup,
  onQuality,
  onBitrate,
  onStartRecord,
  onStartStream,
  onStopStream,
  onStartTunnel,
  onStopTunnel,
}) {
  const [qualityOpen, setQualityOpen] = useState(false);
  const tunnelDisabled = !tunnelMode || tunnelMode === "null" || tunnelMode === "none";

  if (!open) return null;

  return (
    <div
      style={{
        position:    "absolute",
        bottom:      50,
        right:       0,
        display:     "flex",
        flexDirection: "column",
        alignItems:  "flex-end",
        gap:         4,
        zIndex:      30,
      }}
    >
      {/* Quality sub-panel */}
      {qualityOpen && (
        <QualityPanel
          cameraResolutions={cameraResolutions}
          onQuality={onQuality}
          onBitrate={onBitrate}
          onClose={() => setQualityOpen(false)}
        />
      )}

      {/* Main settings panel */}
      <div
        style={{
          background:   "#0d1117",
          border:       "1px solid #21262d",
          borderRadius: 4,
          padding:      12,
          width:        210,
          fontSize:     11,
        }}
      >
        {/* Setup / stream mode */}
        <Btn onClick={onChangeSetup}>Change Stream Mode</Btn>

        <Div />

        {/* Quality */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            marginBottom:   8,
          }}
        >
          <SectionHead>Quality</SectionHead>
          <Btn onClick={() => setQualityOpen((v) => !v)}>
            {qualityOpen ? "Hide ↑" : "Configure →"}
          </Btn>
        </div>

        <Div />

        {/* Recording */}
        <SectionHead>Recording</SectionHead>
        <div style={{ display: "flex", marginBottom: 8 }}>
          <button
            onClick={onStartRecord}
            disabled={isRecording}
            style={{
              ...inp,
              cursor:    isRecording ? "not-allowed" : "pointer",
              color:     isRecording ? "#58a6ff" : "#c9d1d9",
              animation: isRecording ? "blink 2s infinite" : "none",
              opacity:   isRecording ? 0.6 : 1,
              width:     "100%",
            }}
          >
            {isRecording ? "Recording Active" : "Start Local Recording"}
          </button>
        </div>

        <Div />

        {/* Tunnel */}
        <div
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        6,
            marginBottom: 5,
          }}
        >
          <SectionHead>Tunnel</SectionHead>
          <TunnelBadge mode={tunnelMode} />
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <Btn disabled={tunnelDisabled} onClick={onStartTunnel} color="#3fb950">Start</Btn>
          <Btn disabled={tunnelDisabled} onClick={onStopTunnel}  color="#f85149">Stop</Btn>
        </div>

        <Div />

        {/* Stream */}
        <SectionHead>Stream</SectionHead>
        <div style={{ display: "flex", gap: 4 }}>
          <Btn onClick={onStartStream} color="#3fb950">Start</Btn>
          <Btn onClick={onStopStream}  color="#f85149">Stop</Btn>
        </div>
      </div>
    </div>
  );
}
