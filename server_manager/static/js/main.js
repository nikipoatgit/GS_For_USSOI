
// addLogEntry(randomLog.type, randomLog.msg, new Date().toLocaleTimeString() + ` - ${randomLog.detail}`); example use case 

const logContainer = document.getElementById('log-container');
const MAX_LOG_ENTRIES = 30;
/**
 * @param {string} type - The type of log ('success', 'error', 'info', 'warn').
 * @param {string} message - The main log message (e.g., "Client Connected").
 * @param {string} details - The secondary details (e.g., a timestamp or error code).
 */
function addLogEntry(type, message, details) {

    const logStyles = {
        success: { icon: 'fa-check-circle', color: 'green-400' },
        error: { icon: 'fa-exclamation-triangle', color: 'red-500' },
        info: { icon: 'fa-info-circle', color: 'blue-400' },
        warn: { icon: 'fa-shield-alt', color: 'yellow-400' }
    };

    const style = logStyles[type] || logStyles.info;

    const logElement = document.createElement('div');
    logElement.className = `bg-gray-800/[10%] rounded-md p-3 flex items-start space-x-3`
    logElement.innerHTML = `
            <div class="flex-shrink-0 pt-0.5">
                <i class="fas ${style.icon} text-${style.color}"></i>
            </div>
            <div>
                <p class="font-semibold text-sm text-gray-200">${message}</p>
                <p class="text-xs text-gray-400 font-mono">${details}</p>
            </div>
        `;

    logContainer.prepend(logElement);

    if (logContainer.children.length > MAX_LOG_ENTRIES) {
        logContainer.lastChild.remove();
    }
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------

// log mininise and maximise code 

const sidebar = document.getElementById('log-sidebar');
const toggleButton = document.getElementById('toggle-sidebar-btn');
const sidebarContent = document.getElementById('sidebar-content');
const minimizeIcon = document.getElementById('collapse-icon');
const maximizeIcon = document.getElementById('expand-icon');
const mainContent = document.getElementById('main-content');

toggleButton.addEventListener('click', () => {
    const isMinimized = sidebar.classList.contains('xl:w-16');

    if (isMinimized) {
        sidebar.classList.remove('xl:w-16', 'px-2');
        sidebar.classList.add('xl:w-1/4', 'px-3', 'md:px-4', 'lg:px-6');
        mainContent.classList.remove('xl:w-[calc(100%-4rem)]');
        mainContent.classList.add('xl:w-3/4');
        sidebarContent.classList.remove('hidden');
        minimizeIcon.classList.remove('hidden');
        maximizeIcon.classList.add('hidden');

    } else {
        sidebar.classList.remove('xl:w-1/4', 'px-3', 'md:px-4', 'lg:px-6');
        sidebar.classList.add('xl:w-16', 'px-2');
        mainContent.classList.remove('xl:w-3/4');
        mainContent.classList.add('xl:w-[calc(100%-4rem)]');

        sidebarContent.classList.add('hidden');
        minimizeIcon.classList.add('hidden');
        maximizeIcon.classList.remove('hidden');
    }
});

// websocket related code 
// --------------------------------------------------------------------------------------------------------------------------------------------

let loc = window.location;// holds refs to urls , its win object
const protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
const base = location.host + location.pathname;

const endpoint1 = protocol + base + 'control/js';
const endpoint2 = protocol + base + 'mseFmp4/js';

let webSocket1, webSocket2;
addLogEntry("info", "Endpoint", new Date().toLocaleTimeString() + `- ${endpoint1}`);
addLogEntry("info", "Endpoint", new Date().toLocaleTimeString() + `- ${endpoint2}`);

// for now only connect to WS 1 

let reconnectTimer = null;
const RECONNECT_INTERVAL = 3000;

function connectWebSocket() {
    webSocket1 = new WebSocket(endpoint1);

    webSocket1.addEventListener("open", () => {
        addLogEntry("info", "Connection Established", new Date().toLocaleTimeString());
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    });

    webSocket1.addEventListener('message', webSocketOnMessage1);

    webSocket1.addEventListener("close", (e) => {
        addLogEntry("warn", "Connection Closed", new Date().toLocaleTimeString());
        scheduleReconnect();
    });

    webSocket1.addEventListener("error", (err) => {
        addLogEntry("error", "WebSocket Error", new Date().toLocaleTimeString());
        webSocket1.close();
    });
}

function scheduleReconnect() {
    if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
            addLogEntry("info", "Reconnecting...", new Date().toLocaleTimeString());
            connectWebSocket();
        }, RECONNECT_INTERVAL);
    }
}

