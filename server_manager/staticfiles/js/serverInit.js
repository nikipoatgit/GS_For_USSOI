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

function setupConfigParams(parseData){
            TunnelMode = parseData.tunnelMode;
            isParamsSetForClient = parseData.isParamsReceived;
            clientConfig.local = parseData.local;
            clientConfig.mse = parseData.mse;
            clientConfig.webrtc = parseData.webrtc;
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
    const webrtc = document.getElementById('cfg-webrtc');
    const mse    = document.getElementById('cfg-mse');
    const local  = document.getElementById('cfg-local');

    webrtc.checked = !!window.clientConfig.webrtc;
    mse.checked    = !!window.clientConfig.mse;
    local.checked  = !!window.clientConfig.local;

    if (webrtc.checked && mse.checked) {
        mse.checked = false;
    }
    handleModeChange(null);
}

function handleModeChange(e) {
    const webrtc = document.getElementById('cfg-webrtc');
    const mse = document.getElementById('cfg-mse');
    const local = document.getElementById('cfg-local');

    if (e?.target === webrtc && webrtc.checked) mse.checked = false;
    if (e?.target === mse && mse.checked) webrtc.checked = false;

    document.getElementById('local-note')
        .classList.toggle('hidden', !local.checked);

    const turnEnabled = webrtc.checked;

    const addBtn = document.getElementById('add-turn-btn');
    addBtn.disabled = !turnEnabled;
    addBtn.classList.toggle('opacity-50', !turnEnabled);

    document.querySelectorAll('.turn-input').forEach(i => {
        i.disabled = !turnEnabled;
        i.classList.toggle('opacity-50', !turnEnabled);
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
    handleModeChange();
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
        local: document.getElementById('cfg-local').checked,
        baudrate: Number(document.getElementById('cfg-baud').value),
        bitrate: Number(document.getElementById('cfg-local-bitrate').value)*8,
        turn: turnServers,
    };

    buildRtcConfig(payload);

    clientConfig.webrtc = document.getElementById('cfg-webrtc').checked;
    clientConfig.mse = document.getElementById('cfg-mse').checked;
    clientConfig.local = document.getElementById('cfg-local').checked;

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
