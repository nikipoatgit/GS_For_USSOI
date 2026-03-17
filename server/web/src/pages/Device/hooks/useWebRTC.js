// ─── useWebRTC hook ───────────────────────────────────────────────────────────
// Manages the RTCPeerConnection lifecycle.
// Consumers call: initPc(), closePc(), handleOffer(sdp)
// ICE candidates and SDP answers are sent via the provided sendCmd callback.

import { useRef, useCallback } from "react";
import { DEVICE_ID } from "../utils/constants.js";

/**
 * @param {object} opts
 *   .iceServers   – array of RTCIceServer objects
 *   .videoRef     – ref to <video> element
 *   .sendCmd      – (data, revertCb?) => void
 *   .onLog        – (type, msg, detail) => void
 */
export function useWebRTC({ iceServers, videoRef, sendCmd, onLog }) {
  const pcRef = useRef(null);

  // ── close / cleanup ─────────────────────────────────────────────────────────
  const closePc = useCallback(() => {
    if (pcRef.current) {
      console.log("[RTC] closing peer connection");
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => {
        console.log("[RTC] stopping track:", t.kind, t.id);
        t.stop();
      });
      videoRef.current.srcObject = null;
    }
    onLog("warn", "WebRTC", "Connection closed");
  }, [videoRef, onLog]);

  // ── init peer connection ─────────────────────────────────────────────────────
  const initPc = useCallback(() => {
    closePc();
    console.log("[RTC] creating RTCPeerConnection with iceServers:", iceServers);

    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    onLog("info", "WebRTC", "Peer connection initialised");

    // ICE state
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      const type = (s === "connected" || s === "completed") ? "success"
        : (s === "failed" || s === "disconnected" || s === "closed") ? "error"
        : "info";
      console.log("[RTC] ICE state →", s);
      onLog(type, "ICE State", s);
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      console.log("[RTC] connection state →", s);
      onLog(s === "connected" ? "success" : "info", "RTC State", s);
    };

    // Signaling state
    pc.onsignalingstatechange = () => {
      console.log("[RTC] signaling state →", pc.signalingState);
    };

    // Tracks
    const remoteStream = new MediaStream();
    if (videoRef.current) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.muted     = false;
    }

    pc.ontrack = (event) => {
      console.log("[RTC] track received:", event.track.kind, event.track.id);
      remoteStream.addTrack(event.track);
      onLog("success", "Track Received", `kind=${event.track.kind}`);
      videoRef.current?.play().catch(err =>
        console.warn("[RTC] video.play() failed:", err.message)
      );
    };

    // ICE candidates → send to server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[RTC] local ICE candidate:", event.candidate.candidate);
        sendCmd({
          type:     "cmd",
          cmd:      "webrtc_ice",
          deviceId: DEVICE_ID,
          payload:  {
            candidate:     event.candidate.candidate,
            sdpMid:        event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      } else {
        console.log("[RTC] ICE gathering complete");
      }
    };

    return pc;
  }, [iceServers, closePc, videoRef, sendCmd, onLog]);

  // ── handle inbound offer (from device via server) ───────────────────────────
  const handleOffer = useCallback(async (sdp) => {
    if (!pcRef.current) {
      console.warn("[RTC] handleOffer called but no PC – initialising");
      initPc();
    }
    console.log("[RTC] setting remote description (offer)");
    try {
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp })
      );
      const answer = await pcRef.current.createAnswer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });
      await pcRef.current.setLocalDescription(answer);
      console.log("[RTC] sending SDP answer");

      sendCmd({
        type:     "cmd",
        cmd:      "webrtc_offer",   // send answer back using offer cmd slot
        deviceId: DEVICE_ID,
        payload:  { sdp: answer.sdp },
      });
      onLog("success", "SDP Answer Sent", new Date().toLocaleTimeString());
    } catch (err) {
      console.error("[RTC] offer handling failed:", err);
      onLog("error", "Offer handling failed", err.message);
    }
  }, [initPc, sendCmd, onLog]);

  // ── add remote ICE candidate ─────────────────────────────────────────────────
  const addIceCandidate = useCallback((payload) => {
    if (!pcRef.current) {
      console.warn("[RTC] addIceCandidate – no PC");
      return;
    }
    const candidate = new RTCIceCandidate({
      candidate:     payload.candidate,
      sdpMid:        payload.sdpMid,
      sdpMLineIndex: payload.sdpMLineIndex,
    });
    console.log("[RTC] adding remote ICE candidate:", payload.candidate);
    pcRef.current.addIceCandidate(candidate).catch(err =>
      console.error("[RTC] addIceCandidate failed:", err)
    );
  }, []);

  return { initPc, closePc, handleOffer, addIceCandidate, pcRef };
}
