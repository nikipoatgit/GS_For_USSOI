// features/overlays/LogPanel.jsx

import { C } from "../../shared/theme.js";

const MAX_LOGS = 100;

const STYLE = {
  success: { symbol: "✓", color: C.green },
  error:   { symbol: "✕", color: C.red   },
  info:    { symbol: "·", color: C.blue  },
  warn:    { symbol: "!", color: C.amber },
};

export { MAX_LOGS };

export function LogPanel({ logs, collapsed, onToggle }) {
  return (
    <aside style={{
      position:   "relative",
      width:      collapsed ? 33 : 264,
      minWidth:   collapsed ? 33 : 264,
      background: C.surface,
      borderLeft: `1px solid ${C.line}`,
      overflowY:  "auto",
      maxHeight:  "calc(100vh - 46px)",
      transition: "width 0.18s, min-width 0.18s",
      flexShrink: 0,
    }}>
      {/* Toggle */}
      <button onClick={onToggle} style={{
        position:     "absolute",
        top:          8,
        right:        collapsed ? 4 : 6,
        background:   "transparent",
        border:       `1px solid ${C.line}`,
        borderRadius: C.r,
        color:        C.t3,
        cursor:       "pointer",
        padding:      "1px 5px",
        fontSize:     10,
        zIndex:       2,
        fontFamily:   "inherit",
        letterSpacing: 0.5,
      }}>{collapsed ? "»" : "«"}</button>

      {!collapsed && (
        <div style={{ padding: "10px 11px 20px" }}>
          <h2 style={{
            fontSize:      9,
            fontWeight:    700,
            color:         C.t3,
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom:  12,
            marginTop:     3,
            paddingRight:  26,
          }}>System Log</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {logs.length === 0 && (
              <p style={{ color: C.t3, fontSize: 10, fontStyle: "italic" }}>No entries yet.</p>
            )}
            {logs.map(entry => {
              const s = STYLE[entry.type] ?? STYLE.info;
              return (
                <div key={entry.id} style={{
                  background:   C.raised,
                  border:       `1px solid ${C.line}`,
                  borderLeft:   `2px solid ${s.color}`,
                  borderRadius: C.r,
                  padding:      "5px 8px",
                  display:      "flex",
                  gap:          7,
                }}>
                  <span style={{ color: s.color, fontWeight: 700, flexShrink: 0, fontSize: 11, lineHeight: "17px" }}>
                    {s.symbol}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.t0, lineHeight: 1.4 }}>
                      {entry.message}
                    </p>
                    <p style={{ fontSize: 9, color: C.t2, marginTop: 1, wordBreak: "break-all", lineHeight: 1.4 }}>
                      {entry.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
