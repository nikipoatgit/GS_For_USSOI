// features/overlays/TunnelsOverlay.jsx
// Full-page overlay listing tunnels with start/stop controls.
// Mirrors AboutOverlay's layout/pattern exactly: same fixed full-page shell,
// same header (title + LIVE badge + Reload/Close buttons), same Card/Row helpers.

import { useEffect, useState } from "react";
import { C, btnSx } from "../../shared/theme.js";

export default function TunnelsOverlay({
  isOpen,
  onClose,
  tunnels,
  onFetchTunnels,
  onStartTunnel,
  onStopTunnel,
}) {
  const [pending, setPending] = useState({}); // { [name]: "starting" | "stopping" } — purely cosmetic, never disables
  const [isAutoReloading, setIsAutoReloading] = useState(false);

  // ── Polling implementation matching AboutOverlay pattern ───────────────────
  useEffect(() => {
    if (!isOpen || !onFetchTunnels) return;

    onFetchTunnels();
    setIsAutoReloading(true);

    const interval = setInterval(() => {
      onFetchTunnels();
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsAutoReloading(false);
    };
  }, [isOpen, onFetchTunnels]);

  // Clear local pending labels whenever a new dataset is streamed down
  useEffect(() => {
    setPending({});
  }, [tunnels]);

  if (!isOpen) return null;

  const names = tunnels ? Object.keys(tunnels) : [];

  const handleStart = (name) => {
    setPending((p) => ({ ...p, [name]: "starting" }));
    onStartTunnel?.(name);
  };

  const handleStop = (name) => {
    setPending((p) => ({ ...p, [name]: "stopping" }));
    onStopTunnel?.(name);
  };

  return (
    <div style={{
      position: "fixed", top: 46, left: 0, right: 0, bottom: 0,
      background: C.base, zIndex: 80, overflowY: "auto", padding: "20px 20px 40px",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${C.line}`,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: C.t0, letterSpacing: 0.2 }}>
                Tunnels
              </h1>
              {isAutoReloading && (
                <span style={{
                  fontSize: 9, color: "#10b981", background: "#10b98122",
                  padding: "2px 6px", borderRadius: 4, fontWeight: 600
                }}>
                  ● LIVE 3s
                </span>
              )}
            </div>
            <p style={{ color: C.t3, fontSize: 10, marginTop: 3 }}>
              {names.length} tunnel{names.length === 1 ? "" : "s"} reported
            </p>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onFetchTunnels} style={{ ...btnSx, padding: "5px 12px", fontSize: 11, background: C.surface }}>
              ⟳ Reload Now
            </button>
            <button onClick={onClose} style={{ ...btnSx, padding: "5px 12px", fontSize: 11 }}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Loading state */}
        {tunnels === null && (
          <div style={{ color: C.t3, fontSize: 11, textAlign: "center", padding: "40px 0" }}>
            Loading tunnels…
          </div>
        )}

        {/* Empty state */}
        {tunnels !== null && names.length === 0 && (
          <div style={{ color: C.t3, fontSize: 11, textAlign: "center", padding: "40px 0" }}>
            No tunnels found.
          </div>
        )}

        {/* Grid of tunnel cards */}
        {names.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {names.map((name) => {
              const running = tunnels[name];
              const busy = pending[name];
              return (
                <Card key={name} title={name} icon="⛺">
                  <Row
                    label="Status"
                    value={running ? "Running" : "Stopped"}
                    accent={running ? C.green : C.t2}
                  />

                  {/* Both buttons are always pressable — no disabled state */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button
                      onClick={() => handleStart(name)}
                      style={{
                        ...btnSx, flex: 1, padding: "6px 0",
                        color: C.green, borderColor: `${C.green}40`,
                        background: busy === "starting" ? `${C.green}18` : C.raised,
                      }}
                    >
                      {busy === "starting" ? "Starting…" : "Start"}
                    </button>
                    <button
                      onClick={() => handleStop(name)}
                      style={{
                        ...btnSx, flex: 1, padding: "6px 0",
                        color: C.red, borderColor: `${C.red}40`,
                        background: busy === "stopping" ? `${C.red}18` : C.raised,
                      }}
                    >
                      {busy === "stopping" ? "Stopping…" : "Stop"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Local helpers (same shapes as AboutOverlay's Card / Row) ──────────────────
function Card({ title, icon, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: C.rL, padding: 14 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        marginBottom: 11, paddingBottom: 8, borderBottom: `1px solid ${C.line}`,
      }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: C.t0, letterSpacing: 0.2 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "4px 0", fontSize: 11,
    }}>
      <span style={{ color: C.t3 }}>{label}</span>
      <span style={{ color: accent ?? C.t1, fontWeight: 600 }}>{value}</span>
    </div>
  );
}