connectWebSocket();


function webSocketOnMessage1(event) {
    const parseData = JSON.parse(event.data);
    switch (parseData.type) {
        case '5': {
            updateDeviceImpInfo(parseData.h);
            break;
        }
        case "2": {
            const candidate = new RTCIceCandidate({
                candidate: parseData.candidate,
                sdpMid: parseData.sdpMid,
                sdpMLineIndex: parseData.sdpMLineIndex
            });
            pc.addIceCandidate(candidate).catch(e => addLogEntry("error", "ICE Add Error", e.message || String(e)));
            addLogEntry("success", "ICE RECEIVED", new Date().toLocaleTimeString());
            break;
        }
        case '3': {
            handleOffer(parseData.sdp);
            addLogEntry("success", "SDP RECEIVED", new Date().toLocaleTimeString());
            break;
        }
        case '4': {
            updateDeviceInfo(parseData.sim, parseData.hex);
            break;
        }
        case '1': {
            if (parseData.t == '1') {
                addLogEntry("info", "ANDROID ", new Date().toLocaleTimeString() + "  --" + parseData.s);
            }
            else if (parseData.t == '0') {
                addLogEntry("warn", "ANDROID ", new Date().toLocaleTimeString() + "  --" + parseData.s);
            }
            setTimeout(() => {
                generatePayload({ "1": "2", "2": "1" });
            }, 1000);
            break;
        }
        case "5": {
            updateTurnDetails(parseData.i, parseData.p, parseData.u);
            break;
        }
        case "6": {
            getCameraResolutions = parseData;
            populateQualityPanel();
            break;
        }
        case "7": {
            addLogEntry("error", "Error", new Date().toLocaleTimeString() + " -- Local Recording Active");
             setTimeout(() => {
                        showToast(" Local Recording Active : StopStream to USE Feature");
                    }, 2000);
            break;
        }
    }
}

const generatePayload = (data) => {
    webSocket1.send(JSON.stringify(data))
};

// --------------------------------------------------------------------------------------------------------------------------------------------------------------

const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun.services.mozilla.com:3478" },
        { urls: "stun:stun.stunprotocol.org:3478" },
        { urls: "stun:stun.nextcloud.com:3478" }
    ]
};


/**
 * @param {string} turnUrl
 * @param {string} turnPassword 
 * @param {string} turnUsername 
 */
function setTurn(turnUrl, turnPassword, turnUsername) {
    const turnServer = {
        urls: turnUrl,
        username: turnUsername,
        credential: turnPassword
    };
    config.iceServers.push(turnServer);
    console.log("Updated WebRTC Config:", config);
}

let pc;

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

        webSocket1.send(JSON.stringify({
            1: "5",
            2: "0",
            sdp: answer.sdp
        }));

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

    pc.onsignalingstatechange = () => {
        addLogEntry("info", "Signaling State Change", pc.signalingState);
    };

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


    const videoEl = document.getElementById("video");
    const remoteStream = new MediaStream();
    videoEl.srcObject = remoteStream;
    videoEl.muted = true;

    pc.ontrack = (event) => {
        const track = event.track;
        addLogEntry("success", "Track Received", `Kind: ${track.kind}`);

        remoteStream.addTrack(track);

        videoEl.play().catch(e => console.error('Play error:', e));
        videoEl.onplaying = () => console.log("Video is now playing");
        videoEl.onerror = (e) => console.error("Video element error:", e);

    };


    pc.onicecandidate = (event) => {
        if (event.candidate) {
            webSocket1.send(JSON.stringify({
                1: "5",
                2: "1",
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex
            }));
        }
    };
}

function closeWebRtc() {
    if (pc) {
        addLogEntry('warn', 'WebRTC Connection', 'Closing...');
        pc.close();
        pc = null;
    }
    const videoEl = document.getElementById("video");
    if (videoEl && videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
    }
    const audioEl = document.getElementById("remoteAudio");
    if (audioEl && audioEl.srcObject) {
        audioEl.srcObject.getTracks().forEach(track => track.stop());
        audioEl.srcObject = null;
    }

}

