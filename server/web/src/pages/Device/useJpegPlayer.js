// Packet layout from Android HFH264Media buildPacket() (JPEG stream variant):
//   [0]      1 byte   always 1 (every JPEG is independently decodable)
//   [1..8]   8 bytes  capture timestamp ms, big-endian
//   [9+]     N bytes  JPEG bytes
//
// Same header as useH264Player, different payload codec. Used for HFPS mode
// instead of useH264Player, painting onto the same <canvas> ref.

import { useRef, useCallback, useEffect } from "react";

export function useJpegPlayer(onStats) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const busyRef = useRef(false); // drop frames while a decode is in flight

  const statsRef = useRef({ fps: 0, frames: 0, lastFpsTs: performance.now() });
  const latencyRef = useRef(0);
  const onStatsRef = useRef(null);
  onStatsRef.current = onStats;

  const initDecoder = useCallback((canvas) => {
    canvasRef.current = canvas;
    ctxRef.current = canvas.getContext("2d");
  }, []);

  const feedFrame = useCallback((ab) => {
    if (!(ab instanceof ArrayBuffer)) return;
    if (ab.byteLength < 10) return;
    if (busyRef.current) return; // snapshot stream — drop, don't queue

    const view = new DataView(ab);
    const captureMs = Number(view.getBigUint64(1, false));
    const jpegBytes = new Uint8Array(ab, 9);

    busyRef.current = true;
    createImageBitmap(new Blob([jpegBytes], { type: "image/jpeg" }))
      .then((bitmap) => {
        const ctx = ctxRef.current;
        const cv = canvasRef.current;
        if (!ctx || !cv) { bitmap.close(); return; }

        const container = cv.parentElement;
        if (container && (cv.width !== container.clientWidth || cv.height !== container.clientHeight)) {
          cv.width = container.clientWidth;
          cv.height = container.clientHeight;
        }

        const cw = cv.width, ch = cv.height;
        const fw = bitmap.width, fh = bitmap.height;
        const scale = Math.min(cw / fw, ch / fh);
        const rw = fw * scale, rh = fh * scale;
        const x = (cw - rw) / 2, y = (ch - rh) / 2;

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(bitmap, x, y, rw, rh);
        bitmap.close();

        const frameLatency = Date.now() - captureMs;
        latencyRef.current = Math.round((latencyRef.current + frameLatency) / 2);

        const now = performance.now();
        statsRef.current.frames++;
        const elapsed = now - statsRef.current.lastFpsTs;
        if (elapsed >= 1000) {
          statsRef.current.fps = Math.round((statsRef.current.frames * 1000) / elapsed);
          statsRef.current.frames = 0;
          statsRef.current.lastFpsTs = now;
          onStatsRef.current?.({ fps: statsRef.current.fps, latency: latencyRef.current });
        }
      })
      .catch((e) => console.error("[JPEG] decode failed", e))
      .finally(() => { busyRef.current = false; });
  }, []);

  const reset = useCallback(() => {
    statsRef.current = { fps: 0, frames: 0, lastFpsTs: performance.now() };
    latencyRef.current = 0;
    busyRef.current = false;
    const ctx = ctxRef.current, cv = canvasRef.current;
    if (ctx && cv) ctx.clearRect(0, 0, cv.width, cv.height);
  }, []);

  useEffect(() => () => { canvasRef.current = null; ctxRef.current = null; }, []);

  return { initDecoder, feedFrame, reset };
}