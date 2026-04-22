// features/overlays/Navbar.jsx

import { useState } from "react";
import { C } from "../../shared/theme.js";

export function Navbar({ onClientDetails }) {
  return (
    <nav style={{
      background:     C.surface,
      borderBottom:   `1px solid ${C.line}`,
      height:         46,
      padding:        "0 18px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      position:       "sticky",
      top:            0,
      zIndex:         50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.t0, letterSpacing: 2, userSelect: "none" }}>
          USSOI<span style={{ color: C.blue }}>·</span>GCS
        </span>
        <GhLink/>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <NavBtn onClick={onClientDetails}>Client Details</NavBtn>
        <NavBtn>Logout</NavBtn>
      </div>
    </nav>
  );
}

function GhLink() {
  const [hov, setHov] = useState(false);
  return (
    <a href="https://github.com/nikipoatgit"
      target="_blank" rel="noopener noreferrer"
      style={{
        fontSize: 10, color: hov ? C.t2 : C.t3,
        textDecoration: "none", transition: "color 0.12s",
        display: "flex", alignItems: "center", gap: 4,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span style={{ opacity: 0.6 }}>⌥</span> github/nikipoatgit
    </a>
  );
}

function NavBtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} style={{
      padding:      "3px 10px",
      fontSize:     10,
      border:       `1px solid ${hov ? C.lineMd : C.line}`,
      borderRadius: C.r,
      background:   "transparent",
      color:        hov ? C.t1 : C.t2,
      cursor:       "pointer",
      fontFamily:   "inherit",
      transition:   "all 0.12s",
      letterSpacing: 0.3,
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >{children}</button>
  );
}
