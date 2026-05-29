// Packet layout from Android buildPacket():
//   [0]      1 byte   keyframe flag (1 = keyframe, 0 = delta)
//   [1..8]   8 bytes  relative PTS in microseconds, big-endian
//   [9+]     N bytes  raw H.264 Annex-B NAL unit(s)

import { useRef, useCallback, useEffect } from "react";

// 17-byte packets = 9 header + 8 bytes of NAL — these are filler/SEI units
// emitted by MediaCodec between frames. They carry no video data and will
// crash the decoder. Any packet whose NAL payload is under 16 bytes is skipped.
const MIN_NAL_BYTES = 16;

export function useH264Player() {
  const decoderRef    = useRef(null);
  const canvasRef     = useRef(null);
  const ctxRef        = useRef(null);
  const configuredRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Decoder lifecycle
  // ---------------------------------------------------------------------------

  const initDecoder = useCallback((canvas) => {
    if (!("VideoDecoder" in window)) {
      console.error("[H264] WebCodecs not supported in this browser.");
      return;
    }

    canvasRef.current = canvas;
    ctxRef.current    = canvas.getContext("2d");

    const decoder = new VideoDecoder({
      output: (frame) => {
        const ctx = ctxRef.current;
        const cv  = canvasRef.current;
        if (!ctx || !cv) { frame.close(); return; }
        if (cv.width !== frame.displayWidth || cv.height !== frame.displayHeight) {
          cv.width  = frame.displayWidth;
          cv.height = frame.displayHeight;
        }
        ctx.drawImage(frame, 0, 0);
        frame.close();
      },
      error: (e) => {
        console.error("[H264] VideoDecoder error:", e);
        configuredRef.current = false;
      },
    });

    decoderRef.current    = decoder;
    configuredRef.current = false;
    console.log("[H264] VideoDecoder created");
  }, []);

  const configureDecoder = useCallback(() => {
    const decoder = decoderRef.current;
    if (!decoder || decoder.state === "closed") return;

    // *** DO NOT add a `description` field here. ***
    //
    // `description` expects AVCC binary format — the avcC box from inside
    // an MP4 container. Its layout is:
    //   [version, profile, compat, level, 0xFF, 0xE1, spsLen(2), sps...,
    //    0x01, ppsLen(2), pps...]
    //
    // The Android encoder outputs raw Annex-B NAL units:
    //   [0x00, 0x00, 0x00, 0x01, 0x67, ...]
    //
    // These are completely different binary formats. Passing Annex-B bytes
    // as `description` is exactly what causes "Failed to parse avcC".
    //
    // Without `description`, the decoder reads SPS/PPS in-band from the
    // Annex-B stream — which works because Android's MediaCodec prepends
    // SPS + PPS NAL units to every keyframe automatically.
    decoder.configure({
      codec: "avc1.42E01E",        // H.264 Baseline 3.0 — Android encoder default
      optimizeForLatency: true,
    });

    configuredRef.current = true;
    console.log("[H264] VideoDecoder configured");
  }, []);

  // ---------------------------------------------------------------------------
  // Public: feed a raw WebSocket binary message (must be ArrayBuffer)
  // ---------------------------------------------------------------------------

  const feedFrame = useCallback((ab) => {
    if (!(ab instanceof ArrayBuffer)) return;

    // Skip filler/SEI packets — NAL payload too small to be a video frame.
    if (ab.byteLength < 9 + MIN_NAL_BYTES) {
      console.debug("[H264] skipping tiny packet (" + ab.byteLength + " bytes)");
      return;
    }

    const decoder = decoderRef.current;
    if (!decoder) { console.warn("[H264] feedFrame called before initDecoder"); return; }
    if (decoder.state === "closed") return;

    const view       = new DataView(ab);
    const isKeyFrame = view.getUint8(0) === 1;

    // 8-byte big-endian PTS — no getUint64, so read as two 32-bit halves.
    const ptsUs = view.getUint32(1, false) * 0x100000000 + view.getUint32(5, false);

    // Zero-copy view of the NAL bytes starting at byte 9.
    const nalData = new Uint8Array(ab, 9);

    // Configure on the first keyframe. SPS+PPS are already prepended to the
    // NAL data by the Android encoder — no description needed.
    if (isKeyFrame && !configuredRef.current) {
      configureDecoder();
    }

    if (!configuredRef.current) return; // drop delta frames until configured

    try {
      decoder.decode(new EncodedVideoChunk({
        type:      isKeyFrame ? "key" : "delta",
        timestamp: ptsUs,
        data:      nalData,
      }));
    } catch (e) {
      console.error("[H264] decode error:", e);
    }
  }, [configureDecoder]);

  // ---------------------------------------------------------------------------
  // Public: reset — call on WebSocket reconnect or Android stream restart
  // ---------------------------------------------------------------------------

  const reset = useCallback(() => {
    console.log("[H264] reset");
    configuredRef.current = false;
    const decoder = decoderRef.current;
    if (decoder && decoder.state !== "closed") {
      try { decoder.reset(); } catch (e) { console.warn("[H264] reset error:", e); }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      const decoder = decoderRef.current;
      if (decoder && decoder.state !== "closed") {
        try { decoder.close(); } catch {}
      }
    };
  }, []);

  // Usage: pass a <canvas> element to initDecoder, NOT a <video>.
  // Make sure your WebSocket sets: ws.binaryType = "arraybuffer"
  return { initDecoder, feedFrame, reset };
}