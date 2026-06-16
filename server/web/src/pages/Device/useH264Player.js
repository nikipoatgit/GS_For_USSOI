// Packet layout from Android buildPacket():
//   [0]      1 byte   keyframe flag (1 = keyframe, 0 = delta)
//   [1..8]   8 bytes  relative PTS in microseconds, big-endian
//   [9+]     N bytes  raw H.264 Annex-B NAL unit(s)

import { useRef, useCallback, useEffect } from "react";

// 17-byte packets = 9 header + 8 bytes of NAL — these are filler/SEI units
// emitted by MediaCodec between frames. They carry no video data and will
// crash the decoder. Any packet whose NAL payload is under 16 bytes is skipped.
const MIN_NAL_BYTES = 16;
const DEBUG_EVERY_N_PACKETS = 30;
const DEBUG_FIRST_N_PACKETS = 10;

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
        bytes[i] === 0x00 &&
        bytes[i + 1] === 0x00 &&
        bytes[i + 2] === 0x00 &&
        bytes[i + 3] === 0x01;

    const isThreeByteStartCode =
        bytes[i] === 0x00 &&
        bytes[i + 1] === 0x00 &&
        bytes[i + 2] === 0x01;

    if (!isFourByteStartCode && !isThreeByteStartCode) continue;

    const nalOffset = i + (isFourByteStartCode ? 4 : 3);
    if (nalOffset >= bytes.length) continue;

    const type = bytes[nalOffset] & 0x1f;
    nalTypes.push({
      offset: i,
      type,
      name: nalTypeName(type),
    });
  }

  return nalTypes;
}

