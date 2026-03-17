// ─── Navbar ───────────────────────────────────────────────────────────────────

import { useState } from "react";

const S = {
  nav: {
    background:      "rgba(13,17,23,0.95)",
    backdropFilter:  "blur(6px)",
    borderBottom:    "1px solid #21262d",
    padding:         "0 16px",
    height:          44,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "space-between",
    position:        "sticky",
    top:             0,
    zIndex:          50,
  },
  left: { display: "flex", alignItems: "center", gap: 24 },
  logo: {
    fontSize:    15,
    fontWeight:  700,
    color:       "#e6edf3",
    letterSpacing: 1,
    textDecoration: "none",
  },
  accent: { color: "#58a6ff" },
  ghLink: {
    fontSize:   12,
    color:      "#484f58",
    textDecoration: "none",
    display:    "flex",
    alignItems: "center",
    gap:        4,
    transition: "color 0.15s",
  },
  right: { display: "flex", alignItems: "center", gap: 10 },
  textBtn: {
    background:     "none",
    border:         "none",
    color:          "#8b949e",
    cursor:         "pointer",
    fontSize:       12,
    padding:        "4px 0",
    transition:     "color 0.15s",
  },
  logoutBtn: {
    padding:        "4px 12px",
    fontSize:       12,
    border:         "1px solid #30363d",
    borderRadius:   4,
    background:     "rgba(22,27,34,0.8)",
    color:          "#c9d1d9",
    cursor:         "pointer",
    transition:     "border-color 0.15s",
  },
};

export function Navbar({ onClientDetails }) {
  const [ghHover, setGhHover] = useState(false);

  return (
    <nav style={S.nav}>
      <div style={S.left}>
        <a href="#" style={S.logo}>
          USSOI<span style={S.accent}>·</span>GCS
        </a>
        <a
          href="https://github.com/nikipoatgit"
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...S.ghLink, color: ghHover ? "#c9d1d9" : "#484f58" }}
          onMouseEnter={() => setGhHover(true)}
          onMouseLeave={() => setGhHover(false)}
        >
          <span>⌥</span> github/nikipoatgit
        </a>
      </div>

      <div style={S.right}>
        <button style={S.textBtn} onClick={onClientDetails}>
          Client Details
        </button>
        <button style={S.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}
