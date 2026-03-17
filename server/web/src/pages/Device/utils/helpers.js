// ─── GCS Utilities ───────────────────────────────────────────────────────────

import { NET_TYPE_MAP } from "./constants.js";

/** Generate a random 4-digit command ID like "c4821" */
export function genCmdId() {
  return "c" + Math.floor(1000 + Math.random() * 9000);
}

/**
 * Decode the binary telemetry hex string sent by the device.
 * Layout (little-endian):
 *   Int16  batCurrent  (mA)
 *   Uint8  batLevel    (%)
 *   Float32 batTemp    (°C)
 *   Uint8  thermal     (ignored)
 *   Int16  signal      (dBm)
 *   Int16  wifiSignal  (dBm)
 *   Uint8  netType     (ignored, using dataNet)
 *   Uint8  dataNet     (network type index)
 *   Float32 upload     (KBps)
 *   Float32 download   (KBps)
 *   Float32 dataUsed   (MB)
 *   Float64 lat
 *   Float64 lon
 *   Float32 accuracy   (m)
 *   Float32 speed      (km/h)
 *   Float64 altitude   (m)
 *   [last nibble] status flags
 */
export function parseTelemetry(hexString) {
  const trimmed    = hexString.trim();
  const statusChar = trimmed.slice(-1);
  const status     = parseInt(statusChar, 16);
  if (Number.isNaN(status)) return null;

  const payloadHex = trimmed.slice(0, -1);
  const bytes      = payloadHex.match(/[\da-f]{2}/gi);
  if (!bytes) return null;

  const buf = new Uint8Array(bytes.map(h => parseInt(h, 16))).buffer;
  const v   = new DataView(buf);
  let o     = 0;

  const batCurrent = v.getInt16(o, true);    o += 2;
  const batLevel   = v.getUint8(o++);
  const batTemp    = v.getFloat32(o, true);  o += 4;
  /* thermal */                               o++;
  const signal     = v.getInt16(o, true);    o += 2;
  const wifiSignal = v.getInt16(o, true);    o += 2;
  /* netType (raw) */                         o++;
  const dataNet    = v.getUint8(o++);
  const upload     = v.getFloat32(o, true);  o += 4;
  const download   = v.getFloat32(o, true);  o += 4;
  const dataUsed   = v.getFloat32(o, true);  o += 4;
  const lat        = v.getFloat64(o, true);  o += 8;
  const lon        = v.getFloat64(o, true);  o += 8;
  const accuracy   = v.getFloat32(o, true);  o += 4;
  const speed      = v.getFloat32(o, true);  o += 4;
  const altitude   = v.getFloat64(o, true);

  return {
    status,
    batCurrent,
    batLevel,
    batTemp:   batTemp.toFixed(1),
    signal,
    wifiSignal,
    netType:   NET_TYPE_MAP[dataNet] ?? "Unknown",
    upload:    upload.toFixed(2),
    download:  download.toFixed(2),
    dataUsed:  dataUsed.toFixed(1),
    lat, lon, accuracy, speed, altitude,
  };
}

/** Returns 0–4 signal bar count from a dBm RSSI value */
export function signalBars(dBm) {
  if (dBm >= -80)  return 4;
  if (dBm >= -90)  return 3;
  if (dBm >= -100) return 2;
  if (dBm >= -115) return 1;
  return 0;
}

/** Returns 0–4 wifi bar count from an RSSI value */
export function wifiBars(rssi) {
  if (rssi >= -45) return 4;
  if (rssi >= -60) return 3;
  if (rssi >= -70) return 2;
  if (rssi >= -85) return 1;
  return 0;
}

/** Null-safe display value with fallback */
export const stat = (v, fallback = "--") => v ?? fallback;
