import { useRef, useCallback } from "react";

export const DEFAULT_STUN = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.services.mozilla.com:3478" },
  { urls: "stun:stun.stunprotocol.org:3478" },
];

function normalizeSdp(payload) {
  const sdp =
      typeof payload === "string"
          ? { type: "offer", sdp: payload }
          : payload;

  if (!sdp || typeof sdp !== "object")
    throw new Error("Invalid SDP");

  if (
      !["offer", "answer"].includes(sdp.type) ||
      typeof sdp.sdp !== "string" ||
      !sdp.sdp.trim()
  ) {
    throw new Error("Invalid SDP");
  }

  return { type: sdp.type, sdp: sdp.sdp };
}

function normalizeIce(payload) {
  const candidate =
      payload?.candidate &&
      typeof payload.candidate === "object"
          ? payload.candidate
          : payload;

  if (
      !candidate ||
      typeof candidate.candidate !== "string" ||
      !candidate.candidate.trim()
  ) {
    throw new Error("Invalid ICE");
  }

  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid ?? null,
    sdpMLineIndex: candidate.sdpMLineIndex ?? null,
  };
}

function prepareVideoElement(videoEl) {
  if (!videoEl) return;

  videoEl.autoplay = true;
  videoEl.muted = true;
  videoEl.defaultMuted = true;
  videoEl.playsInline = true;

  videoEl.setAttribute("autoplay", "");
  videoEl.setAttribute("muted", "");
  videoEl.setAttribute("playsinline", "");
}

function attachStream(videoEl, stream) {
  if (!videoEl || videoEl.srcObject === stream) return;

  prepareVideoElement(videoEl);
  videoEl.srcObject = stream;
}

async function playRemoteVideo(videoEl, onLog) {
  if (!videoEl) return;

  try {
    await videoEl.play();
  } catch (err) {
    onLog("warn", "Video playback blocked", err.message);
  }
}

function describeTrack(track) {
  if (!track) return "no-track";

  return `kind=${track.kind} state=${track.readyState} muted=${track.muted} enabled=${track.enabled}`;
}

function canExchangeIce(pc) {
  return pc?.remoteDescription?.type === "answer";
}

