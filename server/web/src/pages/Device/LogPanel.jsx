import { C } from "../../shared/theme.js";

const MAX_LOGS = 100;

const STYLE = {
    success: { symbol: "●", color: "#22c55e" },
    error:   { symbol: "●", color: "#ef4444" },
    warn:    { symbol: "●", color: "#f59e0b" },
    info:    { symbol: "●", color: "#3b82f6" },
};

export { MAX_LOGS };

export function LogPanel({ logs, collapsed, onToggle }) {

    return (
        <aside style={{
            width: collapsed ? 42 : 300,
            minWidth: collapsed ? 42 : 300,

            background: C.surface,
            borderLeft: `1px solid ${C.line}`,
            borderTopLeftRadius: 18,
            borderBottomLeftRadius: 18,
            margin: "12px 12px 12px 0",

            transition: "all 0.18s ease",

            overflow: "hidden",
            display: "flex",
            flexDirection: "column",

            flexShrink: 0,
        }}>

            {/* Header */}
            <div style={{
                height: 54,
                minHeight: 54,

                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "space-between",

                padding: collapsed ? 0 : "0 14px",

                borderBottom: `1px solid ${C.line}`,
            }}>

                {!collapsed && (
                    <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.t0,
                        letterSpacing: 0.4,
                    }}>
            System Logs
          </span>
                )}

                <button
                    onClick={onToggle}
                    style={{
                        background: "transparent",
                        border: "none",

                        color: C.t1,

                        cursor: "pointer",

                        fontSize: 16,
                        padding: 0,

                        width: 24,
                        height: 24,
                    }}
                >
                    {collapsed ? "›" : "‹"}
                </button>

            </div>

            {/* Logs */}
            {!collapsed && (
                <div style={{
                    padding: 10,
                    overflowY: "auto",

                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}>

                    {logs.length === 0 && (
                        <div style={{
                            color: C.t2,
                            fontSize: 12,
                            padding: "10px 4px",
                        }}>
                            No log entries
                        </div>
                    )}

                    {logs.map(entry => {

                        const s = STYLE[entry.type] ?? STYLE.info;

                        return (
                            <div
                                key={entry.id}
                                style={{
                                    background: C.raised,

                                    border: `1px solid ${C.lineMd}`,
                                    borderRadius: 14,

                                    padding: "10px 12px",

                                    display: "flex",
                                    gap: 10,
                                }}
                            >

                                {/* Status dot */}
                                <div style={{
                                    color: s.color,
                                    fontSize: 10,
                                    lineHeight: "18px",
                                    flexShrink: 0,
                                }}>
                                    {s.symbol}
                                </div>

                                {/* Content */}
                                <div style={{
                                    minWidth: 0,
                                    flex: 1,
                                }}>

                                    <div style={{
                                        color: C.t0,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        lineHeight: 1.4,
                                    }}>
                                        {entry.message}
                                    </div>

                                    {entry.details && (
                                        <div style={{
                                            marginTop: 3,

                                            color: C.t1,
                                            fontSize: 11,

                                            lineHeight: 1.45,
                                            wordBreak: "break-word",
                                        }}>
                                            {entry.details}
                                        </div>
                                    )}

                                </div>

                            </div>
                        );
                    })}

                </div>
            )}

        </aside>
    );
}
