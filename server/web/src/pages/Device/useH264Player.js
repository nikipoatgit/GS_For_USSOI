// features/video/useH264Player.js
// MSE-based H.264 player hook.
// Backend MUST send fragmented MP4 (fMP4) — raw NAL units won't work with MSE.

import { useRef, useCallback } from "react";

const MIME = 'video/mp4; codecs="avc1.42E01E"';

export function useH264Player() {
  const msRef  = useRef(null);
  const sbRef  = useRef(null);
  const vidRef = useRef(null);
  const queue  = useRef([]);
  const ready  = useRef(false);

  const drain = useCallback(() => {
    if (!sbRef.current || sbRef.current.updating || queue.current.length === 0) return;
    const chunk = queue.current.shift();
    try {
      sbRef.current.appendBuffer(chunk);
    } catch (e) {
      console.error("[H264] appendBuffer:", e);
    }
  }, []);

  const attachVideo = useCallback((videoEl) => {
    if (!videoEl || msRef.current) return;
    if (!MediaSource.isTypeSupported(MIME)) {
      console.error("[H264] MIME not supported:", MIME);
      return;
    }

    vidRef.current = videoEl;
    const ms = new MediaSource();
    msRef.current = ms;
    videoEl.src = URL.createObjectURL(ms);

    ms.addEventListener("sourceopen", () => {
      const sb = ms.addSourceBuffer(MIME);
      sb.mode = "sequence";
      sb.addEventListener("updateend", drain);
      sbRef.current = sb;
      ready.current = true;
      console.log("[H264] SourceBuffer ready");
    });
  }, [drain]);

  const feedFrame = useCallback((ab) => {
    if (!ready.current || !(ab instanceof ArrayBuffer)) return;
    // Strip first 9 bytes (custom header) — remainder is fMP4 payload
    const payload = ab.slice(9);
    if (!payload || payload.byteLength < 5) {
      console.warn("[H264] invalid frame (byteLength < 5)");
      return;
    }
    queue.current.push(payload);
    drain();
  }, [drain]);

  const reset = useCallback(() => {
    console.log("[H264] reset");
    ready.current = false;
    queue.current = [];
    try { sbRef.current?.abort(); } catch {}
    sbRef.current = null;
    try { msRef.current?.endOfStream(); } catch {}
    msRef.current = null;
    if (vidRef.current) {
      URL.revokeObjectURL(vidRef.current.src);
      vidRef.current.src = "";
      vidRef.current = null;
    }
  }, []);

  return { attachVideo, feedFrame, reset };
}