// ------------------------------------------------------------------------------------------------------------------------------
// jpeg related code , i was in no mooed to change function name so i kept as it was for mse 
let currentImageUrl = null;
const videoElement = document.getElementById('video');
const canvas = document.getElementById('streamCanvas');
const ctx = canvas.getContext('2d');

let latestBuffer = null;
let isRendering = false;
let canvasInitialized = false;

function enableMse() {
    addLogEntry("info", "Video MSE ", "Starting...");
    webSocket2 = new WebSocket(endpoint2);
    webSocket2.binaryType = 'arraybuffer';

    webSocket2.onopen = () => {
        addLogEntry("success", "Video MSE ", "WebSocket Connected");
    };

    webSocket2.onmessage = (event) => {
        const receivedData = event.data;
        if (receivedData.byteLength < 9) return;
        const view = new DataView(receivedData);
        if (view.getUint8(0) == 1) {
            const timestamp = view.getBigInt64(1, false);
            const now = BigInt(Date.now());
            const latency = now - timestamp;
            console.log(`Frame Latency: ${latency} ms`);
            latestBuffer = receivedData.slice(9);

            if (!isRendering) {
                renderLatestFrame();
            }
        }
        else { }
    };

    webSocket2.onclose = (ev) => {
        addLogEntry("warn", "Video Stream", "MSE WebSocket Closed");
    };

    webSocket2.onerror = (err) => {
        addLogEntry("error", "Video Stream", "MSE WS Code :" + err);
    };
}

async function renderLatestFrame() {
    if (!latestBuffer) {
        isRendering = false;
        return;
    }
    isRendering = true;
    const bufferToRender = latestBuffer;
    latestBuffer = null;

    try {
        const blob = new Blob([bufferToRender], { type: 'image/jpeg' });
        const bitmap = await createImageBitmap(blob);

        if (!canvasInitialized) {
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            canvasInitialized = true;
        }
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

    } catch (e) {
        console.error('Failed to create or render bitmap:', e);
    } finally {
        isRendering = false;
        if (latestBuffer) {
            requestAnimationFrame(renderLatestFrame);
        }
    }
}

