// features/overlays/AboutOverlay.jsx
import { useEffect, useState } from "react";
import { C, btnSx } from "../../shared/theme.js";

export function AboutOverlay({ open, deviceInfo, extendedInfo, onFetchInfo, onClose }) {
  const [isAutoReloading, setIsAutoReloading] = useState(false);

  // ── Robust polling implementation ───────────────────────────────
  useEffect(() => {
    if (!open || !onFetchInfo) return;

    onFetchInfo();
    setIsAutoReloading(true);

    const interval = setInterval(() => {
      onFetchInfo();
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsAutoReloading(false);
    };
  }, [open, onFetchInfo]);

  if (!open || !deviceInfo) return null;

  const { Device, CPU, Sim } = deviceInfo;

  // ── DISTANCE CALCULATION HELPER (UPDATED FOR JSON OBJECT KEYS) ──────────
  const getTowerDistance = (cellObj) => {
    const type = Number(cellObj.g); 
    let taValue = cellObj.ta !== undefined ? Number(cellObj.ta) : -1;
    let rsrpValue = cellObj.rsrp !== undefined ? Number(cellObj.rsrp) : (cellObj.dbm !== undefined ? Number(cellObj.dbm) : -1);

    // Method A: Exact Timing Advance (TA) Math
    if (taValue !== undefined && taValue !== null && taValue !== -1) {
      let stepMeters = 78.125; 
      if (type === 5) {
        // Standard 5G NR subcarrier spacing scaling factor (Defaults to numerology μ = 0)
        const mu = 0; 
        stepMeters = 78.125 / Math.pow(2, mu);
      }
      const taMeters = taValue * stepMeters;
      return formatDistanceUnit(taMeters, "TA Timing");
    }

    // Method B: Fallback Signal Path-loss Propagation Model
    if (rsrpValue !== undefined && rsrpValue !== null && rsrpValue !== -1) {
      const referencePower = -52; // Normalized reference RSRP at 1 meter
      const n = type === 5 || type === 4 ? 3.3 : 3.0; // Path-loss attenuation exponents
      const signalMeters = Math.pow(10, (referencePower - rsrpValue) / (10 * n));
      return formatDistanceUnit(signalMeters, "Est. Signal Range");
    }

    return "N/A";
  };

  const formatDistanceUnit = (meters, methodLabel) => {
    if (meters < 10) return `~ Under 10 m (${methodLabel})`;
    if (meters < 1000) return `${Math.round(meters)} m (${methodLabel})`;
    return `${(meters / 1000).toFixed(2)} km (${methodLabel})`;
  };

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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: C.t0, letterSpacing: 0.2 }}>
                System Information
              </h1>
              {isAutoReloading && (
                <span style={{
                  fontSize: 9, color: "#10b981", background: "#10b98122",
                  padding: "2px 6px", borderRadius: 4, fontWeight: 600
                }}>
                  ● LIVE 5s
                </span>
              )}
            </div>
            <p style={{ color: C.t3, fontSize: 10, marginTop: 3 }}>
              {Device?.Brand} {Device?.Model} — {Device?.DeviceName}
            </p>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onFetchInfo} style={{ ...btnSx, padding: "5px 12px", fontSize: 11, background: C.surface }}>
              ⟳ Reload Now
            </button>
            <button onClick={onClose} style={{ ...btnSx, padding: "5px 12px", fontSize: 11 }}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Grid Cards layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>

          {/* 1. Device Identity Card */}
          {Device && (
            <Card title="Device Identity" icon="◈">
              {Object.entries(Device).map(([key, val]) => (
                <Row key={key} label={key} value={String(val)} />
              ))}
            </Card>
          )}

          {/* 2. CPU Card */}
          {CPU && (
            <Card title="CPU Specifications" icon="⚙">
              {Object.entries(CPU).map(([key, val]) => (
                <Row
                  key={key}
                  label={key}
                  value={Array.isArray(val) ? val.join(", ") : String(val)}
                />
              ))}
            </Card>
          )}

          {/* 3. SIM / Carrier Card */}
          {Sim && (
            <Card title="SIM & Operator Info" icon="◎">
              {Object.entries(Sim).map(([key, val]) => (
                <Row key={key} label={key} value={String(val)} />
              ))}
            </Card>
          )}

          {/* 4. Dynamic Extended Info Cards */}
          {extendedInfo && (() => {
            const entries = Object.entries(extendedInfo);
            const fmtVal = (val) => (String(val) === "-1" || val === undefined || val === null ? "N/A" : String(val));

            return entries.map(([key, val]) => {
              // Handle standard nested telemetry objects if any exist
              if (val && typeof val === "object" && !Array.isArray(val)) {
                return (
                  <Card key={key} title={key.replace(/([A-Z])/g, ' $1').trim()} icon="✦">
                    {Object.entries(val).map(([k, v]) => (
                      <Row key={k} label={k} value={fmtVal(v)} />
                    ))}
                  </Card>
                );
              }

              // --- 1. DECODE SYSTEM SPACE METRICS (Remains positional array pairs) ---
              if (key === "1" && Array.isArray(val)) {
                return (
                  <Card key="sys-space" title="System Performance & Storage" icon="■">
                    <Row label="Total RAM" value={val[0] !== undefined ? `${fmtVal(val[0])} GB` : "N/A"} />
                    <Row label="Available RAM" value={val[1] !== undefined ? `${fmtVal(val[1])} GB` : "N/A"} />
                    {val[2] !== undefined && <Row label="Internal Storage Size" value={`${fmtVal(val[2])} GB`} />}
                    {val[3] !== undefined && <Row label="Free Internal Storage" value={`${fmtVal(val[3])} GB`} />}
                    {val[4] !== undefined && <Row label="External Storage Size" value={`${fmtVal(val[4])} GB`} />}
                    {val[5] !== undefined && <Row label="Free External Storage" value={`${fmtVal(val[5])} GB`} />}
                  </Card>
                );
              }

              // --- 2. DECODE CELLULAR RADIO NETWORKS (Keys "2" and "3" are now JSON Arrays of Objects) ---
              if ((key === "2" || key === "3") && Array.isArray(val)) {
                const titleStr = key === "2" ? "Serving Cellular Layers" : "Neighboring Cell Towers";
                const iconStr ="⛃";

                if (val.length === 0) {
                  return (
                    <Card key={`cell-${key}`} title={titleStr} icon={iconStr}>
                      <div style={{ color: C.t3, fontSize: 11, fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                        No active records discovered
                      </div>
                    </Card>
                  );
                }

                return (
                  <Card key={`cell-${key}`} title={titleStr} icon={iconStr}>
                    {val.map((cellObj, idx) => {
                      if (!cellObj || typeof cellObj !== "object" || Array.isArray(cellObj)) return null;

                      const type = Number(cellObj.g);
                      let netTypeLabel = "Unknown Cell Type";

                      if (type === 5) netTypeLabel = "5G NR (New Radio)";
                      if (type === 4) netTypeLabel = "4G LTE";
                      if (type === 3) netTypeLabel = "3G WCDMA";
                      if (type === 2) netTypeLabel = "2G GSM";

                      return (
                        <div key={idx} style={{
                          marginBottom: idx !== val.length - 1 ? 14 : 0,
                          paddingBottom: idx !== val.length - 1 ? 14 : 0,
                          borderBottom: idx !== val.length - 1 ? `1px dashed ${C.line}44` : "none"
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: type === 5 || type === 4 ? "#10b981" : C.t2, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                            <span>🔹 Index #{idx + 1}</span>
                            <span>{netTypeLabel}</span>
                          </div>

                          {/* 5G NR Object Decoder */}
                          {type === 5 && (
                            <>
                              <Row label="NCI (Cell Identity)" value={fmtVal(cellObj.nci)} />
                              <Row label="TAC (Tracking Area Code)" value={fmtVal(cellObj.tac)} />
                              <Row label="PCI (Physical Cell ID)" value={fmtVal(cellObj.pci)} />
                              <Row label="NRARFCN (Frequency Channel)" value={fmtVal(cellObj.f)} />
                              <Row label="SS-RSRP (Signal Power)" value={cellObj.rsrp !== undefined && cellObj.rsrp !== -1 ? `${cellObj.rsrp} dBm` : "N/A"} />
                              <Row label="SS-RSRQ (Signal Quality)" value={cellObj.rsrq !== undefined && cellObj.rsrq !== -1 ? `${cellObj.rsrq} dB` : "N/A"} />
                              <Row label="SS-SINR (Noise Ratio)" value={cellObj.snr !== undefined && cellObj.snr !== -1 ? `${cellObj.snr} dB` : "N/A"} />
                              <Row label="TA Value" value={cellObj.ta !== undefined && cellObj.ta !== -1 ? fmtVal(cellObj.ta) : "N/A"} />
                              <Row label="Tower Distance" value={getTowerDistance(cellObj)} />
                            </>
                          )}

                          {/* 4G LTE Object Decoder */}
                          {type === 4 && (
                            <>
                              <Row label="TAC (Tracking Area Code)" value={fmtVal(cellObj.tac)} />
                              <Row label="PCI (Physical Cell ID)" value={fmtVal(cellObj.pci)} />
                              <Row label="EARFCN (Frequency Channel)" value={fmtVal(cellObj.f)} />
                              <Row label="RSRP (Signal Power)" value={cellObj.rsrp !== undefined && cellObj.rsrp !== -1 ? `${cellObj.rsrp} dBm` : "N/A"} />
                              <Row label="RSRQ (Signal Quality)" value={cellObj.rsrq !== undefined && cellObj.rsrq !== -1 ? `${cellObj.rsrq} dB` : "N/A"} />
                              <Row label="RSSNR (Noise Ratio)" value={cellObj.snr !== undefined && cellObj.snr !== -1 ? `${cellObj.snr} dB` : "N/A"} />
                              <Row label="TA Value" value={cellObj.ta !== undefined && cellObj.ta !== -1 ? fmtVal(cellObj.ta) : "N/A"} />
                              <Row label="Tower Distance" value={getTowerDistance(cellObj)} />
                            </>
                          )}

                          {/* 3G WCDMA Object Decoder */}
                          {type === 3 && (
                            <>
                              <Row label="CID (Cell ID)" value={fmtVal(cellObj.cid)} />
                              <Row label="LAC (Location Area Code)" value={fmtVal(cellObj.lac)} />
                              <Row label="PSC (Scrambling Code)" value={fmtVal(cellObj.psc)} />
                              <Row label="UARFCN (Frequency Channel)" value={fmtVal(cellObj.f)} />
                              <Row label="RSSI (Signal Strength)" value={cellObj.dbm !== undefined && cellObj.dbm !== -1 ? `${cellObj.dbm} dBm` : "N/A"} />
                              <Row label="TA Value" value="N/A (Not Exposed)" />
                              <Row label="Tower Distance" value={getTowerDistance(cellObj)} />
                            </>
                          )}

                          {/* 2G GSM Object Decoder */}
                          {type === 2 && (
                            <>
                              <Row label="CID (Cell ID)" value={fmtVal(cellObj.cid)} />
                              <Row label="LAC (Location Area Code)" value={fmtVal(cellObj.lac)} />
                              <Row label="ARFCN (Frequency Channel)" value={fmtVal(cellObj.f)} />
                              <Row label="Signal Strength" value={cellObj.dbm !== undefined && cellObj.dbm !== -1 ? `${cellObj.dbm} dBm` : "N/A"} />
                              <Row label="TA Value (0-63)" value={cellObj.ta !== undefined && cellObj.ta !== -1 ? fmtVal(cellObj.ta) : "N/A"} />
                              <Row label="Tower Distance" value={getTowerDistance(cellObj)} />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </Card>
                );
              }

              // --- 3. DECODE NETWORK INTERFACE STRINGS (Key "4") ---
              if (key === "4" && typeof val === "string") {
                return (
                  <Card key="net-interface" title="Network Route Path" icon="⌂">
                    <Row label="Active Routing Path" value={val.toUpperCase()} />
                  </Card>
                );
              }

              return (
                <Card key={`ext-${key}`} title="Extended Status" icon="✦">
                  <Row label={`Payload Key [${key}]`} value={Array.isArray(val) ? val.join(", ") : String(val)} />
                </Card>
              );
            });
          })()}

        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: C.rL, padding: 14 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 7,
        marginBottom: 11, paddingBottom: 8, borderBottom: `1px solid ${C.line}`,
      }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: C.t0, letterSpacing: 0.2, textTransform: "capitalize" }}>{title}</h3>
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

export function ToastContainer({ toasts }) {
  if (!toasts || !toasts.length) return null;
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
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}