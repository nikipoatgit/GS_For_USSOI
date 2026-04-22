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

export function useWebRTC({ iceServers, videoRef, sendCmd, onLog }) {
  const pcRef = useRef(null);

  const closePc = useCallback(() => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
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

    pc.onconnectionstatechange = () =>
      onLog(pc.connectionState === "connected" ? "success" : "info", "RTC", pc.connectionState);

    const remoteStream = new MediaStream();
    if (videoRef.current) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.muted = false;
    }

    pc.ontrack = (ev) => {
      remoteStream.addTrack(ev.track);
      onLog("success", "Track", `kind=${ev.track.kind}`);
      videoRef.current?.play().catch(() => {});
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        sendCmd({
          cmd: "webrtc_ice",
          params: {
            candidate:     ev.candidate.candidate,
            sdpMid:        ev.candidate.sdpMid,
            sdpMLineIndex: ev.candidate.sdpMLineIndex,
          },
        });
      }
    };

    return pc;
  }, [iceServers, closePc, videoRef, sendCmd, onLog]);

  const handleOffer = useCallback(async (sdp) => {
    if (!pcRef.current) initPc();
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
      const answer = await pcRef.current.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
      await pcRef.current.setLocalDescription(answer);
      sendCmd({ cmd: "webrtc_offer", params: { sdp: answer.sdp } });
      onLog("success", "SDP Answer Sent", new Date().toLocaleTimeString());
    } catch (err) {
      onLog("error", "Offer failed", err.message);
    }
  }, [initPc, sendCmd, onLog]);

  const addIceCandidate = useCallback((payload) => {
    if (!pcRef.current || !payload) return;
    pcRef.current.addIceCandidate(new RTCIceCandidate({
      candidate:     payload.candidate,
      sdpMid:        payload.sdpMid,
      sdpMLineIndex: payload.sdpMLineIndex,
    })).catch(err => console.error("[RTC] addIceCandidate:", err));
  }, []);

  return { initPc, closePc, handleOffer, addIceCandidate };
}
