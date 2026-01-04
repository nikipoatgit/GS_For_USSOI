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

// -----------------------------------------------------------------------------------------------------------------------------------------
// main ui panel controls 
// globalConst
let TunnelMode; // bt , usb , none , null
let isParamsSetForClient = false;

window.clientConfig = {
    webrtc: true,
    mse: false,
    local: false,
    isRecordingSettings: false,
    isStreamingActive: false,
    isRecordingActive: false
};

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


let loc = window.location;// holds refs to urls , its win object
const protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
const base = location.host;

const endpoint1 = protocol + base + '/' + 'control/js';
const endpoint2 = protocol + base + '/' + 'mse/js';

let pc;
const pendingRequests = {};
const REQUEST_TIMEOUT = 5000;

let getCameraResolutions = null;

let isStreaming = false;

let DeviceInfo = null;
//------------------------------------------------------------------------------------------------------------------------------------------------------

const ServerVersion = "2.0.0";
const ClientVersionMinAllowed = "2.0.0";  // Minimum allowed
const ClientVersionMaxAllowed = "2.0.9"; // Maximum allowed

function versionCheck(version) {
    if (version) {
        const belowMin = version.localeCompare(ClientVersionMinAllowed, undefined, { numeric: true }) < 0;
        const aboveMax = version.localeCompare(ClientVersionMaxAllowed, undefined, { numeric: true }) > 0;

        if (belowMin) {
            addLogEntry("warn", "Version Mismatch", `Client Application(v${version}) is outdated`);
        }

        if (aboveMax) {
            addLogEntry("warn", "Version Mismatch", `Host Server(v${ServerVersion}) is outdated`);
        }
    }
}


const headerEl = document.querySelector('#quality-panel h4');
const modeSliderContainer = document.getElementById('mode-slider-container');
const modeSlider = document.getElementById('mode-slider');
const modeCheckbox = modeSlider.querySelector('input');

function setModeSlider() {
    modeSliderContainer.classList.remove('hidden');
}
function unsetModeSlider() {
    modeSliderContainer.classList.add('hidden');
    removeSettingPanelForLocalRecording();
}

function setSettingPanelForLocalRecording() {
    clientConfig.isRecordingSettings = true;

    headerEl.textContent = 'Recording Settings';
    resButton.classList.add('hidden');

    modeCheckbox.checked = true;
}
function removeSettingPanelForLocalRecording() {

    clientConfig.isRecordingSettings = false;

    headerEl.textContent = 'Streaming Settings';
    resButton.classList.remove('hidden');

    modeCheckbox.checked = false;
}

const WEBRTC_ICON = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes deepPulse {
      0%   { opacity: 0.2; r: 3; }   /* Dark/Dim */
      50%  { opacity: 1.0; r: 4; }   /* Full Brightness */
      100% { opacity: 0.2; r: 3; }   /* Back to Dark */
    }
    .node { animation: deepPulse 6s infinite ease-in-out; }
    .node-1 { animation-delay: 0s; }   /* Top */
    .node-2 { animation-delay: 2s; }   /* Right */
    .node-3 { animation-delay: 4s; }   /* Left */
  </style>

  <path d="M12 6L18 17H6L12 6Z" stroke="#4B5563" stroke-width="1.5" stroke-linejoin="round" opacity="0.5"/>

  <circle cx="12" cy="6" r="3" fill="#4285F4" class="node node-1"/>

  <circle cx="18" cy="17" r="3" fill="#EA4335" class="node node-2"/>

  <circle cx="6" cy="17" r="3" fill="#34A853" class="node node-3"/>
