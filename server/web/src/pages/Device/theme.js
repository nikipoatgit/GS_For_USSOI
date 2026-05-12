// shared/theme.js
// Single source of truth — minimal dark palette with clean typographic scale.

export const C = {
  // Surface layers (3 levels only — keep it simple)
  base:   "#080b10",   // page background
  surface:"#0d1117",   // panels, cards
  raised: "#131920",   // inputs, buttons, hover states

  // Borders (two weights)
  line:   "#1c2230",   // subtle — most dividers
  lineMd: "#252e3f",   // slightly louder — card edges

  // Text (four steps)
  t0: "#e8edf5",   // headings / active values
  t1: "#9aa5b8",   // body copy
  t2: "#566070",   // muted labels
  t3: "#2d3645",   // disabled / placeholder

  // Accent (intentionally few)
  blue:   "#4e8fef",
  green:  "#3ecf80",
  red:    "#e8503a",
  amber:  "#d4870f",

  // Radius
  r:  "3px",
  rL: "5px",
};

export const FONT = "'JetBrains Mono', 'Consolas', monospace";

// ── Light theme (used by TelemetryBar / VideoPlayer) ───────────────────────
export const L = {
  surface: "#ffffff",
  surfaceContainer: "#ededf9",
  outline: "#737686",
  outlineVariant: "#c3c6d7",
  onSurface: "#191b23",
  onSurfaceVariant: "#434655",
  primary: "#004ac6",
  secondaryContainer: "#acbfff",
  onSecondaryContainer: "#394c84",
  radius: "0.75rem",
  fontFamily: "'Manrope', sans-serif",
};

export const inputSxLight = {
  background: L.surfaceContainer,
  border: `1px solid ${L.outlineVariant}`,
  borderRadius: 8,
  padding: "6px 8px",
  color: L.onSurface,
  fontSize: 12,
  outline: "none",
  width: "100%",
  fontFamily: L.fontFamily,
};

export const btnSxLight = {
  borderRadius: 8,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: L.fontFamily,
  border: `1px solid ${L.outlineVariant}`,
  background: "transparent",
  color: L.onSurface,
  transition: "background 0.1s, color 0.1s",
};

// ── Reusable style objects ────────────────────────────────────────────────────
export const inputSx = {
  background:   C.raised,
  border:       `1px solid ${C.line}`,
  borderRadius: C.r,
  padding:      "5px 9px",
  color:        C.t0,
  fontSize:     11,
  outline:      "none",
  width:        "100%",
  fontFamily:   FONT,
};

export const btnSx = {
  borderRadius: C.r,
  fontSize:     11,
  cursor:       "pointer",
  fontFamily:   FONT,
  border:       `1px solid ${C.line}`,
  background:   C.raised,
  color:        C.t1,
  transition:   "background 0.1s, color 0.1s",
};

// ── Global CSS ────────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%;
    background: ${C.base};
    color: ${C.t1};
    font-family: ${FONT};
    font-size: 12px;
    line-height: 1.6;
  }

  ::-webkit-scrollbar        { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track  { background: transparent; }
  ::-webkit-scrollbar-thumb  { background: ${C.lineMd}; border-radius: 2px; }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

  ::selection { background: #1a3560; color: #fff; }

  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes deepPulse { 0%,100%{opacity:0.15} 50%{opacity:1} }
  @keyframes slideUp   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes mseColor  {
    0%  { fill: #4e8fef } 25% { fill: #e8503a }
    50% { fill: #d4870f } 75% { fill: #3ecf80 } 100% { fill: #4e8fef }
  }

  .rtc-node   { animation: deepPulse 6s ease-in-out infinite; }
  .rtc-node-1 { animation-delay: 0s; }
  .rtc-node-2 { animation-delay: 2s; }
  .rtc-node-3 { animation-delay: 4s; }

  .mse-char { font-weight: 700; font-size: 11px; animation: mseColor 4s linear infinite; }
  .mse-c1 { animation-delay:  0s; }
  .mse-c2 { animation-delay: -1s; }
  .mse-c3 { animation-delay: -2s; }
  .mse-c4 { animation-delay: -3s; }

  .panel-slide-up { animation: slideUp 0.14s ease-out both; }

  #video-container:hover .ctrl-bar { opacity: 1 !important; }
`;
