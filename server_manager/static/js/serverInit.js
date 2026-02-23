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

/* ---------- Overlay control ---------- */
let isConfigOpen = false;

function setupConfigParams(parseData) {
    TunnelMode = parseData.tunnelMode;
    isParamsSetForClient = parseData.isParamsReceived;
    clientConfig.local = parseData.local;
    clientConfig.mse = parseData.mse;
    clientConfig.webrtc = parseData.webrtc;
    clientConfig.mse_high_fps = parseData.mse_high_fps
    clientConfig.HighFpsSupport = parseData.HighFpsSupport
    clientConfig.isStreamingActive = parseData.stream;
    clientConfig.isRecordingActive = parseData.record;
    if (parseData.version)
        if (isParamsSetForClient === false) {
            setParamsForClient();
        }
    if (clientConfig.isRecordingActive == true) {
        setRecordingActiveUI();
    }
    else {
        revertRecordingUI();
    }
    if (clientConfig.isStreamingActive === true) {
        addLogEntry("warn", "Device ", "Streaming Active Restart to get Feed");
    }
    setTunnelButtonsState();
    updateStreamIcon();
}

function setParamsForClient() {
    isConfigOpen = true;

    const overlay = document.getElementById('client-config-overlay');
    overlay.classList.remove('hidden');
    initModeFromClientConfig();
}

function closeClientConfig() {
    isConfigOpen = false;
    document.getElementById('client-config-overlay')
        .classList.add('hidden');
}

/* ---------- Mode handling ---------- */
function initModeFromClientConfig() {
    const webrtc   = document.getElementById('cfg-webrtc');
    const mse      = document.getElementById('cfg-mse');
    const local    = document.getElementById('cfg-local');
    const highFps  = document.getElementById('cfg-highfps');

    webrtc.checked  = !!window.clientConfig.webrtc;
    mse.checked     = !!window.clientConfig.mse;
    local.checked   = !!window.clientConfig.local;
    highFps.checked = !!window.clientConfig.mse_high_fps;

    if (webrtc.checked && mse.checked) {
        mse.checked = false;
    }

    handleModeChange(null);
}

function handleModeChange(e) {
    const webrtc  = document.getElementById('cfg-webrtc');
    const mse     = document.getElementById('cfg-mse');
    const local   = document.getElementById('cfg-local');
    const highFps = document.getElementById('cfg-highfps');

    /* mutual exclusion */
    if (e?.target === webrtc && webrtc.checked) mse.checked = false;
    if (e?.target === mse && mse.checked) webrtc.checked = false;

    /* local note */
    document.getElementById('local-note')
        .classList.toggle('hidden', !local.checked);

    /* High FPS rules */
    const highFpsSupported = !!window.clientConfig.HighFpsSupport;
    const highFpsAllowed   = mse.checked && highFpsSupported;

    highFps.disabled = !highFpsAllowed;
    highFps.classList.toggle('opacity-50', !highFpsAllowed);

    /* only auto-clear on USER action */
    if (e && !highFpsAllowed) {
        highFps.checked = false;
    }

    /* Button enable logic */
    const addBtn = document.getElementById('add-turn-btn');

    const btnEnabled =
        webrtc.checked ||
        (mse.checked && highFps.checked && highFpsSupported);

    addBtn.disabled = !btnEnabled;
    addBtn.classList.toggle('opacity-50', !btnEnabled);

    /* TURN inputs: WebRTC only */
    document.querySelectorAll('.turn-input').forEach(i => {
        i.disabled = !webrtc.checked;
        i.classList.toggle('opacity-50', !webrtc.checked);
    });
}
/* ---------- TURN rows ---------- */

function addTurnRow() {
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center w-full';

    row.innerHTML = `
        <input placeholder="turn:server"
               class="turn-input flex-[2] min-w-0 bg-gray-800 border border-gray-700 rounded px-3 py-1.5">
        <input placeholder="User"
               class="turn-input flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded px-3 py-1.5">
        <input placeholder="Pass"
               class="turn-input flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded px-3 py-1.5">
        <button type="button"
                onclick="this.parentElement.remove()"
                class="shrink-0 text-red-400 hover:text-red-300 text-sm">✕</button>
    `;

    document.getElementById('turn-list').appendChild(row);
    applyThisUiChangeToBtns();
}

/* ---------- Payload send ---------- */

function sendClientConfig() {
    const turnServers = [...document.querySelectorAll('#turn-list > div')]
        .map(row => {
            const i = row.querySelectorAll('input');
            return {
                url: i[0].value.trim(),
                user: i[1].value.trim(),
                pass: i[2].value.trim()
            };
        })
        .filter(t => t.url);

    const payload = {
        type: "config",
        webrtc: document.getElementById('cfg-webrtc').checked,
        mse: document.getElementById('cfg-mse').checked,
        mse_high_fps : document.getElementById('cfg-highfps').checked,
        local: document.getElementById('cfg-local').checked,
        baudrate: Number(document.getElementById('cfg-baud').value),
        bitrate: Number(document.getElementById('cfg-local-bitrate').value) * 8,
        turn: turnServers,
    };

    buildRtcConfig(payload);

    clientConfig.webrtc = document.getElementById('cfg-webrtc').checked;
    clientConfig.mse = document.getElementById('cfg-mse').checked;
    clientConfig.local = document.getElementById('cfg-local').checked;
    clientConfig.mse_high_fps = document.getElementById('cfg-highfps').checked;

    if (clientConfig.mse && clientConfig.local) {
        setModeSlider();
    }
    else {
        unsetModeSlider();
    }

    updateStreamIcon()

    isParamsSetForClient = true;
    generatePayloadAdmin(payload, () => {
        console.warn("Reverting ParamsSet For Client not set due to ACK failure");
        isParamsSetForClient = false;
        setParamsForClient();
    });
    closeClientConfig();

}

function buildRtcConfig(payload) {
    if (Array.isArray(payload.turn)) {
        payload.turn.forEach(t => {
            config.iceServers.push({
                urls: t.url,
                username: t.user || undefined,
                credential: t.pass || undefined
            });
        });
    }
}
