// Packet layout from Android buildPacket():
//   [0]      1 byte   keyframe flag (1 = keyframe, 0 = delta)
//   [1..8]   8 bytes  relative PTS in microseconds, big-endian
//   [9+]     N bytes  raw H.264 Annex-B NAL unit(s)

import { useRef, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Debug configuration
// ---------------------------------------------------------------------------
const DEBUG_DEFAULT = false;

const MIN_NAL_BYTES = 16;
const DEBUG_EVERY_N_PACKETS = 30;
const DEBUG_FIRST_N_PACKETS = 10;

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function makeLogger(debugRef) {
  const log   = (stage, msg, data) => { if (debugRef.current) console.log  (`[H264][${stage}] ${msg}`, ...(data !== undefined ? [data] : [])); };
  const debug = (stage, msg, data) => { if (debugRef.current) console.debug(`[H264][${stage}] ${msg}`, ...(data !== undefined ? [data] : [])); };
  const warn  = (stage, msg, data) => { if (debugRef.current) console.warn (`[H264][${stage}] ${msg}`, ...(data !== undefined ? [data] : [])); };
  const error = (stage, msg, data) => console.error(`[H264][${stage}] ${msg}`, ...(data !== undefined ? [data] : []));
  const info  = (stage, msg, data) => { if (debugRef.current) console.info (`[H264][${stage}] ${msg}`, ...(data !== undefined ? [data] : [])); };
  return { log, debug, warn, error, info };
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function bytesToHex(bytes, max = 32) {
  return [...bytes.slice(0, max)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function nalTypeName(type) {
  switch (type) {
    case 1: return "non-IDR slice";
    case 5: return "IDR keyframe";
    case 6: return "SEI";
    case 7: return "SPS";
    case 8: return "PPS";
    case 9: return "AUD";
    default: return `type ${type}`;
  }
}

function findAnnexBNalTypes(bytes) {
  const nalTypes = [];

  for (let i = 0; i < bytes.length - 4; i++) {
    const isFourByteStartCode =
      bytes[i] === 0x00 && bytes[i + 1] === 0x00 &&
      bytes[i + 2] === 0x00 && bytes[i + 3] === 0x01;

    const isThreeByteStartCode =
      bytes[i] === 0x00 && bytes[i + 1] === 0x00 && bytes[i + 2] === 0x01;

    if (!isFourByteStartCode && !isThreeByteStartCode) continue;

    const nalOffset = i + (isFourByteStartCode ? 4 : 3);
    if (nalOffset >= bytes.length) continue;

    const type = bytes[nalOffset] & 0x1f;
    nalTypes.push({ offset: i, type, name: nalTypeName(type) });
  }

  return nalTypes;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useH264Player(onStats) {
  const decoderRef      = useRef(null);
  const canvasRef       = useRef(null);
  const ctxRef          = useRef(null);
  const configuredRef   = useRef(false);
  const debugEnabledRef = useRef(DEBUG_DEFAULT);

  const { log, debug, warn, error, info } = makeLogger(debugEnabledRef);

  const debugRef = useRef({
    packets: 0,
    bytes: 0,
    keyframes: 0,
    skippedSmall: 0,
    skippedBeforeConfig: 0,
    lastSummaryTs: performance.now(),
  });

  const statsRef = useRef({
    fps: 0,
    frames: 0,
    lastFpsTs: performance.now(),
  });

  // -------------------------------------------------------------------------
  // Latency: running average updated on every decoded frame output.
  // Formula: avg = (prev_avg + current_frame_latency) / 2
  // Reported to onStats whenever FPS is updated (once per second).
  // -------------------------------------------------------------------------
  const latencyRef = useRef(0);   // current running average (ms)

  const onStatsRef = useRef(null);
  onStatsRef.current = onStats;

  // ---------------------------------------------------------------------------
  // Public: toggle debug logging at runtime
  // ---------------------------------------------------------------------------

  const setDebug = useCallback((enabled) => {
    debugEnabledRef.current = !!enabled;
    console.log(`[H264][config] debug logging ${enabled ? "ENABLED" : "DISABLED"}`);
  }, []);

  // ---------------------------------------------------------------------------
  // Decoder lifecycle
  // ---------------------------------------------------------------------------

  const initDecoder = useCallback((canvas) => {
    log("init", "initDecoder called", { canvas });

    if (!("VideoDecoder" in window)) {
      error("init", "WebCodecs VideoDecoder not supported in this browser — cannot proceed");
      return;
    }

    log("init", "WebCodecs available, attaching canvas context");
    canvasRef.current = canvas;
    ctxRef.current    = canvas.getContext("2d");

    log("init", "2d canvas context created", { width: canvas.width, height: canvas.height });

    const decoder = new VideoDecoder({

      // -----------------------------------------------------------------------
      // STAGE: frame output
      // -----------------------------------------------------------------------
      output: (frame) => {
        debug("frame", "VideoDecoder output callback fired", {
          displayWidth:  frame.displayWidth,
          displayHeight: frame.displayHeight,
          timestamp:     frame.timestamp,
          duration:      frame.duration,
        });

        const ctx = ctxRef.current;
        const cv  = canvasRef.current;

        if (!ctx || !cv) {
          warn("frame", "canvas or context missing — dropping frame", { hasCtx: !!ctx, hasCanvas: !!cv });
          frame.close();
          return;
        }

        const container = cv.parentElement;
        if (!container) {
          warn("frame", "canvas has no parentElement — dropping frame");
          frame.close();
          return;
        }

        // Match canvas resolution to container
        if (cv.width !== container.clientWidth || cv.height !== container.clientHeight) {
          const prevW = cv.width, prevH = cv.height;
          cv.width  = container.clientWidth;
          cv.height = container.clientHeight;
          debug("frame", "canvas resized", { from: { w: prevW, h: prevH }, to: { w: cv.width, h: cv.height } });
        }

        const cw = cv.width,  ch = cv.height;
        const fw = frame.displayWidth, fh = frame.displayHeight;

        // Best-fit contain scaling
        const scale = Math.min(cw / fw, ch / fh);
        const rw = fw * scale, rh = fh * scale;
        const x  = (cw - rw) / 2, y = (ch - rh) / 2;

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(frame, x, y, rw, rh);

        log("frame", "frame painted to canvas", { timestamp: frame.timestamp });

        // -----------------------------------------------------------------------
        // STAGE: latency — update running average on every frame
        //   avg = (prev_avg + frame_latency) / 2
        // frame.timestamp was set to captureMs * 1000 (μs) in feedFrame.
        // Dividing back to ms and diffing against Date.now() gives true
        // end-to-end latency: Android capture → network → decode → paint.
        // -----------------------------------------------------------------------
        const captureMs    = frame.timestamp / 1000;         // μs → ms (epoch)
        const frameLatency = Date.now() - captureMs;
        latencyRef.current = Math.round((latencyRef.current + frameLatency) / 2);

        debug("frame", "latency updated", {
          frameLatency,
          runningAvg: latencyRef.current,
        });

        // -----------------------------------------------------------------------
        // STAGE: FPS accounting — report stats once per second
        // -----------------------------------------------------------------------
        const now = performance.now();
        statsRef.current.frames++;
        const elapsed = now - statsRef.current.lastFpsTs;

        if (elapsed >= 1000) {
          statsRef.current.fps       = Math.round((statsRef.current.frames * 1000) / elapsed);
          statsRef.current.frames    = 0;
          statsRef.current.lastFpsTs = now;

          info("stats", "FPS + latency snapshot", {
            fps:      statsRef.current.fps,
            latency:  latencyRef.current,
          });

          onStatsRef.current?.({
            fps:     statsRef.current.fps,
            latency: latencyRef.current,   // running avg at the moment FPS ticks
          });
        }

        frame.close();
        debug("frame", "frame.close() called");
      },

      // -----------------------------------------------------------------------
      // STAGE: decoder error
      // -----------------------------------------------------------------------
      error: (e) => {
        error("decoder", "VideoDecoder emitted an error", {
          message:    e?.message ?? String(e),
          configured: configuredRef.current,
          state:      decoderRef.current?.state,
        });
        configuredRef.current = false;
        warn("decoder", "configuredRef reset to false — waiting for next keyframe");
      },
    });

    decoderRef.current  = decoder;
    configuredRef.current = false;

    log("init", "VideoDecoder instance created", { state: decoder.state });
  }, []);

  // -------------------------------------------------------------------------
  // STAGE: decoder configuration
  // -------------------------------------------------------------------------

  const configureDecoder = useCallback(() => {
    log("configure", "configureDecoder called");

    const decoder = decoderRef.current;
    if (!decoder) {
      warn("configure", "no decoder instance — aborting");
      return;
    }
    if (decoder.state === "closed") {
      warn("configure", "decoder already closed — aborting", { state: decoder.state });
      return;
    }

    // *** DO NOT add a `description` field here. ***
    // `description` expects AVCC binary (from an MP4 avcC box).
    // Android's MediaCodec emits raw Annex-B NAL units — different format.
    // Without `description` the decoder reads SPS/PPS in-band from the
    // Annex-B stream, which is exactly what Android prepends to every keyframe.
    const config = {
      codec: "avc1.42E01E",    // H.264 Baseline 3.0 — Android encoder default
      optimizeForLatency: true,
    };

    log("configure", "calling decoder.configure()", config);
    decoder.configure(config);
    configuredRef.current = true;
    log("configure", "VideoDecoder configured", { state: decoder.state });
  }, []);

  // ---------------------------------------------------------------------------
  // STAGE: feed raw WebSocket binary message (must be ArrayBuffer)
  // ---------------------------------------------------------------------------

  const feedFrame = useCallback((ab) => {

    // -------------------------------------------------------------------------
    // Stage A: input validation
    // -------------------------------------------------------------------------
    if (!(ab instanceof ArrayBuffer)) {
      warn("feedFrame/A-validate", "ignoring non-ArrayBuffer message", { type: typeof ab });
      return;
    }

    const d = debugRef.current;
    d.packets++;
    d.bytes += ab.byteLength;

    const shouldLogPacket =
      d.packets <= DEBUG_FIRST_N_PACKETS || d.packets % DEBUG_EVERY_N_PACKETS === 0;

    debug("feedFrame/A-validate", `packet #${d.packets} received`, {
      byteLength: ab.byteLength,
      totalBytesReceived: d.bytes,
    });

    // -------------------------------------------------------------------------
    // Stage B: small-packet guard (filler / SEI NAL)
    // -------------------------------------------------------------------------
    if (ab.byteLength < 9 + MIN_NAL_BYTES) {
      d.skippedSmall++;
      if (shouldLogPacket) {
        warn("feedFrame/B-size", "skipped small packet", {
          packet: d.packets, bytes: ab.byteLength, minBytes: 9 + MIN_NAL_BYTES,
        });
      }
      return;
    }

    // -------------------------------------------------------------------------
    // Stage C: decoder readiness check
    // -------------------------------------------------------------------------
    const decoder = decoderRef.current;
    if (!decoder) {
      warn("feedFrame/C-decoder", "feedFrame called before initDecoder — dropping", { packet: d.packets });
      return;
    }
    if (decoder.state === "closed") {
      warn("feedFrame/C-decoder", "decoder is closed — dropping", { packet: d.packets, state: decoder.state });
      return;
    }

    debug("feedFrame/C-decoder", "decoder state OK", { state: decoder.state });

    // -------------------------------------------------------------------------
    // Stage D: header parsing + per-packet latency accumulation
    // -------------------------------------------------------------------------
    const view       = new DataView(ab);
    const isKeyFrame = view.getUint8(0) === 1;

    //   [1..8]   8 bytes  capture timestamp ms (System.currentTimeMillis()), big-endian
    const captureMs = Number(view.getBigUint64(1, false));

    if (shouldLogPacket) {
      debug("feedFrame/D-header", "header parsed", {
        packet: d.packets, isKeyFrame, captureMs, totalBytes: ab.byteLength,
      });
    }



    const nalData = new Uint8Array(ab, 9);   // zero-copy view starting at byte 9

    if (isKeyFrame) {
      d.keyframes++;
      log("feedFrame/D-header", `keyframe #${d.keyframes} received`, { captureMs, nalBytes: nalData.byteLength });
    }

    // -------------------------------------------------------------------------
    // Stage E: NAL inspection (sampled)
    // -------------------------------------------------------------------------
    if (shouldLogPacket) {
      const nalTypes = findAnnexBNalTypes(nalData);
      debug("feedFrame/E-nal", "NAL inspection", {
        packet: d.packets, totalBytes: ab.byteLength, nalBytes: nalData.byteLength,
        isKeyFrame, captureMs, decoderState: decoder.state, configured: configuredRef.current,
        firstBytes: bytesToHex(new Uint8Array(ab)), nalFirstBytes: bytesToHex(nalData),
        annexBStartCode: nalData[0] === 0x00 && nalData[1] === 0x00 &&
          (nalData[2] === 0x01 || (nalData[2] === 0x00 && nalData[3] === 0x01)),
        nalTypes,
      });
    }

    // -------------------------------------------------------------------------
    // Stage F: configure decoder on first keyframe
    // -------------------------------------------------------------------------
    if (isKeyFrame && !configuredRef.current) {
      log("feedFrame/F-config", "first keyframe — triggering configureDecoder()");
      configureDecoder();
    }

    // -------------------------------------------------------------------------
    // Stage G: pre-config drop guard
    // -------------------------------------------------------------------------
    if (!configuredRef.current) {
      d.skippedBeforeConfig++;
      if (shouldLogPacket) {
        warn("feedFrame/G-preconfig", "dropped delta frame before decoder is configured", {
          packet: d.packets, isKeyFrame, skippedBeforeConfig: d.skippedBeforeConfig,
        });
      }
      return;
    }

    // -------------------------------------------------------------------------
    // Stage H: decode
    // -------------------------------------------------------------------------
    try {
      const chunk = new EncodedVideoChunk({
        type:      isKeyFrame ? "key" : "delta",
        timestamp: captureMs * 1000,   // μs — WebCodecs expects microseconds; captureMs is epoch-ms from Android
        data:      nalData,
      });

      debug("feedFrame/H-decode", "submitting EncodedVideoChunk", {
        packet: d.packets, type: chunk.type, timestamp: chunk.timestamp,
        byteLength: nalData.byteLength, decodeQueueSize: decoder.decodeQueueSize,
      });

      decoder.decode(chunk);

      debug("feedFrame/H-decode", "decoder.decode() returned", { decodeQueueSize: decoder.decodeQueueSize });

      // -----------------------------------------------------------------------
      // Stage I: periodic summary
      // -----------------------------------------------------------------------
      const now = performance.now();
      if (now - d.lastSummaryTs >= 5000) {
        info("feedFrame/I-summary", "5-second pipeline summary", {
          packets: d.packets, bytes: d.bytes, keyframes: d.keyframes,
          skippedSmall: d.skippedSmall, skippedBeforeConfig: d.skippedBeforeConfig,
          decodeQueueSize: decoder.decodeQueueSize, configured: configuredRef.current,
          fps: statsRef.current.fps, avgLatencyMs: latencyRef.current,
        });
        d.lastSummaryTs = now;
      }
    } catch (e) {
      error("feedFrame/H-decode", "decoder.decode() threw", {
        message: e?.message ?? String(e), packet: d.packets,
        totalBytes: ab.byteLength, isKeyFrame, captureMs,
        firstBytes: bytesToHex(new Uint8Array(ab)), nalFirstBytes: bytesToHex(nalData),
        nalTypes: findAnnexBNalTypes(nalData),
      });
    }
  }, [configureDecoder]);

  // ---------------------------------------------------------------------------
  // STAGE: reset
  // ---------------------------------------------------------------------------

  const reset = useCallback(() => {
    log("reset", "reset() called — clearing state");

    configuredRef.current = false;
    debugRef.current = {
      packets: 0, bytes: 0, keyframes: 0,
      skippedSmall: 0, skippedBeforeConfig: 0,
      lastSummaryTs: performance.now(),
    };
    latencyRef.current = 0;

    log("reset", "debug + latency counters cleared");

    const decoder = decoderRef.current;
    if (decoder && decoder.state !== "closed") {
      try {
        decoder.reset();
        log("reset", "decoder.reset() succeeded", { state: decoder.state });
      } catch (e) {
        warn("reset", "decoder.reset() threw", { message: e?.message ?? String(e) });
      }
    } else {
      warn("reset", "no active decoder to reset", { hasDecoder: !!decoder, state: decoder?.state });
    }

    log("reset", "reset complete — waiting for next keyframe to reconfigure");
  }, []);

  // ---------------------------------------------------------------------------
  // STAGE: cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    log("lifecycle", "useH264Player mounted");

    return () => {
      log("lifecycle", "useH264Player unmounting — closing decoder");
      const decoder = decoderRef.current;
      if (decoder && decoder.state !== "closed") {
        try {
          decoder.close();
          log("lifecycle", "decoder.close() called on unmount");
        } catch (e) {
          warn("lifecycle", "decoder.close() threw", { message: e?.message });
        }
      } else {
        debug("lifecycle", "no open decoder to close", { hasDecoder: !!decoder, state: decoder?.state });
      }
    };
  }, []);

  // Usage: pass a <canvas> element to initDecoder, NOT a <video>.
  // Make sure your WebSocket sets: ws.binaryType = "arraybuffer"
  // Call setDebug(false) to silence all [H264] logs in production.
  return { initDecoder, feedFrame, reset, setDebug };
}