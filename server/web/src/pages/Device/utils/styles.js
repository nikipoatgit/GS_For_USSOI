// ─── Global Styles ───────────────────────────────────────────────────────────
// Injected once via <style> in App root.
// Design principles:
//   • Flat / minimal curves  — border-radius max 4px on controls, 6px on panels
//   • Monospace everywhere   — JetBrains Mono as primary font
//   • Dark background        — #07090e base, #0d1117 panels

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    background: #07090e;
    color: #c9d1d9;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  /* ── Scrollbar ─────────────────────────────── */
  ::-webkit-scrollbar        { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track  { background: transparent; }
  ::-webkit-scrollbar-thumb  { background: #30363d; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #484f58; }

  /* ── Animations ────────────────────────────── */
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  @keyframes deepPulse {
    0%, 100% { opacity: 0.2; }
    50%       { opacity: 1.0; }
  }

  @keyframes mseColor {
    0%   { fill: #4285F4; }
    25%  { fill: #EA4335; }
    50%  { fill: #FBBC05; }
    75%  { fill: #34A853; }
    100% { fill: #4285F4; }
  }

  .anim-blink   { animation: blink 2s infinite; }

  .rtc-node     { animation: deepPulse 6s ease-in-out infinite; }
  .rtc-node-1   { animation-delay: 0s; }
  .rtc-node-2   { animation-delay: 2s; }
  .rtc-node-3   { animation-delay: 4s; }

  .mse-char { font-family: monospace; font-weight: 700; font-size: 11px;
    animation: mseColor 4s linear infinite; }
  .mse-c1 { animation-delay:  0s; }
  .mse-c2 { animation-delay: -1s; }
  .mse-c3 { animation-delay: -2s; }
  .mse-c4 { animation-delay: -3s; }

  /* ── Video controls hover ──────────────────── */
  #video-container:hover .video-ctrl-bar { opacity: 1 !important; }

  /* ── Inputs ────────────────────────────────── */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

  /* ── Selection ─────────────────────────────── */
  ::selection { background: #1f6feb; color: #fff; }
`;
