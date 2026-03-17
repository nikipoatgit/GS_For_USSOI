// ─── LogPanel ─────────────────────────────────────────────────────────────────
// Collapsible right-side log sidebar.

import { LOG_STYLES } from "../utils/constants.js";

export function LogPanel({ logs, collapsed, onToggle }) {
  return (
    <aside
      style={{
        position:   "relative",
        width:      collapsed ? 36 : 280,
        minWidth:   collapsed ? 36 : 280,
        background: "#0d1117",
        borderLeft: "1px solid #21262d",
        overflowY:  "auto",
        maxHeight:  "calc(100vh - 44px)",
        transition: "width 0.2s, min-width 0.2s",
        flexShrink: 0,
      }}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        title={collapsed ? "Expand log" : "Collapse log"}
        style={{
          position:   "absolute",
          top:        8,
          right:      collapsed ? 6 : 8,
          background: "transparent",
          border:     "1px solid #30363d",
          borderRadius: 3,
          color:      "#484f58",
          cursor:     "pointer",
          padding:    "2px 6px",
          fontSize:   11,
          zIndex:     2,
        }}
      >
        {collapsed ? "»" : "«"}
      </button>

      {!collapsed && (
        <div style={{ padding: "10px 12px 16px" }}>
          <h2
            style={{
              fontSize:      12,
              fontWeight:    700,
              color:         "#e6edf3",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom:  12,
              marginTop:     4,
              paddingRight:  28,
            }}
          >
            System Log
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {logs.length === 0 && (
              <p style={{ color: "#484f58", fontSize: 11, fontStyle: "italic" }}>
                No entries yet.
              </p>
            )}
            {logs.map((entry) => {
              const s = LOG_STYLES[entry.type] ?? LOG_STYLES.info;
              return (
                <div
                  key={entry.id}
                  style={{
                    background:   "#161b22",
                    border:       "1px solid #21262d",
                    borderLeft:   `2px solid ${s.color}`,
                    borderRadius: 2,
                    padding:      "6px 10px",
                    display:      "flex",
                    gap:          8,
                  }}
                >
                  <span
                    style={{
                      color:      s.color,
                      fontWeight: 700,
                      flexShrink: 0,
                      fontSize:   12,
                      lineHeight: "18px",
                    }}
                  >
                    {s.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3" }}>
                      {entry.message}
                    </p>
                    <p
                      style={{
                        fontSize:    10,
                        color:       "#8b949e",
                        marginTop:   1,
                        wordBreak:   "break-all",
                        lineHeight:  1.4,
                      }}
                    >
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
