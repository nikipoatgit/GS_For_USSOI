// features/ws/useWebSocket.js
// Fire-and-forget WebSocket with auto-reconnect.
// UI truth comes exclusively from server-pushed ui_state messages.
// cmdId is stamped here — server uses it to route ACK/NACK back.

import { useRef, useCallback } from "react";

const RECONNECT_MS = 3_000;

let _counter = 0;
function genCmdId() { return `c${Date.now()}_${++_counter}`; }

export function useWebSocket({ onLog, onMessage }) {
  const wsRef          = useRef(null);
  const reconnectTimer = useRef(null);
  const deviceIdRef    = useRef(null);

  const sendCmd = useCallback((data) => {
    if (data.type === "cmd") delete data.type;
    data.cmdId = genCmdId();
    console.log("[WS OUT]", JSON.stringify(data));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      onLog("error", "Offline", `Cannot send: ${data.cmd}`);
    }
  }, [onLog]);

  const connect = useCallback((deviceId) => {
    if (deviceId) deviceIdRef.current = deviceId;
    const id    = deviceIdRef.current;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url   = `${proto}://${window.location.host}/ws/user?deviceId=${id}`;

    if (wsRef.current) {
      const old = wsRef.current;
      old.onopen = old.onmessage = old.onclose = old.onerror = null;
      old.close();
    }

    console.log("[WS] connecting →", url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      onLog("info", "WebSocket", `Connected · ${id} · ${new Date().toLocaleTimeString()}`);
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
      // Delay initial queries — give device handshake time to settle
      setTimeout(() => {
        sendCmd({ cmd: "get_tunnels" });
        sendCmd({ cmd: "get_params"  });
        sendCmd({ cmd: "get_res"     });
      }, 2000);
    };

    ws.onmessage = (e) => {
      let d;
      try { d = JSON.parse(e.data); } catch { return; }
      console.log("[WS IN]", JSON.stringify(d));
      onMessage(d);
      if (d.type === "nack" || d.type === "error") {
        onLog("error", "NACK", `${d.cmd ?? "?"}: ${d.error ?? "rejected"}`);
      }
    };

    ws.onclose = () => {
      onLog("warn", "WebSocket", `Closed — reconnecting in ${RECONNECT_MS / 1000}s`);
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = null;
          connect();
        }, RECONNECT_MS);
      }
    };

    ws.onerror = () => onLog("error", "WebSocket Error", new Date().toLocaleTimeString());
  }, [onLog, onMessage, sendCmd]);

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
