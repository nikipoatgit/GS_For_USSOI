// ─── AboutOverlay ─────────────────────────────────────────────────────────────
// Full-screen overlay showing device system information.

function Card({ title, icon, children }) {
  return (
    <div
      style={{
        background:   "#0d1117",
        border:       "1px solid #21262d",
        borderRadius: 4,
        padding:      16,
      }}
    >
      <div
        style={{
          display:       "flex",
          alignItems:    "center",
          gap:           8,
          marginBottom:  12,
          paddingBottom: 8,
          borderBottom:  "1px solid #21262d",
        }}
      >
        <span style={{ fontSize: 12 }}>{icon}</span>
        <h3 style={{ fontWeight: 600, color: "#e6edf3", fontSize: 12, letterSpacing: 0.3 }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display:        "flex",
        justifyContent: "space-between",
        padding:        "4px 0",
        borderBottom:   "1px solid rgba(33,38,45,0.5)",
        fontSize:       11,
      }}
    >
      <span style={{ color: "#484f58" }}>{label}</span>
      <span
        style={{
          color:      "#c9d1d9",
          textAlign:  "right",
          marginLeft: 16,
          wordBreak:  "break-all",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div
      style={{
        height:       4,
        background:   "#21262d",
        borderRadius: 2,
        margin:       "6px 0 10px",
      }}
    >
      <div
        style={{
          height:       4,
          background:   color,
          borderRadius: 2,
          width:        value,
        }}
      />
    </div>
  );
}

export function AboutOverlay({ open, deviceInfo, onClose }) {
  if (!open || !deviceInfo) return null;

  const info    = deviceInfo;
  const ram     = info.Dashboard?.RAM;
  const storage = info.Dashboard?.InternalStorage;
  const cpu     = info.CPU;

  return (
    <div
      style={{
        position:   "fixed",
        top:        44,
        left:       0,
        right:      0,
        bottom:     0,
        background: "#07090e",
        zIndex:     80,
        overflowY:  "auto",
        padding:    "20px 20px 40px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "flex-start",
            marginBottom:   20,
            paddingBottom:  14,
            borderBottom:   "1px solid #21262d",
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e6edf3" }}>
              System Information
            </h1>
            <p style={{ color: "#484f58", fontSize: 11, marginTop: 3 }}>
              {info.Device?.Brand} {info.Device?.Model} — {info.Device?.DeviceName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background:   "#161b22",
              border:       "1px solid #30363d",
              borderRadius: 3,
              color:        "#8b949e",
              padding:      "5px 12px",
              cursor:       "pointer",
              fontSize:     12,
              fontFamily:   "inherit",
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap:                 14,
          }}
        >
          {/* Device identity */}
          {info.Device && (
            <Card title="Device Identity" icon="◈">
              {Object.entries(info.Device).map(([k, v]) => (
                <Row key={k} label={k} value={String(v)} />
              ))}
            </Card>
          )}

          {/* System Resources */}
          {ram && storage && (
            <Card title="System Resources" icon="▣">
              <Row label="RAM Total" value={ram.Total} />
              <Row label="RAM Used"  value={ram.Used}  />
              <ProgressBar value={ram.Usage}     color="#1f6feb" />
              <Row label="Storage Total" value={storage.Total} />
              <Row label="Storage Free"  value={storage.Free}  />
              <ProgressBar value={storage.Usage} color="#8957e5" />
              {info.Dashboard?.Display &&
                Object.entries(info.Dashboard.Display).map(([k, v]) => (
                  <Row key={k} label={k} value={String(v)} />
                ))}
            </Card>
          )}

          {/* CPU */}
          {cpu && (
            <Card title="CPU" icon="⚙">
              <Row label="Processor"    value={cpu.Processor} />
              <Row label="Architecture" value={cpu.Architecture} />
              <Row label="Cores"        value={cpu.Cores} />
              <Row label="Type"         value={cpu.CPUType} />
              {cpu.FrequencyRange && (
                <Row label="Frequency" value={cpu.FrequencyRange} />
              )}
              {Array.isArray(cpu.CoreStatus) && (
                <div
                  style={{
                    display:             "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap:                 5,
                    marginTop:           10,
                  }}
                >
                  {cpu.CoreStatus.map((c) => (
                    <div
                      key={c.Core}
                      style={{
                        background:   "#161b22",
                        border:       "1px solid #21262d",
                        borderRadius: 3,
                        padding:      "5px 8px",
                        textAlign:    "center",
                        fontSize:     10,
                      }}
                    >
                      <div style={{ color: "#484f58" }}>Core {c.Core}</div>
                      <div style={{ color: "#3fb950", fontWeight: 700 }}>
                        {c.CurrentFreq}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Network */}
          {info.Network && (
            <Card title="Network" icon="◎">
              {Object.entries(info.Network)
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => (
                  <Row key={k} label={k} value={Array.isArray(v) ? v.join(", ") : String(v)} />
                ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
