// features/telemetry/TelemetryBar.jsx
// Compact bar showing battery, network signal, and GPS data.
// Minimal: no icons that add noise — just readable data rows.

import { C } from "../../shared/theme.js";
import { stat } from "../../shared/ui.jsx";
import { cellBars, wifiBars } from "./parseTelemetry.js";

// ── Signal bar graphic ────────────────────────────────────────────────────────
function Bars({ count, total = 4 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 12 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          width:        3,
          height:       3 + i * 3,
          borderRadius: 1,
          background:   i < count ? C.t1 : C.line,
        }} />
      ))}
    </span>
  );
}

// ── WiFi arc icon (pure SVG) ─────────────────────────────────────────────────
function WifiIcon({ count }) {
  const c = (i) => i < count ? C.t1 : C.line;
  return (
    <svg width={14} height={12} viewBox="0 0 24 20">
      <path fill={c(3)} d="M21.192 6.808a13 13 0 00-18.384 0l1.414 1.414a11 11 0 0115.556 0l1.414-1.414z"/>
      <path fill={c(2)} d="M18.364 9.636a9 9 0 00-12.728 0l1.414 1.414a7 7 0 019.9 0l1.414-1.414z"/>
      <path fill={c(1)} d="M15.536 12.464a5 5 0 00-7.072 0l1.414 1.414a3 3 0 014.242 0l1.414-1.414z"/>
      <circle fill={c(0)} cx="12" cy="17" r="1.5"/>
    </svg>
  );
}

// ── Small value cell ─────────────────────────────────────────────────────────
function Val({ label, value, unit, dimLabel }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 3 }}>
      {label && (
        <span style={{ fontSize: 9, color: dimLabel ? C.t3 : C.t2, letterSpacing: 0.5 }}>
          {label}
        </span>
      )}
      <span style={{ fontSize: 11, fontWeight: 600, color: C.t0 }}>{value}</span>
      {unit && <span style={{ fontSize: 9, color: C.t3 }}>{unit}</span>}
    </span>
  );
}

function Sep() {
  return <span style={{ width: 1, height: 11, background: C.line, flexShrink: 0, alignSelf: "center" }} />;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function TelemetryBar({ telemetry: t }) {
  const cell = t ? cellBars(t.signal)    : 0;
  const wifi = t ? wifiBars(t.wifiSignal): 0;

  return (
    <div style={{
      width:        "96%",
      margin:       "7px auto 0",
      background:   C.surface,
      border:       `1px solid ${C.line}`,
      borderRadius: C.r,
      padding:      "8px 14px",
    }}>

      {/* Row 1 — power + network */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "5px 13px" }}>

        {/* Battery */}
        <Val label="BAT"  value={stat(t?.batLevel)}                          unit="%"/>
        <Val label="TEMP" value={t?.batTemp != null ? t.batTemp.toFixed(1) : "—"} unit="°C"/>
        <Val label="mA"   value={stat(t?.batCurrent)}/>

        <Sep/>

        {/* Cell */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Bars count={cell}/>
          <Badge>{stat(t?.dataNet)}</Badge>
          <Badge muted>{stat(t?.netType)}</Badge>
          <Val value={stat(t?.signal)} unit="dBm"/>
        </span>

        <Sep/>

        {/* Wi-Fi */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <WifiIcon count={wifi}/>
          <Val value={stat(t?.wifiSignal)} unit="dBm"/>
        </span>

        <Sep/>

        {/* Throughput */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, color: C.t2 }}>↑</span>
          <Val value={stat(t?.upload)}   unit="KB/s"/>
          <span style={{ fontSize: 9, color: C.t3 }}>/</span>
          <span style={{ fontSize: 9, color: C.t2 }}>↓</span>
          <Val value={stat(t?.download)} unit="KB/s"/>
        </span>

        <Val label="USED" value={stat(t?.dataUsed)} unit="MB"/>
      </div>

      {/* Row 2 — GPS */}
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center",
        gap: "4px 13px", marginTop: 6, paddingTop: 6,
        borderTop: `1px solid ${C.line}`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.t0, letterSpacing: 0.2 }}>
          {t ? `${t.lat.toFixed(6)}, ${t.lon.toFixed(6)}` : "—, —"}
        </span>
        <Sep/>
        <Val label="ALT" value={t?.altitude?.toFixed(1) ?? "—"} unit="m"/>
        <Val label="ACC" value={t?.accuracy?.toFixed(1)  ?? "—"} unit="m"/>
        <Val label="SPD" value={t?.speed?.toFixed(1)     ?? "—"} unit="km/h"/>
      </div>
    </div>
  );
}

// ── Inline badge ─────────────────────────────────────────────────────────────
function Badge({ children, muted }) {
  return (
    <span style={{
      fontSize:     9,
      fontWeight:   600,
      background:   C.raised,
      border:       `1px solid ${C.line}`,
      color:        muted ? C.t2 : C.t0,
      padding:      "1px 5px",
      borderRadius: 2,
      letterSpacing: 0.3,
    }}>{children}</span>
  );
}
