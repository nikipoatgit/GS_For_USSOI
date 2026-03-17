// ─── GCS Constants ───────────────────────────────────────────────────────────

export const DEVICE_ID = "abc";

export const WS_URL = `${
  window.location.protocol === "https:" ? "wss" : "ws"
}://${window.location.host}/ws/ws/user?deviceId=${DEVICE_ID}`;

export const RECONNECT_MS      = 3000;
export const REQUEST_TIMEOUT_MS = 5000;
export const MAX_LOGS          = 100;

export const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302"        },
  { urls: "stun:stun1.l.google.com:19302"       },
  { urls: "stun:stun2.l.google.com:19302"       },
  { urls: "stun:stun.services.mozilla.com:3478" },
  { urls: "stun:stun.stunprotocol.org:3478"     },
];

export const NET_TYPE_MAP = {
  0:"Unknown", 1:"GPRS",  2:"EDGE",    3:"UMTS",    4:"CDMA",
  5:"EVDO_0",  6:"EVDO_A",7:"1xRTT",   8:"HSDPA",   9:"HSUPA",
  10:"HSPA",  12:"EVDO_B",13:"4G",     14:"eHRPD",  15:"HSPA+",
  16:"GSM",   17:"TD_SCDMA",18:"IWLAN",19:"LTE_CA", 20:"5G",
};

export const LOG_STYLES = {
  success: { icon: "✓", color: "#4ade80" },
  error:   { icon: "✕", color: "#f87171" },
  info:    { icon: "·", color: "#60a5fa" },
  warn:    { icon: "!", color: "#fbbf24" },
};
