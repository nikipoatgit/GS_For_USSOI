// features/overlays/AboutOverlay.jsx
// Full-screen device info overlay + toast notifications.

import { C, btnSx } from "../../shared/theme.js";

// ─────────────────────────────────────────────────────────────────────────────
// AboutOverlay — system information
// ─────────────────────────────────────────────────────────────────────────────
export function AboutOverlay({ open, deviceInfo, onClose }) {
  if (!open || !deviceInfo) return null;
  const { Device, Dashboard, CPU, Network } = deviceInfo;
  const ram = Dashboard?.RAM, storage = Dashboard?.InternalStorage;

  return (
    <div style={{
      position: "fixed", top: 46, left: 0, right: 0, bottom: 0,
      background: C.base, zIndex: 80, overflowY: "auto", padding: "20px 20px 40px",
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${C.line}`,
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, color: C.t0, letterSpacing: 0.2 }}>
              System Information
            </h1>
            <p style={{ color: C.t3, fontSize: 10, marginTop: 3 }}>
              {Device?.Brand} {Device?.Model} — {Device?.DeviceName}
            </p>
          </div>
          <button onClick={onClose} style={{
            ...btnSx, padding: "5px 12px", fontSize: 11,
          }}>✕ Close</button>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {Device && (
            <Card title="Device Identity" icon="◈">
              {Object.entries(Device).map(([k, v]) => <Row key={k} label={k} value={String(v)}/>)}
            </Card>
          )}
          {ram && storage && (
            <Card title="System Resources" icon="▣">
              <Row label="RAM Total" value={ram.Total}/>
              <Row label="RAM Used"  value={ram.Used}/>
              <Bar value={ram.Usage} color={C.blue}/>
              <Row label="Storage Total" value={storage.Total}/>
              <Row label="Storage Free"  value={storage.Free}/>
              <Bar value={storage.Usage} color="#8957e5"/>
              {Dashboard?.Display && Object.entries(Dashboard.Display).map(([k, v]) =>
                <Row key={k} label={k} value={String(v)}/>
              )}
            </Card>
          )}
          {CPU && (
            <Card title="CPU" icon="⚙">
              <Row label="Processor"    value={CPU.Processor}/>
              <Row label="Architecture" value={CPU.Architecture}/>
              <Row label="Cores"        value={CPU.Cores}/>
              <Row label="Type"         value={CPU.CPUType}/>
              {CPU.FrequencyRange && <Row label="Frequency" value={CPU.FrequencyRange}/>}
              {Array.isArray(CPU.CoreStatus) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 10 }}>
                  {CPU.CoreStatus.map(c => (
                    <div key={c.Core} style={{
                      background: C.raised, border: `1px solid ${C.line}`,
                      borderRadius: C.r, padding: "5px 8px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 9, color: C.t3 }}>Core {c.Core}</div>
                      <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>{c.CurrentFreq}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          {Network && (
            <Card title="Network" icon="◎">
              {Object.entries(Network)
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => (
                  <Row key={k} label={k} value={Array.isArray(v) ? v.join(", ") : String(v)}/>
                ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Card({ title, icon, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: C.rL, padding: 14 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        marginBottom: 11, paddingBottom: 8, borderBottom: `1px solid ${C.line}`,
      }}>
        <span style={{ fontSize: 10, color: C.t3 }}>{icon}</span>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: C.t0, letterSpacing: 0.2 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "4px 0", borderBottom: `1px solid ${C.line}22`,
      fontSize: 11,
    }}>
      <span style={{ color: C.t3, flexShrink: 0, marginRight: 8 }}>{label}</span>
      <span style={{ color: C.t1, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function Bar({ value, color }) {
  return (
    <div style={{ height: 2, background: C.line, borderRadius: 1, margin: "6px 0 10px" }}>
      <div style={{ height: 2, background: color, borderRadius: 1, width: value }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ToastContainer
// ─────────────────────────────────────────────────────────────────────────────
export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center",
      gap: 5, pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: C.surface, border: `1px solid ${C.lineMd}`,
          borderRadius: C.r, color: C.t0, padding: "7px 18px",
          fontSize: 11, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}>{t.message}</div>
      ))}
    </div>
  );
}
