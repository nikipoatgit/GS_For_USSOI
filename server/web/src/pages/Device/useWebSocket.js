// features/ws/useWebSocket.js
// Fire-and-forget WebSocket with auto-reconnect.
// UI truth comes exclusively from server-pushed ui_state messages.
// cmdId is stamped here — server uses it to route ACK/NACK back.

import { useRef, useCallback, useEffect } from "react";

const RECONNECT_MS = 3_000;

let _counter = 0;
function genCmdId() { return `c${Date.now()}_${++_counter}`; }
function binaryPreview(ab, max = 16) {
  return [...new Uint8Array(ab).slice(0, max)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}


export function useWebSocket({
  onLog,
  onMessage,
  onBinary,
  bootstrapOnOpen = true,
  enableLogging = true,
}) {

  const log = (...args) => {
    if (enableLogging) {
      console.log(...args);
    }
  };

  const debug = (...args) => {
    if (enableLogging) {
      console.debug(...args);
    }
  };

  const wsRef = useRef(null);
  const connectRef = useRef(null);
  const reconnectTimer = useRef(null);
  const deviceIdRef = useRef(null);
  const binaryCountRef = useRef(0);

  const sendCmd = useCallback((data) => {
    const message = { ...data };
    if (message.type === "cmd") delete message.type;
    if (!message.cmdId) message.cmdId = genCmdId();
    let payload;
    try {
      payload = JSON.stringify(message);
    } catch (err) {
      onLog("error", "WebSocket", `Cannot serialize ${message.cmd ?? "message"}: ${err.message}`);
      return;
    }
    log("[WS OUT]", payload);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    } else {
      onLog("error", "Offline", `Cannot send: ${message.cmd}`);
    }
  }, [onLog]);

  const connect = useCallback((deviceId, path = "/ws/user") => {
    if (deviceId) deviceIdRef.current = deviceId;
    const id = deviceIdRef.current;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}${path}?deviceId=${id}`;

    if (wsRef.current) {
      const old = wsRef.current;
      old.onopen = old.onmessage = old.onclose = old.onerror = null;
      old.close();
    }

    log("[WS] connecting →", url);
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      onLog("info", "WebSocket", `connected · ${url} · ${new Date().toLocaleTimeString()}`);
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
      if (bootstrapOnOpen) {
        // Delay initial queries — give device handshake time to settle
        setTimeout(() => {
          sendCmd({ cmd: "get_tunnels" });
          sendCmd({ cmd: "get_params" });
          sendCmd({ cmd: "get_res" });
          sendCmd({ cmd: "get_identity" });
        }, 2000);
      }
    };

    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        binaryCountRef.current++;
        if (binaryCountRef.current <= 10 || binaryCountRef.current % 30 === 0) {
          debug("[WS IN binary]", {
            packet: binaryCountRef.current,
            bytes: e.data.byteLength,
            firstBytes: binaryPreview(e.data),
          });
        }
        onBinary?.(e.data);
        return;
      }
      let d;
      try { d = JSON.parse(e.data); } catch { return; }
      log("[WS IN]", JSON.stringify(d));
      onMessage(d);
      const status = String(d.status ?? d.data?.status ?? "").toLowerCase();
      if (d.type === "ack" || (d.type === "response" && (status === "ok" || status === "okay" || status === "success"))) {
        onLog("success", "Response", `${d.cmd ?? "?"}${status ? ` · ${status}` : ""}`);
      }
      if (d.type === "nack" || d.type === "error") {
        onLog("error", "NACK", `${d.cmd ?? "?"}: ${d.error ?? "rejected"}`);
      }
    };

    ws.onclose = () => {
      onLog("warn", "WebSocket", `Closed — reconnecting in ${RECONNECT_MS / 1000}s`);
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = null;
          connectRef.current?.();
        }, RECONNECT_MS);
      }
    };

    ws.onerror = () => onLog("error", "WebSocket Error", new Date().toLocaleTimeString());
  }, [bootstrapOnOpen, onBinary, onLog, onMessage, sendCmd]);

  useEffect(() => {
    connectRef.current = connect;
    return () => {
      if (connectRef.current === connect) connectRef.current = null;
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    reconnectTimer.current = null;
    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      ws.close();
      wsRef.current = null;
    }
  }, []);

  return { connect, disconnect, sendCmd };
}
