// features/settings/ClientConfigOverlay.jsx
// Modal for choosing stream mode (WebRTC / H264 / HFH264) and TURN servers.

import { useState, useEffect } from "react";
import { C, inputSx, btnSx } from "../../shared/theme.js";
import { CloseBtn } from "../../shared/ui.jsx";

const MODES = (highFpsSupported) => [
  { id: "webrtc",  label: "WebRTC",           desc: "Low latency, peer-to-peer" },
  { id: "h264",    label: "H264 (MSE)",        desc: "RTSP / HLS over WebSocket" },
  {
    id: "hfh264", label: "HFH264 (High FPS)",
    desc: `High frame-rate H264${highFpsSupported ? "" : " · not supported"}`,
    disabled: !highFpsSupported,
  },
  { id: "none", label: "None", desc: "Disable streaming entirely" },
];

export function ClientConfigOverlay({ open, config, onClose, onSave }) {
  const [mode,  setMode]  = useState(deriveMode(config));
  const [turns, setTurns] = useState([]);

  useEffect(() => {
    if (open) setMode(deriveMode(config));
  }, [open]); // eslint-disable-line

  if (!open) return null;

  const addT = ()      => setTurns(t => [...t, { url: "", user: "", pass: "" }]);
  const remT = (i)     => setTurns(t => t.filter((_, j) => j !== i));
  const updT = (i,k,v) => setTurns(t => t.map((r, j) => j === i ? { ...r, [k]: v } : r));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: C.surface, border: `1px solid ${C.lineMd}`,
        borderRadius: C.rL, padding: 22,
        width: "100%", maxWidth: 400,
        boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: C.t0, letterSpacing: 0.3 }}>
            Stream Configuration
          </h2>
          <CloseBtn onClick={onClose}/>
        </div>

        {/* Mode selection */}
        <FieldLabel>Stream Mode</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 18 }}>
          {MODES(config.highFpsSupported).map(m => (
            <label key={m.id} style={{
              display: "flex", alignItems: "center", gap: 10, cursor: m.disabled ? "not-allowed" : "pointer",
              padding: "9px 11px", borderRadius: C.r,
              background: mode === m.id ? "#0d1f3a" : C.raised,
              border: `1px solid ${mode === m.id ? C.blue + "50" : C.line}`,
              opacity: m.disabled ? 0.38 : 1,
              transition: "all 0.12s",
            }}>
              <input type="radio" name="streamMode" value={m.id}
                checked={mode === m.id} disabled={m.disabled}
                onChange={() => setMode(m.id)}
                style={{ accentColor: C.blue, width: 13, height: 13, flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: mode === m.id ? C.blue : C.t0 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 10, color: C.t2, marginTop: 1 }}>{m.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {/* TURN servers (WebRTC only) */}
        {mode === "webrtc" && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <FieldLabel>TURN Servers</FieldLabel>
              <button onClick={addT} style={{ ...btnSx, padding: "2px 9px", fontSize: 10 }}>+ Add</button>
            </div>
            {turns.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                <input placeholder="turn:host" value={t.url}
                  onChange={e => updT(i, "url", e.target.value)} style={{ ...inputSx, flex: 2 }}/>
                <input placeholder="User" value={t.user}
                  onChange={e => updT(i, "user", e.target.value)} style={{ ...inputSx, flex: 1 }}/>
                <input placeholder="Pass" value={t.pass}
                  onChange={e => updT(i, "pass", e.target.value)} style={{ ...inputSx, flex: 1 }}/>
                <button onClick={() => remT(i)} style={{
                  background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 13,
                }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Apply */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => { onSave({ mode, turn: turns.filter(t => t.url) }); onClose(); }}
            style={{
              background: C.blue, border: "none", borderRadius: C.r,
              padding: "7px 22px", color: "#fff", fontWeight: 600,
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function deriveMode(cfg) {
  if (cfg.hfh264) return "hfh264";
  if (cfg.mse)    return "h264";
  if (cfg.webrtc) return "webrtc";
  return "none";
}

function FieldLabel({ children }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7 }}>
      {children}
    </p>
  );
}