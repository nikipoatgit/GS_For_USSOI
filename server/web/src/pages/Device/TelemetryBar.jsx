// features/telemetry/TelemetryBar.jsx
// Compact bar showing battery, network signal, and GPS data.
// Dark telemetry strip aligned with the Device page shell.

import { C, FONT } from "../../shared/theme.js";
import { stat } from "../../shared/ui.jsx";

const T = {
    surface:              C.surface,
    surfaceContainer:     C.raised,

    outline:              C.lineMd,
    outlineVariant:       C.line,

    onSurface:            C.t0,
    onSurfaceVariant:     C.t1,

    primary:              C.blue,

    secondaryContainer:   "#0d1f3a",
    onSecondaryContainer: C.blue,

    radius:               18,

    fontFamily:           FONT,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const label = (text) => (
    <span style={{
        fontSize: 9, fontWeight: 600, color: T.outline,
        textTransform: "uppercase", letterSpacing: "0.06em",
        lineHeight: 1,
    }}>{text}</span>
);

const value = (text, unit) => (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
    <span style={{ fontSize: 14, fontWeight: 700, color: T.onSurface, lineHeight: 1 }}>{text}</span>
        {unit && <span style={{ fontSize: 10, fontWeight: 500, color: T.onSurfaceVariant }}>{unit}</span>}
  </span>
);

function Metric({ icon, topLabel, children }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {icon && (
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.primary }}>
          {icon}
        </span>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {topLabel && label(topLabel)}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{children}</div>
            </div>
        </div>
    );
}

function VDivider() {
    return (
        <div
            style={{
                width: 1,
                height: 28,
            background: T.outlineVariant,
                flexShrink: 0,
            }}
        />
    );
}

function HDivider() {
    return <div style={{ height: 1, background: T.outlineVariant, margin: "10px 0" }} />;
}

function InlineStat({ lbl, val, unit }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.outline, textTransform: "uppercase", letterSpacing: "0.06em" }}>{lbl}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.onSurface }}>{val}{unit}</span>
    </span>
    );
}

function Badge({ children }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 700,
            background: T.secondaryContainer,
            color: T.onSecondaryContainer,
            padding: "1px 6px", borderRadius: 999,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
        }}>{children}</span>
    );
}

// ── Signal bar graphic ────────────────────────────────────────────────────────
function Bars({ count, total = 4 }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 14 }}>
      {Array.from({ length: total }, (_, i) => (
          <span key={i} style={{
              width: 3,
              height: 3 + i * 3,
              borderRadius: 1,
              background: i < count ? T.primary : T.outlineVariant,
          }} />
      ))}
    </span>
    );
}

// ── WiFi arc icon (pure SVG) ─────────────────────────────────────────────────
function WifiIcon({ count }) {
    const c = (i) => i < count ? T.primary : T.outlineVariant;
    return (
        <svg width={16} height={14} viewBox="0 0 24 20">
            <path fill={c(3)} d="M21.192 6.808a13 13 0 00-18.384 0l1.414 1.414a11 11 0 0115.556 0l1.414-1.414z"/>
            <path fill={c(2)} d="M18.364 9.636a9 9 0 00-12.728 0l1.414 1.414a7 7 0 019.9 0l1.414-1.414z"/>
            <path fill={c(1)} d="M15.536 12.464a5 5 0 00-7.072 0l1.414 1.414a3 3 0 014.242 0l1.414-1.414z"/>
            <circle fill={c(0)} cx="12" cy="17" r="1.5"/>
        </svg>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function TelemetryBar({ telemetry: t }) {
    return (
        <div style={{
            fontFamily:   T.fontFamily,
            background:   T.surface,

            border:       `1px solid ${T.outline}`,
            borderRadius: T.radius,

            padding:      "12px 14px",
            width:        "100%",

            boxShadow:
                "0 12px 32px rgba(0,0,0,0.18)",
            transition:   "border-radius 0.18s ease, box-shadow 0.18s ease",
        }}>

            {/* ── Row 1: Power · Signal · Data · Thermal/Usage ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px 20px", alignItems: "center" }}>

                {/* Power Section */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Metric icon="battery_5_bar" topLabel="Battery">
                        {value(stat(t?.batLevel), "%")}
                    </Metric>
                    <VDivider />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {label("Current")}
                        {value(stat(t?.batCurrent), "mA")}
                    </div>
                </div>

                {/* Signal Section */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Metric icon="signal_cellular_alt" topLabel="Network">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Badge>{stat(t?.dataNet)}</Badge>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.onSurface }}>{stat(t?.netType)}</span>
                        </div>
                    </Metric>
                    <VDivider />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {label("Signal")}
                        {value(stat(t?.signal), "dBm")}
                    </div>
                </div>

                {/* Data Transfer Section */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Metric icon="wifi" topLabel="Transfer">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 11, color: T.outline }}>↑</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.onSurface }}>{stat(t?.upload)}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 11, color: T.outline }}>↓</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.onSurface }}>{stat(t?.download)}</span>
              </span>
              <span style={{ fontSize: 10, color: T.onSurfaceVariant, fontWeight: 500 }}>KB/s</span>
            </span>
                    </Metric>
                </div>

                {/* Thermal / Usage */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        {label("Thermal")}
                        {value(t?.batTemp != null ? t.batTemp.toFixed(1) : "—", "°C")}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        {label("Usage")}
                        {value(stat(t?.dataUsed), "MB")}
                    </div>
                </div>
            </div>

            {/* ── Row 2: GPS strip ── */}
            <div style={{
                marginTop: 12, paddingTop: 10,
                borderTop: `1px solid ${T.outlineVariant}`,
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 16px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: T.outline }}>location_on</span>
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: T.onSurfaceVariant,
                        fontFamily: FONT, letterSpacing: "0.01em",
                    }}>
            {t ? `${t.lat.toFixed(6)}, ${t.lon.toFixed(6)}` : "—, —"}
          </span>
                </div>
                <div style={{ width: 1, height: 12, background: T.outlineVariant }} />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <InlineStat lbl="Alt" val={t?.altitude?.toFixed(1) ?? "—"} unit="m" />
                    <InlineStat lbl="Acc" val={t?.accuracy?.toFixed(1)  ?? "—"} unit="m" />
                    <InlineStat lbl="Spd" val={t?.speed?.toFixed(1)     ?? "—"} unit="km/h" />
                </div>
            </div>
        </div>
    );
}