function closeMse() {
    if (webSocket2 && webSocket2.readyState === WebSocket.OPEN) {
        webSocket2.close();
    }
    addLogEntry("warn", "Video Stream", "MSE Video stream Closing");
    latestBuffer = null;
    isRendering = false;
    canvasInitialized = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// -----------------------------------------------------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const videoContainer = document.getElementById('video-container');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playPauseIcon = playPauseBtn.querySelector('i');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeIcon = volumeBtn.querySelector('i');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const flipBtn = document.getElementById('flip-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const toggleCameraBtn = document.getElementById('toggle-camera-btn');

    let isVideoOn = true;
    let isAudioOn = false;
    let isFlipped = false;
    let currentRotation = 0;

    function animateIcon(icon, animationClasses) {
        icon.classList.add('transition-transform', 'duration-500', 'ease-in-out');
        icon.classList.toggle(animationClasses);
    }

    flipBtn.addEventListener('click', () => {
        const icon = flipBtn.querySelector('i');
        animateIcon(icon, '-scale-x-100');
        isFlipped = !isFlipped;
        video.style.transform = `scaleX(${isFlipped ? -1 : 1}) rotate(${currentRotation}deg)`;
    });

    rotateBtn.addEventListener('click', () => {
        const icon = rotateBtn.querySelector('i');
        animateIcon(icon, 'rotate-180');
        generatePayload({ "1": "4", "2": "6" });

    });

    toggleCameraBtn.addEventListener('click', async () => {
        generatePayload({ "1": "4", "2": "3" });
        const icon = toggleCameraBtn.querySelector('i');
        icon.style.transition = 'none';
        icon.style.transform = 'rotateY(0deg)';
        requestAnimationFrame(() => {
            icon.style.transition = 'transform 0.5s';
            icon.style.transform = 'rotateY(180deg)';
        });
        setTimeout(() => {
            icon.style.transition = 'transform 0.5s';
            icon.style.transform = 'rotateY(0deg)';
        }, 500);

    });


    const togglePlayPause = () => {
        isVideoOn = !isVideoOn;
        if (isVideoOn) {
            generatePayload({ "1": "4", "2": "2", "3": "0" });
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play')
        }
        else {
            generatePayload({ "1": "4", "2": "2", "3": "1" });
            playPauseIcon.classList.remove('fa-play');
            playPauseIcon.classList.add('fa-pause');
        }
    };

    const toggleMute = () => {
        isAudioOn = !isAudioOn;
        if (isAudioOn) {
            generatePayload({ "1": "4", "2": "1", "3": "0" });
            volumeIcon.classList.remove('fa-volume-up');
            volumeIcon.classList.add('fa-volume-mute');
        } else {
            generatePayload({ "1": "4", "2": "1", "3": "1" });
            volumeIcon.classList.remove('fa-volume-mute');
            volumeIcon.classList.add('fa-volume-up');
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                addLogEntry('info', `Error full-screen`, new Date().toLocaleTimeString() + ` - ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    playPauseBtn.addEventListener('click', togglePlayPause);
    volumeBtn.addEventListener('click', toggleMute);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

});

/**
 * @param {string} Url
 * @param {string} pass 
 * @param {string} user 
 */

let videoProtocol;

function updateTurnDetails(url, pass, user) {
    document.getElementById('turn-pass').value = pass;
    document.getElementById('turn-user').value = user;
    document.getElementById('turn-url').value = url;
}


function setupDisplayForProtocol(mode) {
    // mode: 1 = WebRTC, 2 = JPEG (canvas)
    if (mode === 1) {
        videoElement.style.display = 'block';
        canvas.style.display = 'none';
        console.log('UI configured for WebRTC stream.');
    }
    else if (mode === 2) {
        videoElement.style.display = 'none';
        canvas.style.display = 'block';
        console.log('UI configured for MJPEG (canvas) stream.');
    }
    else {
        videoElement.style.display = 'none';
        canvas.style.display = 'none';
        console.log('UI display elements hidden.');
    }
}

// Setting Panel Related Code
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
let getCameraResolutions = { // this is template shown if no resolution data is recived from client 
    "cameraResolutions": [{
        "facing": "back",
        "resolutions": [
            { "width": 1920, "height": 1080 },
            { "width": 1280, "height": 720 },
        ]
    }, {
        "facing": "front",
        "resolutions": [
            { "width": 1280, "height": 720 },
            { "width": 640, "height": 480 }
        ]
    }]
};

let isStreaming = false;
let gray = false;

document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const turnDetails = document.getElementById('turn-details');
    const videoTypeRadios = document.querySelectorAll('input[name="video-type"]');
    const pass = document.getElementById('turn-pass');
    const user = document.getElementById('turn-user');
    const url = document.getElementById('turn-url');

    let rotation = 0;

    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
        generatePayload({ "1": "1", "2": "4" });
        rotation += 20;
        const icon = settingsBtn.querySelector('i');
        icon.style.transition = 'transform 0.3s ease-in-out';
        icon.style.transform = `rotate(${rotation}deg)`;
    });

    // upgrade so that to prevent change if streaming enable 

    videoTypeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            var value = event.target.value;
            if (value === 'TURN') {
                turnDetails.classList.remove('hidden');
            } else {
                turnDetails.classList.add('hidden');
            }
        });
    });

    const btn = document.getElementById("GrayScale-btn");
    const icon = document.getElementById("GrayScale-icon");

    btn.onclick = () => {
        gray = !gray;
        if (gray) {
            icon.classList.add("grayscale");
        } else {
            icon.classList.remove("grayscale");
        }
        generatePayload({ "1": "4", "2": "5" });
    };

    const startMavlinkBtn = document.getElementById('start-mavlink-btn');
    const stopMavlinkBtn = document.getElementById('stop-mavlink-btn');
    const startStreamBtn = document.getElementById('start-stream-btn');
    const stopStreamBtn = document.getElementById('stop-stream-btn');

    function updateButtonStates() {
        // class name removes existing class attributes with this one / not append 
        if (isStreaming) {
            startStreamBtn.disabled = true;
            startStreamBtn.className = "bg-gray-500 px-3 py-1 rounded-md text-sm cursor-not-allowed";
            stopStreamBtn.className = "bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm cursor-pointer";
        } else {
            startStreamBtn.disabled = false;
            startStreamBtn.className = "bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-sm cursor-pointer";
            stopStreamBtn.className = "bg-gray-500 hover:bg-red-700 px-3 py-1 rounded-md text-sm cursor-pointer";
        }
    }

    function setRadioLock() {
        videoTypeRadios.forEach(radio => {
            radio.disabled = isStreaming;
            const label = document.querySelector(`label[for="${radio.id}"]`);
            if (isStreaming) {
                radio.classList.add('cursor-not-allowed', 'opacity-50');
                label?.classList.add('cursor-not-allowed', 'opacity-50');
            } else {
                radio.classList.remove('cursor-not-allowed', 'opacity-50');
                label?.classList.remove('cursor-not-allowed', 'opacity-50');
            }
        });
    }

    updateButtonStates();

    startMavlinkBtn.addEventListener('click', () => {
        generatePayload({ "1": "3", "2": "1", "3": "1" });
        showToast('Start MAVLink command sent.');
    });

    stopMavlinkBtn.addEventListener('click', () => {
        generatePayload({ "1": "3", "2": "1", "3": "0" });
        showToast('Stop MAVLink command sent.');
    });

    function sendVideoProtocolParams() {
        const selectedValue = document.querySelector('input[name="video-type"]:checked').value;
        switch (selectedValue) {
            case 'TURN':
                videoProtocol = 1;
                setTurn(url.value, pass.value, user.value);
                generatePayload({
                    "1": "1",
                    "2": "2",
                    "3": url.value,
                    "4": pass.value,
                    "5": user.value
                });
                break;
            case 'MSE':
                videoProtocol = 2;
                generatePayload({ "1": "1", "2": "3" });
                break;
            default:
                videoProtocol = 3;
                generatePayload({ "1": "1", "2": "1" });
                break;
        }
        updateInputParamsBasedOnVideoProtocol();
    }

    startStreamBtn.addEventListener('click', () => {
        // first sending video protocol params wait 1/2 sec , to ensure timing issues if any then start stream 
        isStreaming = true;
        setRadioLock();
        updateButtonStates();
        sendVideoProtocolParams();
        showToast('Start Stream command sent.');
        setTimeout(() => {
            switch (videoProtocol) {
                case 1:
                    setupDisplayForProtocol(1);
                    closeWebRtc();
                    webRtc();
                    setTimeout(() => {
                        generatePayload({ "1": "3", "2": "2", "3": "1" });
                    }, 1000);
                    break;
                case 2:
                    setupDisplayForProtocol(2);
                    closeMse();
                    enableMse();
                    setTimeout(() => {
                        generatePayload({ "1": "3", "2": "2", "3": "1" });
                    }, 1000);
                    break;
                default:
                    setupDisplayForProtocol(1);
                    closeWebRtc();
                    webRtc();
                    setTimeout(() => {
                        generatePayload({ "1": "3", "2": "2", "3": "1" });
                    }, 1000);
            }
        }, 500);

    });

    stopStreamBtn.addEventListener('click', () => {
        isStreaming = false;
        setRadioLock();
        updateButtonStates();
        showToast('Stop Stream command sent.');
        switch (videoProtocol) {
            case 1:
                closeWebRtc();
                setTimeout(() => {
                    generatePayload({ "1": "3", "2": "2", "3": "0" });
                }, 2000);
                break;
            case 2:
                closeMse();
                setTimeout(() => {
                    generatePayload({ "1": "3", "2": "2", "3": "0" });
                }, 2000);
                break;
            default:
                closeWebRtc();
                setTimeout(() => {
                    generatePayload({ "1": "3", "2": "2", "3": "0" });
                }, 2000);
        }
    });

    const qualitySettingsBtn = document.getElementById('quality-settings-btn');
    const closeQualityPanelBtn = document.getElementById('close-quality-panel');
    const qualityPanel = document.getElementById('quality-panel');
    const resButton = document.getElementById('resButton');
    const bpsButton = document.getElementById('bpsButton');
    const fpsButton = document.getElementById('fpsButton');
    const resBtnContainer = document.getElementById('resBtnContainer');

    qualitySettingsBtn.addEventListener('click', () => {
        generatePayload({ "1": "2", "2": "2" });
        updateInputParamsBasedOnVideoProtocol();
        qualityPanel.classList.remove('hidden');
    });

    function updateInputParamsBasedOnVideoProtocol() {
        switch (videoProtocol) {
            case 2:
                resBtnContainer.classList.remove('hidden');
                document.getElementById('bitrate-input-lable').textContent = "Quality";
                document.getElementById('bitrate-input').placeholder = "1 - 100";
                break;
            default:
                resBtnContainer.classList.add('hidden');
                document.getElementById('bitrate-input-lable').textContent = "Bitrate (kbps)";
                document.getElementById('bitrate-input').placeholder = "500";
        }
    }

    closeQualityPanelBtn.addEventListener('click', () => {
        qualityPanel.classList.add('hidden');
    });

    resButton.addEventListener('click', () => {
        let settings = {};
        const width = parseInt(document.getElementById('custom-width').value, 10);
        const height = parseInt(document.getElementById('custom-height').value, 10);
        switch (videoProtocol) {
            case 2:
                settings = {
                    1: 6,
                    2: 2,
                    3: width,
                    4: height
                };
                break;
            default:
                break;
        }
        generatePayload(settings);
        showToast('Applying Resolution Settings');
    });
    fpsButton.addEventListener('click', () => {
        let settings = {};
        const fps = parseInt(document.getElementById('fps-input').value, 10);
        const width = parseInt(document.getElementById('custom-width').value, 10);
        const height = parseInt(document.getElementById('custom-height').value, 10);
        switch (videoProtocol) {
            case 2:
                const interval_ms = Math.floor((1000 / fps));
                settings = {
                    1: 6,
                    2: 2,
                    5: interval_ms
                };
                break;
            default:
                settings = {
                    1: 6,
                    2: 1,
                    3: width,
                    4: height,
                    5: fps,
                };
                break;
        }
        generatePayload(settings);
        showToast('Applying Quality Settings');
    });
    bpsButton.addEventListener('click', () => {
        let settings = {};
        const bitrate = parseInt(document.getElementById('bitrate-input').value, 10);
        switch (videoProtocol) {
            case 2:
                if (bitrate > 100 || bitrate < 1) { showToast("ERROR : Quality Value between 1-100 Only"); }
                else {
                    settings = {
                        1: 6,
                        2: 2,
                        6: bitrate
                    };
                }
                break;
            default:
                settings = {
                    1: 6,
                    2: 1,
                    6: bitrate * 1000
                };
                break;

        }
        generatePayload(settings);
        showToast('Applying Quality Settings');
    });
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------------

function populateQualityPanel() {
    const data = getCameraResolutions;
    const widthInput = document.getElementById('custom-width');
    const heightInput = document.getElementById('custom-height');
    const cameraSectionsContainer = document.getElementById('camera-sections');

    cameraSectionsContainer.innerHTML = '';
    data.cameraResolutions.forEach(camera => {
        const cameraTitle = document.createElement('h5');
        cameraTitle.className = 'font-semibold text-sm capitalize';
        cameraTitle.textContent = `${camera.facing} Camera`;
        const resolutionsContainer = document.createElement('div');
        resolutionsContainer.className = 'grid grid-cols-4 gap-2';

        camera.resolutions.forEach(res => {
            const button = document.createElement('button');
            button.className = 'bg-gray-600 hover:bg-blue-500 text-xs py-1 rounded-md transition-colors';
            button.textContent = `${res.width} x ${res.height}`;
            button.dataset.width = res.width;
            button.dataset.height = res.height;
            resolutionsContainer.appendChild(button);
            button.addEventListener('click', () => {
                widthInput.value = res.width;
                heightInput.value = res.height;
            });

        });

        cameraSectionsContainer.appendChild(cameraTitle);
        cameraSectionsContainer.appendChild(resolutionsContainer);
    });
}

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * @param {string} sim - provider.
 * @param {string} hexString 
 */
function updateDeviceImpInfo(hexString) {
    const arrayBuffer = new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))).buffer;
    const view = new DataView(arrayBuffer);

    let offset = 0;
    const batCurrent = view.getInt16(offset, true); offset += 2;
    const signal = view.getInt16(offset, true); offset += 2;
    const upload = view.getFloat32(offset, true); offset += 4;
    const download = view.getFloat32(offset, true); offset += 4;
    const netType = view.getUint8(offset); offset += 1;
    const dataNetType = view.getUint8(offset); offset += 1; // Not displayed, but parsed
    const lat = view.getFloat64(offset, true); offset += 8;
    const lon = view.getFloat64(offset, true); offset += 8;

    const networkTypeMap = {
        0: 'Unknown',
        1: 'GPRS',
        2: 'EDGE',
        3: 'UMTS',
        4: 'CDMA',
        5: 'EVDO_0',
        6: 'EVDO_A',
        7: '1xRTT',
        8: 'HSDPA',
        9: 'HSUPA',
        10: 'HSPA',
        11: 'iDen',
        12: 'EVDO_B',
        13: '4G',    // LTE
        14: 'eHRPD',
        15: 'HSPA+',
        16: 'GSM',
        17: 'TD_SCDMA',
        18: 'IWLAN',
        19: 'LTE_CA', // 4G+
        20: '5G'     // NR
    };
    const netTypeString = networkTypeMap[netType] || 'Unknown';

    document.getElementById('status-current').textContent = batCurrent;
    document.getElementById('status-signal').textContent = signal;
    document.getElementById('status-net-type').textContent = netTypeString;
    document.getElementById('status-upload').textContent = upload.toFixed(2);
    document.getElementById('status-download').textContent = download.toFixed(2);
    document.getElementById('status-gps').textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

    //update map locn 
    updateMap(lat, lon);
}

function updateDeviceInfo(sim, hexString) {
    const arrayBuffer = new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))).buffer;
    const view = new DataView(arrayBuffer);

    let offset = 0;
    const batLevel = view.getUint8(offset); offset += 1;
    const batTemp = view.getFloat32(offset, true); offset += 4;
    const thermalStatus = view.getUint8(offset); offset += 1; // Not displayed, but parsed
    const dataUsed = view.getFloat32(offset, true); offset += 4;
    const dataNetType = view.getUint8(offset); offset += 1; // Not displayed, but parsed
    const accuracy = view.getFloat32(offset, true); offset += 4;
    const speed = view.getFloat32(offset, true); offset += 4;
    const altitude = view.getFloat64(offset, true);

    document.getElementById('status-sim').textContent = sim;
    document.getElementById('status-battery').textContent = batLevel;
    document.getElementById('status-temp').textContent = batTemp.toFixed(1);
    document.getElementById('status-data-total').textContent = dataUsed.toFixed(1);
    document.getElementById('status-altitude').textContent = altitude.toFixed(1);
    document.getElementById('status-accuracy').textContent = accuracy.toFixed(1);
    document.getElementById('status-speed').textContent = speed.toFixed(1);
}

// --------------------------------------------------------------------------------------------------------------------------

setInterval(() => {
    generatePayload({ "1": "2", "2": "1" });
}, 30000);

function showToast(message, duration = 2000) {
    console.log(message);
    const toast = document.createElement('div');
    toast.classList.add(
        'fixed',
        'bottom-5',
        'left-1/2',
        '-translate-x-1/2',
        'bg-grey-500',
        'text-white',
        'px-6',
        'py-3',
        'rounded-lg',
        'shadow-xl',
        'opacity-0',
        'translate-y-4',
        'transition-all',
        'duration-300',
        'ease-in-out'
    );

    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
        toast.classList.add('opacity-100', 'translate-y-0');
    }, 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// map related JS // if anything thing is wrong blame chatgpt here 

let mapVisible = true;
const mapToggleBtn = document.getElementById("map-toggle-btn");
const miniMap = document.getElementById("mini-map");
let map, marker;

// custom phone icon using DivIcon
const phoneIcon = L.divIcon({
    html: '<i class="fas fa-mobile-alt text-red-500 text-xl"></i>',
    className: '',       // remove default 'leaflet-div-icon' styles
    iconSize: [24, 24],
    iconAnchor: [12, 24] // bottom-center of icon
});


// Initialize map (hidden initially)
function initMap(lat = 0, lon = 0) {
    if (map) return; // prevent reinit

    // Use satellite + OSM hybrid (Esri or OpenTopo)
    map = L.map('mini-map', {
        center: [lat, lon],
        zoom: 13,
        zoomControl: false,
    });

    // OpenStreetMap + Esri Satellite layer
    const baseLayers = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }),
        "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        })
    };

    baseLayers["Satellite"].addTo(map); // default layer

    // Add layer control (legend)
    L.control.layers(baseLayers).addTo(map);

    // Marker with popup
    marker = L.marker([lat, lon], { icon: phoneIcon }).addTo(map)
        .bindPopup(`Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`)
        .openPopup();
}

// Update marker position on GPS update
function updateMap(lat, lon) {
    if (!map) initMap(lat, lon);
    marker.setLatLng([lat, lon]);
    map.setView([lat, lon]);
    marker.getPopup().setContent(`Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
}

// Toggle button handler
mapToggleBtn.addEventListener('click', () => {
    mapVisible = !mapVisible;
    miniMap.classList.toggle('hidden', !mapVisible);
    if (mapVisible && !map) initMap();
});




// todo : data logging , video storing and osd related things , bug fixes 