export function useWebRTC({
                            hiddenVideoRef,
                            iceServers,
                            videoRef,
                            sendCmd,
                            onLog,
                          }) {
  const pcRef = useRef(null);
  const pendingIceRef = useRef([]);
  const pendingLocalIceRef = useRef([]);
  const remoteStreamRef = useRef(null);
  const renderLoopRef = useRef(null);

  const closePc = useCallback(() => {
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    pendingIceRef.current = [];
    pendingLocalIceRef.current = [];

    if (hiddenVideoRef.current?.srcObject) {
      hiddenVideoRef.current.srcObject
          .getTracks()
          .forEach((t) => t.stop());

      hiddenVideoRef.current.srcObject = null;
    }

    remoteStreamRef.current = null;

    onLog("warn", "WebRTC", "Connection closed");
  }, [hiddenVideoRef, onLog]);

  const startCanvasRenderer = useCallback(() => {
    const render = () => {
      const video = hiddenVideoRef.current;
      const canvas = videoRef.current;

      if (!video || !canvas) {
        renderLoopRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");

      if (
          video.videoWidth > 0 &&
          video.videoHeight > 0
      ) {
        if (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0);
      }

      renderLoopRef.current =
          requestAnimationFrame(render);
    };

    render();
  }, [hiddenVideoRef, videoRef]);

  const initPc = useCallback(() => {
    closePc();

    const pc = new RTCPeerConnection({
      iceServers,
    });

    pcRef.current = pc;

    onLog(
        "info",
        "WebRTC",
        "Peer connection initialised"
    );

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;

      const type =
          s === "connected" || s === "completed"
              ? "success"
              : s === "failed" ||
              s === "disconnected" ||
              s === "closed"
                  ? "error"
                  : "info";

      onLog(type, "ICE", s);
    };

    const remoteStream = new MediaStream();

    remoteStreamRef.current = remoteStream;

    attachStream(
        hiddenVideoRef.current,
        remoteStream
    );

    hiddenVideoRef.current.onloadedmetadata =
        () => {
          const width =
              hiddenVideoRef.current?.videoWidth ?? 0;

          const height =
              hiddenVideoRef.current?.videoHeight ?? 0;

          onLog(
              "success",
              "Video metadata",
              `${width}x${height}`
          );

          playRemoteVideo(
              hiddenVideoRef.current,
              onLog
          );
        };

    hiddenVideoRef.current.onplaying = () =>
        onLog(
            "success",
            "Video playing",
            new Date().toLocaleTimeString()
        );

    hiddenVideoRef.current.onwaiting = () =>
        onLog(
            "warn",
            "Video waiting",
            "buffering remote media"
        );

    hiddenVideoRef.current.onerror = () => {
      const error = hiddenVideoRef.current?.error;

      onLog(
          "error",
          "Video element error",
          error?.message ??
          `code=${error?.code ?? "unknown"}`
      );
    };

    startCanvasRenderer();

    pc.ontrack = (ev) => {
      const incomingStream = ev.streams?.[0];

      if (incomingStream) {
        attachStream(
            hiddenVideoRef.current,
            incomingStream
        );

        remoteStreamRef.current = incomingStream;
      } else if (
          !remoteStream
              .getTracks()
              .some((t) => t.id === ev.track.id)
      ) {
        remoteStream.addTrack(ev.track);
      }

      ev.track.onunmute = () => {
        onLog(
            "success",
            "Track unmuted",
            describeTrack(ev.track)
        );

        playRemoteVideo(
            hiddenVideoRef.current,
            onLog
        );
      };

      ev.track.onmute = () =>
          onLog(
              "warn",
              "Track muted",
              describeTrack(ev.track)
          );

      ev.track.onended = () =>
          onLog(
              "warn",
              "Track ended",
              describeTrack(ev.track)
          );

      const stream = remoteStreamRef.current;

      const tracks =
          stream?.getTracks()
              .map(describeTrack)
              .join(" · ") ||
          describeTrack(ev.track);

      onLog(
          "success",
          "Remote track",
          tracks
      );
    };

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;

      const candidate = ev.candidate.toJSON
          ? ev.candidate.toJSON()
          : {
            candidate:
            ev.candidate.candidate,
            sdpMid: ev.candidate.sdpMid,
            sdpMLineIndex:
            ev.candidate.sdpMLineIndex,
          };

      if (canExchangeIce(pc)) {
        sendCmd({
          type: "request",
          cmd: "webrtc_ice",
          param: { candidate },
        });
      } else {
        pendingLocalIceRef.current.push(
            candidate
        );
      }
    };

    return pc;
  }, [
    closePc,
    hiddenVideoRef,
    iceServers,
    onLog,
    sendCmd,
    startCanvasRenderer,
  ]);

  const drainPendingLocalIce =
      useCallback(() => {
        if (
            !canExchangeIce(pcRef.current) ||
            pendingLocalIceRef.current.length === 0
        )
          return;

        const candidates =
            pendingLocalIceRef.current.splice(0);

        for (const candidate of candidates) {
          sendCmd({
            type: "request",
            cmd: "webrtc_ice",
            param: { candidate },
          });
        }

        onLog(
            "info",
            "ICE Sent",
            `${candidates.length} queued candidates`
        );
      }, [sendCmd, onLog]);

  const drainPendingIce = useCallback(
      async () => {
        if (
            !pcRef.current?.remoteDescription ||
            pendingIceRef.current.length === 0
        )
          return;

        const candidates =
            pendingIceRef.current.splice(0);

        for (const candidate of candidates) {
          await pcRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
          );
        }
      },
      []
  );

  const handleSdp = useCallback(
      async (payload) => {
        if (!pcRef.current) initPc();

        try {
          const remoteSdp =
              normalizeSdp(payload);

          if (remoteSdp.type === "offer") {
            onLog(
                "warn",
                "Unexpected SDP Offer",
                "This client starts WebRTC and only expects an answer"
            );

            return;
          }

          await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(
                  remoteSdp
              )
          );

          await drainPendingIce();
          drainPendingLocalIce();

          onLog(
              "success",
              "SDP Answer Received",
              new Date().toLocaleTimeString()
          );
        } catch (err) {
          onLog(
              "error",
              "SDP failed",
              err.message
          );
        }
      },
      [
        drainPendingIce,
        drainPendingLocalIce,
        initPc,
        onLog,
      ]
  );

  const startOffer = useCallback(
      async () => {
        const pc = initPc();

        try {
          pc.addTransceiver("video", {
            direction: "recvonly",
          });

          pc.addTransceiver("audio", {
            direction: "recvonly",
          });

          const offer =
              await pc.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true,
              });

          await pc.setLocalDescription(offer);

          sendCmd({
            type: "request",
            cmd: "webrtc_sdp",
            param: {
              sdp: {
                type: offer.type,
                sdp: offer.sdp,
              },
            },
          });

          onLog(
              "success",
              "SDP Offer Sent",
              new Date().toLocaleTimeString()
          );

          return true;
        } catch (err) {
          onLog(
              "error",
              "Offer failed",
              err.message
          );

          return false;
        }
      },
      [initPc, onLog, sendCmd]
  );

  const addIceCandidate = useCallback(
      async (payload) => {
        try {
          const candidate =
              normalizeIce(payload);

          if (!pcRef.current) initPc();

          if (canExchangeIce(pcRef.current)) {
            await pcRef.current.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
          } else {
            pendingIceRef.current.push(
                candidate
            );
          }
        } catch (err) {
          console.error(
              "[RTC] addIceCandidate:",
              err
          );
        }
      },
      [initPc]
  );

  return {
    initPc,
    startOffer,
    closePc,
    handleSdp,
    addIceCandidate,
  };
}
