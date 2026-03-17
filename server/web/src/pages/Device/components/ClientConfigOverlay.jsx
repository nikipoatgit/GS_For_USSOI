// ─── ClientConfigOverlay ──────────────────────────────────────────────────────
// Modal overlay for configuring stream mode (WebRTC / MSE / Local)
// and optional TURN server entries.

import { useState, useEffect } from "react";

const inp = {
  background:   "#161b22",
  border:       "1px solid #30363d",
  borderRadius: 3,
  padding:      "5px 10px",
  color:        "#e6edf3",
  width:        "100%",
  marginTop:    4,
  fontSize:     12,
  fontFamily:   "inherit",
  outline:      "none",
};

function Label({ children }) {
  return (
    <span style={{ fontSize: 11, color: "#8b949e" }}>{children}</span>
  );
}

export function ClientConfigOverlay({ open, config, onClose, onSave }) {
  const [webrtc,       setWebrtc]       = useState(config.webrtc);
  const [mse,          setMse]          = useState(config.mse);
  const [local,        setLocal]        = useState(config.local);
  const [baud,         setBaud]         = useState(115200);
  const [localBitrate, setLocalBitrate] = useState(500);
  const [turns,        setTurns]        = useState([]);

  // sync when opened
  useEffect(() => {
    if (!open) return;
    console.log("[Config] overlay opened with config:", config);
    setWebrtc(config.webrtc);
    setMse(config.mse);
    setLocal(config.local);
  }, [open]);

  if (!open) return null;

  const addTurn    = () => setTurns((t) => [...t, { url: "", user: "", pass: "" }]);
  const removeTurn = (i) => setTurns((t) => t.filter((_, j) => j !== i));
  const updateTurn = (i, k, v) =>
    setTurns((t) => t.map((row, j) => (j === i ? { ...row, [k]: v } : row)));

  const handleSave = () => {
    const cfg = {
      webrtc,
      mse,
      local,
      baudrate:     baud,
      bitrate:      localBitrate * 8,
      turn:         turns.filter((t) => t.url),
    };
    console.log("[Config] saving:", cfg);
    onSave(cfg);
    onClose();
  };

  return (
    <div
      style={{
        position:   "fixed",
        inset:      0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex:     100,
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:   "#0d1117",
          border:       "1px solid #30363d",
          borderRadius: 4,
          padding:      22,
          width:        "100%",
          maxWidth:     460,
          color:        "#e6edf3",
          fontSize:     12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            marginBottom:   18,
          }}
        >
          <h2
            style={{
              fontSize:      14,
              fontWeight:    700,
              letterSpacing: 0.5,
            }}
          >
            Client Configuration
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border:     "none",
              color:      "#8b949e",
              fontSize:   18,
              cursor:     "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Stream mode checkboxes */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:                 12,
            marginBottom:        16,
          }}
        >
          {[
            ["WebRTC", webrtc, (v) => { setWebrtc(v); if (v) setMse(false); }],
            ["MSE (H264)", mse, (v) => { setMse(v);  if (v) setWebrtc(false); }],
          ].map(([label, val, setter]) => (
            <label
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => setter(e.target.checked)}
                style={{ accentColor: "#58a6ff", width: 14, height: 14 }}
              />
              {label}
            </label>
          ))}

          <label
            style={{
              display:     "flex",
              alignItems:  "center",
              gap:         7,
              cursor:      "pointer",
              gridColumn:  "span 2",
            }}
          >
            <input
              type="checkbox"
              checked={local}
              onChange={(e) => setLocal(e.target.checked)}
              style={{ accentColor: "#58a6ff", width: 14, height: 14 }}
            />
            Local Recording
          </label>
        </div>

        {local && (
          <p style={{ fontSize: 11, color: "#d29922", marginBottom: 12 }}>
            Resolution, camera and rotation are locked during recording.
          </p>
        )}

        {/* Numeric inputs */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:                 12,
            marginBottom:        16,
          }}
        >
          <div>
            <Label>Rec. Bitrate (KBps)</Label>
            <input
              type="number"
              value={localBitrate}
              min={100}
              step={100}
              onChange={(e) => setLocalBitrate(+e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <Label>Baudrate</Label>
            <input
              type="number"
              value={baud}
              onChange={(e) => setBaud(+e.target.value)}
              style={inp}
            />
          </div>
        </div>

        {/* TURN servers */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              marginBottom:   8,
            }}
          >
            <Label>TURN Servers</Label>
            <button
              onClick={addTurn}
              disabled={!webrtc}
              style={{
                fontSize:     11,
                padding:      "3px 10px",
                borderRadius: 3,
                background:   "#161b22",
                border:       "1px solid #30363d",
                color:        webrtc ? "#c9d1d9" : "#484f58",
                cursor:       webrtc ? "pointer" : "not-allowed",
                fontFamily:   "inherit",
              }}
            >
              + Add
            </button>
          </div>

          {turns.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 5, marginBottom: 5 }}>
              <input
                placeholder="turn:server"
                value={t.url}
                onChange={(e) => updateTurn(i, "url", e.target.value)}
                style={{ ...inp, flex: 2, marginTop: 0 }}
                disabled={!webrtc}
              />
              <input
                placeholder="User"
                value={t.user}
                onChange={(e) => updateTurn(i, "user", e.target.value)}
                style={{ ...inp, flex: 1, marginTop: 0 }}
                disabled={!webrtc}
              />
              <input
                placeholder="Pass"
                value={t.pass}
                onChange={(e) => updateTurn(i, "pass", e.target.value)}
                style={{ ...inp, flex: 1, marginTop: 0 }}
                disabled={!webrtc}
              />
              <button
                onClick={() => removeTurn(i)}
                style={{
                  background: "none",
                  border:     "none",
                  color:      "#f85149",
                  cursor:     "pointer",
                  fontSize:   13,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSave}
            style={{
              background:   "#1f6feb",
              border:       "1px solid #388bfd",
              borderRadius: 3,
              padding:      "6px 20px",
              color:        "#fff",
              fontWeight:   600,
              cursor:       "pointer",
              fontSize:     12,
              fontFamily:   "inherit",
            }}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
