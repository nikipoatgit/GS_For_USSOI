// features/telemetry/parseTelemetry.js
// Binary telemetry frame decoder + signal strength helpers.

const NET_TYPE = { 0:"CELL",1:"WIFI",2:"BT",3:"ETH",4:"VPN",5:"WIFI_A",6:"LoWPAN",7:"USB" };
const DATA_NET = {
  0:"?",   1:"GPRS",  2:"EDGE",    3:"UMTS",  4:"CDMA",   5:"EVDO0", 6:"EVDOA",
  7:"1xRTT",8:"HSDPA",9:"HSUPA",  10:"HSPA", 11:"IDEN",  12:"EVDOB",13:"LTE",
  14:"EHRPD",15:"HSPAP",16:"GSM", 17:"TDSC", 18:"IWLAN", 19:"LTE_CA",20:"NR",
};

export function parseTelemetry(hex) {
  if (!hex || hex.length < 92) return null;
  try {
    const b = new Uint8Array(46);
    for (let i = 0; i < 46; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    const dv = new DataView(b.buffer);
    const parsedStatus = hex.length > 92 ? parseInt(hex[92], 16) : NaN;
    const status = Number.isNaN(parsedStatus) ? null : parsedStatus;
    return {
      batCurrent: dv.getInt16(0, true),
      batLevel:   dv.getUint8(2),
      batTemp:    dv.getFloat32(3, true),
      signal:     dv.getInt16(8,  true),
      wifiSignal: dv.getInt16(10, true),
      netType:    NET_TYPE[dv.getUint8(12)] ?? String(dv.getUint8(12)),
      dataNet:    DATA_NET[dv.getUint8(13)] ?? String(dv.getUint8(13)),
      upload:     dv.getInt32(14, true) / 100,
      download:   dv.getInt32(18, true) / 100,
      dataUsed:   dv.getInt32(22, true) / 100,
      lat:        dv.getFloat32(26, true),
      lon:        dv.getFloat32(30, true),
      accuracy:   dv.getFloat32(34, true),
      speed:      dv.getFloat32(38, true) * 3.6,
      altitude:   dv.getFloat32(42, true),
      status,
      tunnel:     status == null ? null : (status & 1) !== 0,
      streaming:  status == null ? null : (status & 2) !== 0,
      recording:  status == null ? null : (status & 4) !== 0,
    };
  } catch (e) {
    console.error("[parseTelemetry]", e);
    return null;
  }
}

export function cellBars(dbm) {
  if (dbm == null || dbm >= 0) return 0;
  if (dbm >= -70)  return 4;
  if (dbm >= -90)  return 3;
  if (dbm >= -110) return 2;
  if (dbm >= -130) return 1;
  return 0;
}

export function wifiBars(dbm) {
  if (dbm == null || dbm >= 0) return 0;
  if (dbm >= -20) return 4;
  if (dbm >= -40) return 3;
  if (dbm >= -70) return 2;
  if (dbm >= -90) return 1;
  return 0;
}
