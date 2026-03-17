// ─── hooks/useWebSocket.js ────────────────────────────────────────────────────
// Manages the WS connection, reconnect loop, outgoing command dispatch
// (with pending-request tracking + timeout), and raw message routing.
//
// connect(deviceId) — call with DeviceId from useParams()
// sendCmd(data, revertCb?) — sends a command, tracks ACK/NACK/timeout
// disconnect() — clean teardown

import { useRef, useCallback } from "react";
import { RECONNECT_MS, REQUEST_TIMEOUT_MS } from "../utils/constants.js";
import { genCmdId } from "../utils/helpers.js";

export function useWebSocket({ onLog, onMessage }) {
  const wsRef           = useRef(null);
  const reconnectTimer  = useRef(null);
  const pendingRequests = useRef({});
  const deviceIdRef     = useRef(null); // stored so reconnect can reuse it

  // ── ACK / NACK / timeout handler ────────────────────────────────────────────
  const handleResponse = useCallback((cmdId, status, msg = "") => {
    const req = pendingRequests.current[cmdId];
    if (!req) return;

    clearTimeout(req.timer);
    const time = new Date().toLocaleTimeString();

    if (status === "ack") {
      console.log(`[WS ACK] cmd=${req.cmd} msg="${msg}" at ${time}`);
      if (msg && msg.length > 3) onLog("info", "ACK", `${req.cmd}: ${msg}`);
    } else if (status === "nack") {
      console.warn(`[WS NACK] cmd=${req.cmd} reason="${msg}" at ${time}`);
      onLog("error", "NACK", `${req.cmd}: ${msg || "rejected"}`);
      req.revert?.();
    } else {
      // "timeout" or "error"
      console.error(`[WS TIMEOUT] cmd=${req.cmd} status=${status}`);
      onLog("error", `Request ${status}`, `${req.cmd} – no response`);
      req.revert?.();
    }

    delete pendingRequests.current[cmdId];
  }, [onLog]);

  // ── Send a command ───────────────────────────────────────────────────────────
  const sendCmd = useCallback((data, revertCb = null) => {
    const cmdId    = genCmdId();
    data.cmdId     = cmdId;
    data.timestamp = Date.now();

    console.log("[WS OUT]", JSON.stringify(data));

    const timer = setTimeout(() => {
      handleResponse(cmdId, "timeout");
    }, REQUEST_TIMEOUT_MS);

    pendingRequests.current[cmdId] = {
      cmd:   data.cmd ?? data.type ?? "unknown",
      timer,
      revert: revertCb,
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("[WS OUT] socket not open — dropping:", data.cmd ?? data.type);
      onLog("error", "Offline", `Cannot send: ${data.cmd ?? data.type}`);
      clearTimeout(timer);
      delete pendingRequests.current[cmdId];
      revertCb?.();
    }
  }, [handleResponse, onLog]);

  // ── Connect ──────────────────────────────────────────────────────────────────
  const connect = useCallback((deviceId) => {
    // store so the auto-reconnect closure can reuse it
    if (deviceId) deviceIdRef.current = deviceId;
    const id = deviceIdRef.current;

    const WS_URL = `${
      window.location.protocol === "https:" ? "wss" : "ws"
    }://${window.location.host}/ws/user?deviceId=${id}`;

    // tear down any existing socket
    if (wsRef.current) {
      const old = wsRef.current;
      old.onopen = old.onmessage = old.onclose = old.onerror = null;
      old.close();
    }

    console.log("[WS] connecting →", WS_URL);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] connected — deviceId:", id);
      onLog("info", "WebSocket", `Connected · ${id} · ${new Date().toLocaleTimeString()}`);
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
      // request initial device state
      sendCmd({ type: "cmd", cmd: "get_tunnels" });
      sendCmd({ type: "cmd", cmd: "get_stream_res" });
    };

    ws.onmessage = (e) => {
      let d;
      try { d = JSON.parse(e.data); } catch {
        console.warn("[WS IN] non-JSON frame:", e.data);
        return;
      }
      console.log("[WS IN]", JSON.stringify(d));
      onMessage(d);

      // resolve pending requests
      if ((d.type === "ack" || d.type === "nack") && d.cmdId) {
        handleResponse(d.cmdId, d.type, d.reason ?? "");
      }
      if (d.type === "state" && d.cmdId) {
        handleResponse(d.cmdId, "ack", "");
      }
    };

    ws.onclose = (e) => {
      console.warn("[WS] closed — code:", e.code, "reason:", e.reason);
      onLog("warn", "WebSocket", `Closed – reconnecting in ${RECONNECT_MS / 1000}s`);
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = null;
          connect(); // reuses deviceIdRef.current
        }, RECONNECT_MS);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] error:", err);
      onLog("error", "WebSocket Error", new Date().toLocaleTimeString());
    };
  }, [onLog, onMessage, sendCmd, handleResponse]);

  // ── Disconnect (call on unmount) ─────────────────────────────────────────────
  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    reconnectTimer.current = null;
    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      ws.close();
      wsRef.current = null;
    }
    console.log("[WS] disconnected");
  }, []);

  return { connect, disconnect, sendCmd };
}
