// ─── ToastContainer ───────────────────────────────────────────────────────────

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position:       "fixed",
        bottom:         80,
        left:           "50%",
        transform:      "translateX(-50%)",
        zIndex:         200,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            6,
        pointerEvents:  "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:   "#161b22",
            border:       "1px solid #30363d",
            borderRadius: 3,
            color:        "#e6edf3",
            padding:      "8px 20px",
            fontSize:     12,
            fontWeight:   500,
            boxShadow:    "0 4px 14px rgba(0,0,0,0.6)",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
