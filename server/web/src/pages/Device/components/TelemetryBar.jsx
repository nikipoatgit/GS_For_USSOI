// ─── TelemetryBar ─────────────────────────────────────────────────────────────
// Displays decoded telemetry: battery, temp, signal bars, WiFi, throughput, GPS.

import { signalBars, wifiBars, stat } from "../utils/helpers.js";

// ── Signal bar graphic ───────────────────────────────────────────────────────
function SignalBars({ count }) {
  const heights = [4, 7, 11, 15];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 15 }}>
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            width:        3,
            height:       h,
            borderRadius: 1,
            background:   i < count ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );
}

// ── WiFi arc graphic ─────────────────────────────────────────────────────────
function WifiIcon({ count }) {
  const c = (idx) => (idx < count ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.15)");
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
      <path fill={c(3)} transform="translate(0,-2)"
        d="M21.192 8.808a13 13 0 00-18.384 0l1.414 1.414a11 11 0 0115.556 0l1.414-1.414z" />
      <path fill={c(2)} transform="translate(0,-2)"
        d="M18.364 11.636a9 9 0 00-12.728 0l1.414 1.414a7 7 0 019.9 0l1.414-1.414z" />
      <path fill={c(1)} transform="translate(0,-2.3)"
        d="M15.536 14.464a5 5 0 00-7.072 0l1.414 1.414a3 3 0 014.242 0l1.414-1.414z" />
      <circle fill={c(0)} cx="12" cy="15" r="1.25" />
    </svg>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Sep() {
  return (
    <span style={{ width: 1, height: 14, background: "#21262d", flexShrink: 0 }} />
  );
}

// ── Stat item ────────────────────────────────────────────────────────────────
function Item({ icon, value, unit, iconColor, title }) {
  return (
    <div title={title} style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ color: iconColor ?? "#8b949e", fontSize: 11 }}>{icon}</span>
      <span style={{ fontWeight: 600, color: "#e6edf3" }}>{value}</span>
      {unit && <span style={{ color: "#484f58" }}>{unit}</span>}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function TelemetryBar({ telemetry: t }) {
  const sigCount  = t ? signalBars(t.signal)    : 0;
  const wifiCount = t ? wifiBars(t.wifiSignal)  : 0;

  return (
    <div
      style={{
        width:        "96%",
        margin:       "8px auto 0",
        background:   "#0d1117",
        border:       "1px solid #21262d",
        borderRadius: 4,
        padding:      "8px 14px",
      }}
    >
      {/* ── Row 1: power + radio + throughput ── */}
      <div
        style={{
          display:    "flex",
          flexWrap:   "wrap",
          alignItems: "center",
          gap:        "8px 16px",
        }}
      >
        <Item icon="▣" iconColor="#3fb950" title="Battery"
          value={stat(t?.batLevel)} unit="%" />
        <Item icon="◈" iconColor="#f85149" title="Temperature"
          value={stat(t?.batTemp)} unit="°C" />
        <Item icon="⚡" iconColor="#d29922" title="Current"
          value={stat(t?.batCurrent)} unit="mA" />

        <Sep />

        {/* Signal bars */}
        <div title="Cell Signal" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SignalBars count={sigCount} />
          <span
            style={{
              fontSize:      10,
              background:    "#161b22",
              border:        "1px solid #30363d",
              color:         "#c9d1d9",
              padding:       "0 5px",
              borderRadius:  2,
              fontWeight:    600,
            }}
          >
            {stat(t?.netType)}
          </span>
          <span style={{ fontWeight: 600, color: "#e6edf3" }}>{stat(t?.signal)}</span>
          <span style={{ color: "#484f58" }}>dBm</span>
        </div>

        <Sep />

        {/* WiFi */}
        <div title="Wi-Fi" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <WifiIcon count={wifiCount} />
          <span style={{ fontWeight: 600, color: "#e6edf3" }}>{stat(t?.wifiSignal)}</span>
          <span style={{ color: "#484f58" }}>dBm</span>
        </div>

        <Sep />

        {/* Throughput */}
        <div title="Upload / Download" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#8b949e", fontSize: 11 }}>⇅</span>
          <span style={{ color: "#3fb950", fontSize: 10 }}>↑</span>
          <span style={{ fontWeight: 600, color: "#e6edf3" }}>{stat(t?.upload)}</span>
          <span style={{ color: "#484f58", margin: "0 3px" }}>/</span>
          <span style={{ color: "#58a6ff", fontSize: 10 }}>↓</span>
          <span style={{ fontWeight: 600, color: "#e6edf3" }}>{stat(t?.download)}</span>
          <span style={{ color: "#484f58" }}>KBps</span>
        </div>

        <div title="Data Used" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#8b949e", fontSize: 11 }}>◫</span>
          <span style={{ fontWeight: 600, color: "#e6edf3" }}>{stat(t?.dataUsed)}</span>
          <span style={{ color: "#484f58" }}>MB</span>
        </div>
      </div>

      {/* ── Row 2: GPS ── */}
      <div
        style={{
          display:    "flex",
          flexWrap:   "wrap",
          alignItems: "center",
          gap:        "4px 16px",
          marginTop:  8,
          paddingTop: 7,
          borderTop:  "1px solid #21262d",
        }}
      >
        <div title="GPS" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: "#8b949e", fontSize: 11 }}>◎</span>
          <span
            style={{
              color:      "#c9d1d9",
              fontWeight: 500,
            }}
          >
            {t ? `${t.lat.toFixed(6)},  ${t.lon.toFixed(6)}` : "--"}
          </span>
        </div>

        <Sep />

        <Item icon="△" iconColor="#8b949e" title="Altitude"
          value={t?.altitude?.toFixed(1) ?? "--"} unit="m" />
        <Item icon="⊕" iconColor="#8b949e" title="Accuracy"
          value={t?.accuracy?.toFixed(1) ?? "--"} unit="m" />
        <Item icon="▷" iconColor="#8b949e" title="Speed"
          value={t?.speed?.toFixed(1) ?? "--"} unit="km/h" />
      </div>
    </div>
  );
}
