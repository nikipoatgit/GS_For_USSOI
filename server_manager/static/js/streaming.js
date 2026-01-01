// Copyright (C) 2026 Nikhil
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// --------------------------------------------------------------------------------------------------
// WebRTC Logic
// --------------------------------------------------------------------------------------------------

async function handleOffer(offerSdp) {
    if (!pc) {
        addLogEntry('warn', 'Offer received before PC init', '');
        return;
    }

    const remoteDesc = new RTCSessionDescription({
        type: "offer",
        sdp: offerSdp
    });

    try {
        await pc.setRemoteDescription(remoteDesc);
        const answer = await pc.createAnswer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: true
        });
        await pc.setLocalDescription(answer);

        generatePayload({
            type: "stream",
            webrtc: clientConfig.webrtc,
            sdp: answer.sdp
        });

        addLogEntry("success", "Answer Sent", new Date().toLocaleTimeString());
    } catch (e) {
        addLogEntry("error", "Offer handling failed", e.message);
    }
}

function webRtc() {
    if (pc) {
        pc.close();
    }

    pc = new RTCPeerConnection(config);
    addLogEntry('info', 'WebRTC Connection', 'Starting...');

    // ICE Connection State
    pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        let type = 'info';
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            type = 'error';
        } else if (state === 'completed' || state === 'connected') {
            type = 'success';
        }
        addLogEntry(type, "ICE State Change", state);
    };

    // Signaling State
    pc.onsignalingstatechange = () => {
        addLogEntry("info", "Signaling State Change", pc.signalingState);
    };

    // Connection State
    pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        let type = 'info';
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            type = 'error';
        } else if (state === 'connected') {
            type = 'success';
        }
        addLogEntry(type, "RTC Connection State Change", state);
    };

    // Video Stream Handling
    const remoteStream = new MediaStream();
    video.srcObject = remoteStream;
    video.muted = false;

    pc.ontrack = (event) => {
        const track = event.track;
        addLogEntry("success", "Track Received", `Kind: ${track.kind}`);

        remoteStream.addTrack(track);

        video.play().catch(e => console.error('Play error:', e));
        video.onplaying = () => console.log("Video is now playing");
        video.onerror = (e) => console.error("Video element error:", e);
    };

    // ICE Candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            generatePayload({
                type: "stream",
                webrtc: clientConfig.webrtc,
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex
            });
        }
    };
}

function closeWebRtc() {
    if (pc) {
        addLogEntry('warn', 'WebRTC Connection', 'Closing...');
        pc.close();
        pc = null;
    }

    // Stop Video Tracks
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }

    // Stop Audio Tracks
    const audioEl = document.getElementById("remoteAudio");
    if (audioEl && audioEl.srcObject) {
        audioEl.srcObject.getTracks().forEach(track => track.stop());
        audioEl.srcObject = null;
    }
}

// --------------------------------------------------------------------------------------------------
// MSE (JMuxer) Logic
// --------------------------------------------------------------------------------------------------

let ws;
let jmuxer;
let sourceOpen = false;
let latencyInterval = null;

/* ---------- INITIALIZATION ---------- */
function enableMse() {
    // 1. Initialize JMuxer
    if (jmuxer) {
        jmuxer.destroy();
        jmuxer = null;
    }

    jmuxer = new JMuxer({
        node: 'video',        // ID of your video tag
        mode: 'video',        // We are streaming video only
        flushingTime: 0,      // Immediate flushing for low latency
        clearBuffer: true,    // Clear buffer automatically to prevent lags
        fps: 0,               // Hint for timestamp calculation
        debug: false          // Turn to true if you want to see logs
    });

    console.log("JMuxer initialized");
    sourceOpen = true;

    // 2. Start WebSocket
    ws = new WebSocket(endpoint2);
    ws.binaryType = "arraybuffer";
    ws.onmessage = e => handlePacket(e.data);
    ws.onclose = () => {
        console.log("Stream WS Closed");
        closeMse();
    };
}

/* ---------- CLEANUP ---------- */
function closeMse() {
    console.log("Closing MSE Stream...");

    // 1. Stop WebSocket
    if (ws) {
        ws.onclose = null; // Prevent infinite loop
        ws.close();
        ws = null;
    }

    // 2. Destroy JMuxer
    if (jmuxer) {
        jmuxer.destroy();
        jmuxer = null;
    }

    // 3. Stop Latency Loop
    if (latencyInterval) {
        clearInterval(latencyInterval);
        latencyInterval = null;
    }

    // 4. Reset Flags
    sourceOpen = false;

    // 5. Clear Video Player
    if (video) {
        video.pause();
        video.removeAttribute('src'); // Unload the MediaSource
        video.load();
        video.preload = 'none';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.playbackRate = 1.0;
    }
}

/* ---------- PACKET HANDLING ---------- */
function handlePacket(buffer) {
    if (!jmuxer || !buffer || buffer.byteLength <= 9) return;

    // 1. Strip the Custom Java Header (9 Bytes)
    const payload = new Uint8Array(buffer, 9);

    // 2. Feed the Raw H.264 to JMuxer
    try {
        jmuxer.feed({
            video: payload
        });
    } catch (e) {
        console.error("JMuxer Feed Error:", e);
    }
}