export function useH264Player(onStats) {
  const decoderRef    = useRef(null);
  const canvasRef     = useRef(null);
  const ctxRef        = useRef(null);
  const configuredRef = useRef(false);
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
    latency: 0,
    frames: 0,
    lastFpsTs: performance.now(),
  });
  const onStatsRef   = useRef(null);
  const arrivalTsRef = useRef(new Map()); // ptsUs → arrival performance.now()

  onStatsRef.current = onStats;



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
 console.log(
        "[H264] frame",
        frame.displayWidth,
        frame.displayHeight,
        frame.timestamp
    );
        const ctx = ctxRef.current;
        const cv  = canvasRef.current;

        if (!ctx || !cv) {
          frame.close();
          return;
        }

        const container = cv.parentElement;

        if (!container) {
          frame.close();
          return;
        }

        // Match canvas resolution to container resolution
        if (
            cv.width !== container.clientWidth ||
            cv.height !== container.clientHeight
        ) {
          cv.width  = container.clientWidth;
          cv.height = container.clientHeight;
        }

        const cw = cv.width;
        const ch = cv.height;

        const fw = frame.displayWidth;
        const fh = frame.displayHeight;

        // Best-fit contain scaling
        const scale = Math.min(cw / fw, ch / fh);

        const rw = fw * scale;
        const rh = fh * scale;

        const x = (cw - rw) / 2;
        const y = (ch - rh) / 2;

        ctx.clearRect(0, 0, cw, ch);

        ctx.drawImage(frame, x, y, rw, rh);

        const now = performance.now();

        const arrival = arrivalTsRef.current.get(frame.timestamp);

        if (arrival !== undefined) {
          statsRef.current.latency = Math.round(now - arrival);
          arrivalTsRef.current.delete(frame.timestamp);
        }

        if (arrivalTsRef.current.size > 60) {
          const keys = [...arrivalTsRef.current.keys()].sort();

          keys
              .slice(0, keys.length - 30)
              .forEach((k) => arrivalTsRef.current.delete(k));
        }

        statsRef.current.frames++;

        const elapsed = now - statsRef.current.lastFpsTs;

        if (elapsed >= 1000) {

          statsRef.current.fps = Math.round(
              (statsRef.current.frames * 1000) / elapsed
          );

          statsRef.current.frames = 0;
          statsRef.current.lastFpsTs = now;

          onStatsRef.current?.({
            fps: statsRef.current.fps,
            latency: statsRef.current.latency,
          });
        }

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
    if (!(ab instanceof ArrayBuffer)) {
      console.warn("[H264 RX] ignoring non-ArrayBuffer message", ab);
      return;
    }

    const debug = debugRef.current;
    debug.packets++;
    debug.bytes += ab.byteLength;

    const shouldLogPacket =
        debug.packets <= DEBUG_FIRST_N_PACKETS ||
        debug.packets % DEBUG_EVERY_N_PACKETS === 0;

    // Skip filler/SEI packets — NAL payload too small to be a video frame.
    if (ab.byteLength < 9 + MIN_NAL_BYTES) {
      debug.skippedSmall++;
      if (shouldLogPacket) {
        console.warn("[H264 RX] skipped small packet", {
          packet: debug.packets,
          bytes: ab.byteLength,
          minBytes: 9 + MIN_NAL_BYTES,
          firstBytes: bytesToHex(new Uint8Array(ab)),
        });
      }
      return;
    }

    const decoder = decoderRef.current;
    if (!decoder) { console.warn("[H264] feedFrame called before initDecoder"); return; }
    if (decoder.state === "closed") return;

    const view       = new DataView(ab);
    const isKeyFrame = view.getUint8(0) === 1;

    // 8-byte big-endian PTS — no getUint64, so read as two 32-bit halves.
    const ptsUs = view.getUint32(1, false) * 0x100000000 + view.getUint32(5, false);

    // Stamp arrival time; the decoder output callback measures render latency.
    arrivalTsRef.current.set(ptsUs, performance.now());
    // Zero-copy view of the NAL bytes starting at byte 9.
    const nalData = new Uint8Array(ab, 9);
    if (isKeyFrame) debug.keyframes++;

    if (shouldLogPacket) {
      const nalTypes = findAnnexBNalTypes(nalData);
      console.debug("[H264 RX] binary packet", {
        packet: debug.packets,
        totalBytes: ab.byteLength,
        nalBytes: nalData.byteLength,
        isKeyFrame,
        ptsUs,
        decoderState: decoder.state,
        configured: configuredRef.current,
        firstBytes: bytesToHex(new Uint8Array(ab)),
        nalFirstBytes: bytesToHex(nalData),
        annexBStartCodeAtPayloadStart:
            nalData[0] === 0x00 &&
            nalData[1] === 0x00 &&
            (nalData[2] === 0x01 || (nalData[2] === 0x00 && nalData[3] === 0x01)),
        nalTypes,
      });
    }

    // Configure on the first keyframe. SPS+PPS are already prepended to the
    // NAL data by the Android encoder — no description needed.
    if (isKeyFrame && !configuredRef.current) {
      configureDecoder();
    }

    if (!configuredRef.current) {
      debug.skippedBeforeConfig++;
      if (shouldLogPacket) {
        console.warn("[H264 RX] dropped packet before decoder config", {
          packet: debug.packets,
          isKeyFrame,
          ptsUs,
        });
      }
      return; // drop delta frames until configured
    }

    try {
      decoder.decode(new EncodedVideoChunk({
        type:      isKeyFrame ? "key" : "delta",
        timestamp: ptsUs,
        data:      nalData,
      }));

      const now = performance.now();
      if (now - debug.lastSummaryTs >= 5000) {
        console.info("[H264 RX] summary", {
          packets: debug.packets,
          bytes: debug.bytes,
          keyframes: debug.keyframes,
          skippedSmall: debug.skippedSmall,
          skippedBeforeConfig: debug.skippedBeforeConfig,
          decodeQueueSize: decoder.decodeQueueSize,
          configured: configuredRef.current,
        });
        debug.lastSummaryTs = now;
      }
    } catch (e) {
      console.error("[H264] decode error:", e, {
        packet: debug.packets,
        totalBytes: ab.byteLength,
        isKeyFrame,
        ptsUs,
        firstBytes: bytesToHex(new Uint8Array(ab)),
        nalFirstBytes: bytesToHex(nalData),
        nalTypes: findAnnexBNalTypes(nalData),
      });
    }
  }, [configureDecoder]);

  // ---------------------------------------------------------------------------
  // Public: reset — call on WebSocket reconnect or Android stream restart
  // ---------------------------------------------------------------------------

  const reset = useCallback(() => {
    console.log("[H264] reset");
    configuredRef.current = false;
    debugRef.current = {
      packets: 0,
      bytes: 0,
      keyframes: 0,
      skippedSmall: 0,
      skippedBeforeConfig: 0,
      lastSummaryTs: performance.now(),
    };
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
