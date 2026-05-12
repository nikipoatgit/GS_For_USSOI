// features/ws/useWebRTC.js
// Peer connection lifecycle — init, offer handling, ICE, teardown.

import { useRef, useCallback } from "react";

export const DEFAULT_STUN = [
  { urls: "stun:stun.l.google.com:19302"        },
  { urls: "stun:stun1.l.google.com:19302"       },
  { urls: "stun:stun2.l.google.com:19302"       },
  { urls: "stun:stun.services.mozilla.com:3478" },
  { urls: "stun:stun.stunprotocol.org:3478"     },
];

function normalizeSdp(payload) {
  const sdp = typeof payload === "string" ? { type: "offer", sdp: payload } : payload;
  if (!sdp || typeof sdp !== "object") throw new Error("Invalid SDP");
  if (!["offer", "answer"].includes(sdp.type) || typeof sdp.sdp !== "string" || !sdp.sdp.trim()) {
    throw new Error("Invalid SDP");
  }
  return { type: sdp.type, sdp: sdp.sdp };
}

function normalizeIce(payload) {
  const candidate = payload?.candidate && typeof payload.candidate === "object"
    ? payload.candidate
    : payload;

  if (!candidate || typeof candidate.candidate !== "string" || !candidate.candidate.trim()) {
    throw new Error("Invalid ICE");
  }

  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid ?? null,
    sdpMLineIndex: candidate.sdpMLineIndex ?? null,
  };
}

