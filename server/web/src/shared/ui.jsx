// shared/ui.jsx
// Tiny reusable primitives used across features.

import { useState } from "react";
import { C, btnSx, FONT } from "./theme.js";

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ margin = "8px 0" }) {
  return <div style={{ borderTop: `1px solid ${C.line}`, margin }} />;
}

// ── Section label ─────────────────────────────────────────────────────────────
export function SLabel({ children }) {
  return (
    <p style={{
      fontSize: 9, fontWeight: 700, color: C.t3,
      textTransform: "uppercase", letterSpacing: 1.8, marginBottom: 6,
    }}>{children}</p>
  );
}

// ── State badge ───────────────────────────────────────────────────────────────
export function StateBadge({ state }) {
  const color = state === "ACTIVE"     ? C.green
              : state === "PROCESSING" ? C.amber
              : state === "ERROR"      ? C.red
              : C.t3;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: 0.8 }}>
      {state ?? "IDLE"}
    </span>
  );
}

// ── Ghost button (used in panels) ─────────────────────────────────────────────
export function Btn({ children, onClick, disabled, accent, style: sx }) {
  const [hov, setHov] = useState(false);
  const fg = disabled ? C.t3 : accent ? accent : (hov ? C.t0 : C.t1);
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        ...btnSx, flex: 1, padding: "5px 0", textAlign: "center",
        background: hov && !disabled ? C.raised : "transparent",
        color: fg,
        cursor: disabled ? "not-allowed" : "pointer",
        ...sx,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >{children}</button>
  );
}

// ── Icon button (navbar / video controls) ─────────────────────────────────────
export function IconBtn({ children, onClick, title, style: sx }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} style={{
      background: "none", border: "none",
      color: hov ? C.t0 : C.t1, cursor: "pointer",
      padding: "0 8px", lineHeight: "32px", fontSize: 13,
      transition: "color 0.1s", fontFamily: FONT,
      ...sx,
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >{children}</button>
  );
}

// ── Pill / chip selector ──────────────────────────────────────────────────────
export function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      ...btnSx, padding: "2px 8px",
      background: active ? "#0d1f3a" : "transparent",
      border: `1px solid ${active ? C.blue + "60" : C.line}`,
      color: active ? C.blue : C.t2,
      fontSize: 10,
    }}>{children}</button>
  );
}

// ── Close X button ────────────────────────────────────────────────────────────
export function CloseBtn({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer",
      color: hov ? C.t1 : C.t3, fontSize: 15, lineHeight: 1,
      fontFamily: FONT, transition: "color 0.1s",
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >×</button>
  );
}

// ── Null-safe value display ───────────────────────────────────────────────────
export function stat(v) { return v != null ? v : "—"; }