</svg>`;


const MSE_ICON = `
<svg width="32" height="14" viewBox="0 0 32 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes cycle {
      0%   { fill: #4285F4; }
      25%  { fill: #EA4335; }
      50%  { fill: #FBBC05; }
      75%  { fill: #34A853; }
      100% { fill: #4285F4; }
    }

    .txt {
      font-family: Arial, sans-serif;
      font-weight: 900;
      font-size: 11px;
      animation: cycle 4s infinite linear;
    }

    .c1 { animation-delay: 0s; }
    .c2 { animation-delay: -1s; }
    .c3 { animation-delay: -2s; }
    .c4 { animation-delay: -3s; }
  </style>

  <text x="1"  y="11" class="txt c1">H</text>
  <text x="9"  y="11" class="txt c2">2</text>
  <text x="17" y="11" class="txt c3">6</text>
  <text x="25" y="11" class="txt c4">4</text>
</svg>`;

const streamIcon = document.getElementById('stream-icon');

function updateStreamIcon() {
    if (window.clientConfig.webrtc) {
        streamIcon.innerHTML = WEBRTC_ICON;
        streamIcon.title = 'WebRTC';
    } else if (window.clientConfig.mse) {
        streamIcon.innerHTML = MSE_ICON;
        streamIcon.title = 'MSE';
    } else {
        streamIcon.innerHTML = '';
        streamIcon.title = '';
    }
}

// ------------------------------------------------------------------------------------------------------------------------------------------------------


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
    applyVideoTransform();
});


rotateBtn.addEventListener('click', () => {
    const icon = rotateBtn.querySelector('i');
    animateIcon(icon, 'rotate-180');
    if (clientConfig.webrtc === true) {
        generatePayload({
            type: "stream",
            webrtc: window.clientConfig.webrtc === true,
            mse: window.clientConfig.mse === true,
            rotate: true
        },
            () => {
                addLogEntry("error", "Rotation Command", "Device did not acknowledge");
            });
    }
    else if (clientConfig.mse === true) {
        currentRotation += 90;
        if (currentRotation > 270) currentRotation = 0;
        applyVideoTransform();
    }

});

function applyVideoTransform() {
    const flip = isFlipped ? -1 : 1;
    video.style.transform = `rotate(${currentRotation}deg) scaleX(${flip})`;
}


toggleCameraBtn.addEventListener('click', async () => {
    generatePayload({
        type: "stream",
        webrtc: window.clientConfig.webrtc === true,
        mse: window.clientConfig.mse === true,
        switch: true
    },
        () => {
            addLogEntry("error", "Camera Switch Command", "Device did not acknowledge");
        });

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
    const previousState = isVideoOn;
    isVideoOn = !isVideoOn;

    updateVideoUI(isVideoOn);

    generatePayload({
        type: "stream",
        webrtc: clientConfig.webrtc,
        mse: clientConfig.mse,
        video: isVideoOn
    }, () => {

        isVideoOn = previousState;
        updateVideoUI(isVideoOn);
        addLogEntry("error", "Video Command", "Device did not acknowledge");
    });
};

function updateVideoUI(isOn) {
    if (isOn) {
        playPauseIcon.classList.replace('fa-pause', 'fa-play');
    } else {
        playPauseIcon.classList.replace('fa-play', 'fa-pause');
    }
}



const toggleMute = () => {
    const previousState = isAudioOn;
    isAudioOn = !isAudioOn;

    updateMuteUI(isAudioOn);

    generatePayload({
        type: "stream",
        webrtc: clientConfig.webrtc,
        mse: clientConfig.mse,
        audio: isAudioOn
    }, () => {

        isAudioOn = previousState;
        updateMuteUI(isAudioOn);
        addLogEntry("error", "Audio Command", "Failed to reach device");
    });
};

function updateMuteUI(isOn) {
    if (isOn) {
        volumeIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
    } else {
        volumeIcon.classList.replace('fa-volume-up', 'fa-volume-mute');
    }
}

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

// -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
const customWidth = document.getElementById("custom-width");
const customHeight = document.getElementById("custom-height");
const fpsInput = document.getElementById("fps-input");
const bitrateInput = document.getElementById("bitrate-input");

const resButton = document.getElementById("resButton");
const bpsButton = document.getElementById("bpsButton");

/* payload header */
function baseHeader() {
    return {
        type: "stream",
        webrtc: window.clientConfig.webrtc === true,
        mse: window.clientConfig.mse === true
    };
}

/* Sender */
function sendStreamPayload(payload) {
    generatePayload({
        ...baseHeader(),
        ...payload
    },
        () => {
            addLogEntry("error", "Stream Command", "Device did not acknowledge");
        });
}

/* ================= BUTTON HANDLERS ================= */

/* Resolution (width + height + fps) */
resButton.addEventListener("click", () => {

    if (clientConfig.mse) {
        closeMse();
    }
    setTimeout(() => {
        enableMse();
        const width = Number(customWidth.value);
        const height = Number(customHeight.value);
        const fps = Number(fpsInput.value) || 20;

        if (width > 0 && height > 0) {
            sendStreamPayload({
                res: true,
                quality: {
                    width,
                    height,
                    fps
                }
            });
        }
    }, 500);
});

modeCheckbox.addEventListener('change', () => {
    if (modeCheckbox.checked) {
        setSettingPanelForLocalRecording();
    } else {
        removeSettingPanelForLocalRecording();
    }
});

/* Bitrate (kbps → bps) */
bpsButton.addEventListener("click", () => {
    if (clientConfig.isRecordingSettings === true) {
        const width = Number(customWidth.value);
        const height = Number(customHeight.value);
        const fps = Number(fpsInput.value) || 20;
        const KBps = Number(bitrateInput.value);

        if (width > 0 && height > 0 && KBps > 0) {
            sendStreamPayload({
                resRecord: true,
                quality: {
                    width,
                    height,
                    fps,
                    bitrate: KBps * 1000 * 8
                }
            });
        }
    }
    else {
        const KBps = Number(bitrateInput.value);

        if (KBps > 0) {
            sendStreamPayload({
                bitrate: KBps * 1000 * 8
            });
        }
    }
});


// Setting Panel Related Code
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const recordBtn = document.getElementById("start-recording-btn");
const qualitySettingsBtn = document.getElementById('quality-settings-btn');
const closeQualityPanelBtn = document.getElementById('close-quality-panel');
const qualityPanel = document.getElementById('quality-panel');
const setupSettingsBtn = document.getElementById('change-setup-btn');


function setRecordingActiveUI() {
    recordBtn.disabled = true;
    recordBtn.textContent = "Local Recording Active";

    recordBtn.classList.add(
        'opacity-50',
        'text-blue-400',
        'animate-pulse'
    );
    recordBtn.classList.remove('hover:text-green-400');
}

function revertRecordingUI() {
    recordBtn.disabled = false;
    recordBtn.textContent = "Start Recording";

    recordBtn.classList.remove(
        'opacity-50',
        'text-blue-400',
        'animate-pulse'
    );
    recordBtn.classList.add('hover:text-green-400');
}

recordBtn.addEventListener('click', () => {
    if (clientConfig.local && isStreaming) {
        setRecordingActiveUI();

        generatePayload(
            {
                type: "stream",
                webrtc: clientConfig.webrtc,
                mse: clientConfig.mse,
                record: true
            },
            () => revertRecordingUI()
        );
    }
});



let rotation = 0;

settingsBtn.addEventListener('click', () => {
    if (getCameraResolutions === null) {
        generatePayload({ type: "getCamRes" }, () => generatePayload({ type: "getCamRes" }));
    }
    settingsPanel.classList.toggle('hidden');
    rotation += 20;
    const icon = settingsBtn.querySelector('i');
    icon.style.transition = 'transform 0.3s ease-in-out';
    icon.style.transform = `rotate(${rotation}deg)`;
});

qualitySettingsBtn.addEventListener('click', () => {
    populateQualityPanel();
    qualityPanel.classList.remove('hidden');
});
closeQualityPanelBtn.addEventListener('click', () => {
    qualityPanel.classList.add('hidden');
});

setupSettingsBtn.addEventListener('click', () => {
    setParamsForClient();
});

/* ===================== STREAM CONTROL ===================== */

document.getElementById('start-stream-btn').onclick = () => {
    if (!isParamsSetForClient) return;
    stopStream()
    isStreaming = true;

    generatePayload({
        type: "stream",
        webrtc: clientConfig.webrtc,
        mse: clientConfig.mse,
        start: true
    },
        () => {
            revertRecordingUI();
            isStreaming = false;
        }
    );
    if (clientConfig.webrtc) {
        webRtc();
    }
    else if (clientConfig.mse) {
        enableMse();
    }

};

document.getElementById('stop-stream-btn').onclick = () => {
    stopStream();
};

function stopStream() {
    isStreaming = false;
    generatePayload({
        type: "stream",
        webrtc: true,
        mse: true,
        start: false
    },
        () => {
            setRecordingActiveUI();
            isStreaming = true;
        }
    );
    closeWebRtc();
    closeMse();
    if (clientConfig.local) {
        revertRecordingUI();
    }
}

/* ===================== TUNNEL CONTROL ===================== */

document.getElementById('start-mavlink-btn').onclick = () => {
    generatePayload({
        type: "UARTTunnel",
        tunnelStatus: false
    });
    setTimeout(generatePayload({
        type: "UARTTunnel",
        tunnelStatus: true
    }), 500);

};

document.getElementById('stop-mavlink-btn').onclick = () => {
    generatePayload({
        type: "UARTTunnel",
        tunnelStatus: false
    });
};



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
 * @param {string} hexString
 */
function updateDeviceImpInfo(hexString) {

    // ---------- STATUS (last hex nibble) ----------
    const statusChar = hexString.trim().slice(-1);
    const status = parseInt(statusChar, 16);
    if (Number.isNaN(status)) return;

    updateIndicator('device', true);
    updateIndicator('tunnel', (status & 0x1) !== 0);
    updateIndicator('stream', (status & 0x2) !== 0);
    updateIndicator('record', (status & 0x4) !== 0);

    // ---------- PAYLOAD (exclude status nibble) ----------
    const payloadHex = hexString.trim().slice(0, -1);

    const bytes = payloadHex.match(/[\da-f]{2}/gi);
    if (!bytes) return;

    const arrayBuffer = new Uint8Array(
        bytes.map(h => parseInt(h, 16))
    ).buffer;

    const view = new DataView(arrayBuffer);
    let o = 0;

    // power
    const batCurrent = view.getInt16(o, true); o += 2;
    const batLevel = view.getUint8(o++);
    const batTemp = view.getFloat32(o, true); o += 4;
    const thermal = view.getUint8(o++);

    // radio
    const signal = view.getInt16(o, true); o += 2;
    const wifiSignal = view.getInt16(o, true); o += 2;
    const netType = view.getUint8(o++);
    const dataNet = view.getUint8(o++);

    const networkTypeMap = {
        0: 'Unknown', 1: 'GPRS', 2: 'EDGE', 3: 'UMTS', 4: 'CDMA',
        5: 'EVDO_0', 6: 'EVDO_A', 7: '1xRTT', 8: 'HSDPA', 9: 'HSUPA',
        10: 'HSPA', 11: 'iDen', 12: 'EVDO_B', 13: '4G',
        14: 'eHRPD', 15: 'HSPA+', 16: 'GSM', 17: 'TD_SCDMA',
        18: 'IWLAN', 19: 'LTE_CA', 20: '5G'
    };

    // throughput
    const upload = view.getFloat32(o, true); o += 4;
    const download = view.getFloat32(o, true); o += 4;
    const dataUsed = view.getFloat32(o, true); o += 4;

    // location
    const lat = view.getFloat64(o, true); o += 8;
    const lon = view.getFloat64(o, true); o += 8;
    const accuracy = view.getFloat32(o, true); o += 4;
    const speed = view.getFloat32(o, true); o += 4;
    const altitude = view.getFloat64(o, true);

    // UI
    document.getElementById('status-current').textContent = batCurrent;
    document.getElementById('status-battery').textContent = batLevel;
    document.getElementById('status-temp').textContent = batTemp.toFixed(1);
    document.getElementById('status-signal').textContent = signal;
    updateSignal(signal);
    document.getElementById('wifi-status-signal').textContent = wifiSignal;
    updateWifiSignal(wifiSignal);
    document.getElementById('status-net-type').textContent =
        networkTypeMap[dataNet] || 'Unknown';
    document.getElementById('status-upload').textContent = upload.toFixed(2);
    document.getElementById('status-download').textContent = download.toFixed(2);
    document.getElementById('status-data-total').textContent = dataUsed.toFixed(1);
    document.getElementById('status-gps').textContent =
        `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    document.getElementById('status-accuracy').textContent = accuracy.toFixed(1);
    document.getElementById('status-speed').textContent = speed.toFixed(1);
    document.getElementById('status-altitude').textContent = altitude.toFixed(1);

    updateMap(lat, lon, accuracy);
}

function updateSignal(dBm) {
    const bars = document.querySelectorAll('#signal-bars span');
    document.getElementById('status-signal').textContent = dBm;

    let count;

    if (dBm >= -80) count = 4;
    else if (dBm >= -90) count = 3;
    else if (dBm >= -100) count = 2;
    else if (dBm >= -115) count = 1;
    else count = 0;


    bars.forEach((bar, i) => {
        bar.classList.toggle('bg-white/100', i < count);
        bar.classList.toggle('bg-white/30', i >= count);
    });
}

function updateWifiSignal(rssi) {
    const bars = document.querySelectorAll('#wifi-icon .wifi-bar');
    const label = document.getElementById('wifi-status-signal');

    if (label) label.textContent = rssi;

    let count;
    if (rssi >= -45) count = 4;
    else if (rssi >= -60) count = 3;
    else if (rssi >= -70) count = 2;
    else if (rssi >= -85) count = 1;
    else count = 0;

    // Activate from CENTER outward (dot → arcs)
    const order = [3, 2, 1, 0]; // dot, inner, mid, outer

    order.forEach((idx, i) => {
        bars[idx].classList.toggle('text-white', i < count);
        bars[idx].classList.toggle('text-white/30', i >= count);
    });
}


//------------------------------------------------------------------------------------------------

// Timers :  device
let statusTimers = { device: null, stream: null, record: null, tunnel: null };

function updateIndicator(id, isActive) {
    const el = document.getElementById(`stat-${id}`);
    const dot = el.querySelector('.indicator-dot');

    clearTimeout(statusTimers[id]);

    if (isActive) {
        dot.className = "indicator-dot w-2 h-2 bg-green-500 rounded-full animate-pulse";
        el.classList.remove('text-gray-500');
        el.classList.add('text-white');

        statusTimers[id] = setTimeout(() => updateIndicator(id, false), 6000);
    } else {
        dot.className = "indicator-dot w-2 h-2 bg-gray-500 rounded-full";
        el.classList.remove('text-white');
        el.classList.add('text-gray-500');
    }
}