function forceReceiveOnlyMedia(pc) {
  pc.getTransceivers()
    .filter(t => t.receiver?.track && ["audio", "video"].includes(t.receiver.track.kind))
    .forEach(t => { t.direction = "recvonly"; });
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

export function useWebRTC({ iceServers, videoRef, sendCmd, onLog }) {
  const pcRef = useRef(null);
  const pendingIceRef = useRef([]);
  const pendingLocalIceRef = useRef([]);
  const remoteStreamRef = useRef(null);

  const closePc = useCallback(() => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    pendingIceRef.current = [];
    pendingLocalIceRef.current = [];
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
    onLog("warn", "WebRTC", "Connection closed");
  }, [videoRef, onLog]);

  const initPc = useCallback(() => {
    closePc();
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;
    onLog("info", "WebRTC", "Peer connection initialised");

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      const type = (s === "connected" || s === "completed") ? "success"
                 : (s === "failed" || s === "disconnected" || s === "closed") ? "error"
                 : "info";
      onLog(type, "ICE", s);
    };

    pc.onconnectionstatechange = () => {
      onLog(pc.connectionState === "connected" ? "success" : "info", "RTC", pc.connectionState);
      if (pc.connectionState !== "connected") return;

      window.setTimeout(() => {
        if (pcRef.current !== pc || pc.connectionState !== "connected") return;
        const receivers = pc.getReceivers().filter(r => r.track?.kind === "video");
        const activeTracks = receivers.filter(r => r.track?.readyState === "live");
        if (activeTracks.length === 0) {
          onLog("warn", "No remote video track", "RTC connected, but the peer has not sent a live video track");
        } else {
          onLog("info", "Video receivers", activeTracks.map(r => describeTrack(r.track)).join(" · "));
          playRemoteVideo(videoRef.current, onLog);
        }
      }, 2000);
    };

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (videoRef.current) {
      prepareVideoElement(videoRef.current);
      attachStream(videoRef.current, remoteStream);
      videoRef.current.onloadedmetadata = () => {
        const width = videoRef.current?.videoWidth ?? 0;
        const height = videoRef.current?.videoHeight ?? 0;
        onLog("success", "Video metadata", `${width}x${height}`);
        playRemoteVideo(videoRef.current, onLog);
      };
      videoRef.current.onresize = () => {
        const width = videoRef.current?.videoWidth ?? 0;
        const height = videoRef.current?.videoHeight ?? 0;
        if (width && height) onLog("success", "Video frame", `${width}x${height}`);
      };
      videoRef.current.onplaying = () => onLog("success", "Video playing", new Date().toLocaleTimeString());
      videoRef.current.onwaiting = () => onLog("warn", "Video waiting", "buffering remote media");
      videoRef.current.onerror = () => {
        const error = videoRef.current?.error;
        onLog("error", "Video element error", error?.message ?? `code=${error?.code ?? "unknown"}`);
      };
    }

    pc.ontrack = (ev) => {
      const incomingStream = ev.streams?.[0];

      if (incomingStream) {
        attachStream(videoRef.current, incomingStream);
        remoteStreamRef.current = incomingStream;
      } else if (!remoteStream.getTracks().some(t => t.id === ev.track.id)) {
        remoteStream.addTrack(ev.track);
      }

      ev.track.onunmute = () => {
        onLog("success", "Track unmuted", describeTrack(ev.track));
        playRemoteVideo(videoRef.current, onLog);
      };
      ev.track.onmute = () => onLog("warn", "Track muted", describeTrack(ev.track));
      ev.track.onended = () => onLog("warn", "Track ended", describeTrack(ev.track));

      const stream = remoteStreamRef.current;
      const tracks = stream?.getTracks().map(describeTrack).join(" · ") || describeTrack(ev.track);
      onLog("success", "Remote track", tracks);
      playRemoteVideo(videoRef.current, onLog);
    };

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;

      const candidate = ev.candidate.toJSON
        ? ev.candidate.toJSON()
        : {
            candidate:     ev.candidate.candidate,
            sdpMid:        ev.candidate.sdpMid,
            sdpMLineIndex: ev.candidate.sdpMLineIndex,
          };

      if (pc.remoteDescription?.type === "answer") {
        sendCmd({ type: "request", cmd: "webrtc_ice", param: { candidate } });
      } else {
        pendingLocalIceRef.current.push(candidate);
      }
    };

    return pc;
  }, [iceServers, closePc, videoRef, sendCmd, onLog]);

  const drainPendingLocalIce = useCallback(() => {
    if (!pcRef.current?.remoteDescription || pendingLocalIceRef.current.length === 0) return;
    const candidates = pendingLocalIceRef.current.splice(0);
    for (const candidate of candidates) {
      sendCmd({ type: "request", cmd: "webrtc_ice", param: { candidate } });
    }
    onLog("info", "ICE Sent", `${candidates.length} queued candidates`);
  }, [sendCmd, onLog]);

  const drainPendingIce = useCallback(async () => {
    if (!pcRef.current?.remoteDescription || pendingIceRef.current.length === 0) return;
    const candidates = pendingIceRef.current.splice(0);
    for (const candidate of candidates) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const handleSdp = useCallback(async (payload, reply = {}) => {
    if (!pcRef.current) initPc();
    try {
      const remoteSdp = normalizeSdp(payload);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(remoteSdp));
      await drainPendingIce();

      if (remoteSdp.type === "offer") {
        forceReceiveOnlyMedia(pcRef.current);
        const answer = await pcRef.current.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
        await pcRef.current.setLocalDescription(answer);
        sendCmd({
          type: reply.type ?? "response",
          cmd: "webrtc_sdp",
          cmdId: reply.cmdId,
          param: { sdp: { type: answer.type, sdp: answer.sdp } },
        });
        onLog("success", "SDP Answer Sent", new Date().toLocaleTimeString());
      } else {
        drainPendingLocalIce();
        onLog("success", "SDP Answer Received", new Date().toLocaleTimeString());
      }
    } catch (err) {
      if (reply.cmdId) {
        sendCmd({ type: "error", cmd: "webrtc_sdp", cmdId: reply.cmdId, error: "Invalid SDP" });
      }
      onLog("error", "SDP failed", err.message);
    }
  }, [initPc, drainPendingIce, drainPendingLocalIce, sendCmd, onLog]);

  const startOffer = useCallback(async () => {
    const pc = initPc();

    try {
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      sendCmd({
        type: "request",
        cmd: "webrtc_sdp",
        param: { sdp: { type: offer.type, sdp: offer.sdp } },
      });
      onLog("success", "SDP Offer Sent", new Date().toLocaleTimeString());
      return true;
    } catch (err) {
      onLog("error", "Offer failed", err.message);
      return false;
    }
  }, [initPc, sendCmd, onLog]);

  const addIceCandidate = useCallback(async (payload, reply = {}) => {
    try {
      const candidate = normalizeIce(payload);
      if (!pcRef.current) initPc();

      if (pcRef.current.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingIceRef.current.push(candidate);
      }

      if (reply.cmdId) {
        sendCmd({
          type: reply.type ?? "response",
          cmd: "webrtc_ice",
          cmdId: reply.cmdId,
          param: { candidate },
        });
      }
    } catch (err) {
      if (reply.cmdId) {
        sendCmd({ type: "error", cmd: "webrtc_ice", cmdId: reply.cmdId, error: "Invalid ICE" });
      }
      console.error("[RTC] addIceCandidate:", err);
    }
  }, [initPc, sendCmd]);

  return { initPc, startOffer, closePc, handleSdp, addIceCandidate };
}
