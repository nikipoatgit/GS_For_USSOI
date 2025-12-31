// websocket related code 
// --------------------------------------------------------------------------------------------------------------------------------------------
addLogEntry("info", "Endpoint", new Date().toLocaleTimeString() + `- ${endpoint1}`);
addLogEntry("info", "Endpoint", new Date().toLocaleTimeString() + `- ${endpoint2}`);

// for now only connect to WS 1  'control/js'

let webSocket1 = null;
let webSocket2 = null;
let reconnectTimer = null;
const RECONNECT_INTERVAL = 3000;

function connectWebSocket() {
    // 1. Clean up existing socket if it exists
    if (webSocket1) {
        webSocket1.onopen = null;
        webSocket1.onmessage = null;
        webSocket1.onclose = null;
        webSocket1.onerror = null;
        webSocket1.close();
    }

    webSocket1 = new WebSocket(endpoint1);

    webSocket1.onopen = () => {
        addLogEntry("info", "Ground Server Connection Established", new Date().toLocaleTimeString());
        if (isParamsSetForClient === false) {
            setTimeout(() => {
                generatePayloadAdmin({ "type": "getClientConfig" }, () => generatePayloadAdmin({ "type": "getClientConfig" }));
                generatePayloadAdmin({ "type": "deviceInfo" });
            }, 500);
            setTimeout(() => {
                addLogEntry("info", "Device Name : Brand", DeviceInfo.Device.DeviceName + " : " +  DeviceInfo.Device.Brand);
                addLogEntry("info", "Device AndroidVersion", DeviceInfo.Device.AndroidVersion);
                if (DeviceInfo.Device.AndroidVersion < 7) {
                    addLogEntry("warn", "Device AndroidVersion", "Client Application Compatibility Issue (Android < 7)");
                }
                if (DeviceInfo.Device.SDKVersion < 24) {
                    addLogEntry("warn", "Device SDK ", "Client Application Compatibility Issue  (SDK < 24)");
                }
            }, 3000);

        }
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    };

    webSocket1.onmessage = webSocketOnMessage1;

    webSocket1.onclose = (e) => {
        addLogEntry("warn", "Connection Closed. Retrying...", new Date().toLocaleTimeString());
        isServerinit = false;
        scheduleReconnect();
    };

    webSocket1.onerror = (err) => {
        addLogEntry("error", "WebSocket Error", new Date().toLocaleTimeString());
    };
}

function scheduleReconnect() {
    if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectWebSocket();
        }, RECONNECT_INTERVAL);
    }
}

connectWebSocket();

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function webSocketOnMessage1(event) {
    const parseData = JSON.parse(event.data);
  
        console.log("Incoming :" + JSON.stringify(parseData));
    
    switch (parseData.type) {
        case 'clientStats': {
            updateDeviceImpInfo(parseData.hex);

            if (parseData.stat) {
                updateIndicator('stream', parseData.stat.stream);
                updateIndicator('tunnel', parseData.stat.tunnel);
            }
            break;
        }
        case "ice": {
            const candidate = new RTCIceCandidate({
                candidate: parseData.candidate,
                sdpMid: parseData.sdpMid,
                sdpMLineIndex: parseData.sdpMLineIndex
            });
            pc.addIceCandidate(candidate).catch(e => addLogEntry("error", "ICE Add Error", e.message || String(e)));
            addLogEntry("success", "ICE RECEIVED", new Date().toLocaleTimeString());
            break;
        }
        case 'sdp': {
            handleOffer(parseData.sdp);
            addLogEntry("success", "SDP RECEIVED", new Date().toLocaleTimeString());
            break;
        }
        case 'clientStatus': {
            if (parseData.t == '1') {
                addLogEntry("success", "Device ", new Date().toLocaleTimeString() + "  --" + parseData.s);
                setTimeout(() => {
                    generatePayloadAdmin({ "type": "getClientConfig" }, () => generatePayloadAdmin({ "type": "getClientConfig" }))
                    generatePayloadAdmin({ "type": "deviceInfo" });;
                }, 1000);
                break;
            }
            else if (parseData.t == '0') {
                addLogEntry("warn", "Device ", new Date().toLocaleTimeString() + "  --" + parseData.s);
            }
            break;

        }
        case "camRes": {
            getCameraResolutions = parseData;
            populateQualityPanel();
            break;
        }
        case "ack": {
            handleRequestResponse(parseData.reqId, parseData.type, parseData.msg);
            break;
        }
        case "nack": {
            handleRequestResponse(parseData.reqId, parseData.type, parseData.msg);
            break;
        }
        case "stat": {
            break;
        }
        case "config": {
            setupConfigParams(parseData);
            versionCheck(parseData.version);
            break;
        }
        case "deviceInfo": {
            DeviceInfo = parseData.info;
        }
    }
}

function setTunnelButtonsState() {
    const isDisabled = (TunnelMode === 'null' || TunnelMode === 'none');
    const startBtn = document.getElementById('start-mavlink-btn');
    const stopBtn = document.getElementById('stop-mavlink-btn');


    startBtn.disabled = isDisabled;
    stopBtn.disabled = isDisabled;

    startBtn.classList.toggle('cursor-not-allowed', isDisabled);
    stopBtn.classList.toggle('cursor-not-allowed', isDisabled);

    startBtn.classList.toggle('pointer-events-none', isDisabled);
    stopBtn.classList.toggle('pointer-events-none', isDisabled);

    updateTunnelIcon();
}

function updateTunnelIcon() {
    const iconContainer = document.getElementById('tunnel-icon');
    iconContainer.innerHTML = '';

    if (TunnelMode === 'bt') {
        iconContainer.innerHTML =
            '<i class="fa-brands fa-bluetooth-b text-blue-400 text-sm"></i>';
    }
    else if (TunnelMode === 'usb') {
        iconContainer.innerHTML =
            '<i class="fa-brands fa-usb text-green-400 text-sm"></i>';
    }
    else {
        iconContainer.innerHTML =
            '<i class="fa-solid fa-xmark text-red-400 text-sm"></i>';
    }
}


const generatePayload = (data, revertCallback = null) => {
    if (!isParamsSetForClient) {
        setTimeout(() => {
            generatePayloadAdmin({ "type": "getClientConfig" }, () => generatePayloadAdmin({ "type": "getClientConfig" }));
        }, 500);
        return;
    }
    const reqId = Math.floor(1000 + Math.random() * 9000);
    data.reqId = reqId;

    const timer = setTimeout(() => {
        handleRequestResponse(reqId, 'timeout');
    }, REQUEST_TIMEOUT);

    pendingRequests[reqId] = {
        type: data.type,
        timer: timer,
        revert: revertCallback
    };

    if (webSocket1 && webSocket1.readyState === WebSocket.OPEN) {
        webSocket1.send(JSON.stringify(data));
        console.log('OUTGOING :' + JSON.stringify(data));
    } else {
        addLogEntry("error", "Offline", `Cannot send ${data.type} - WS Closed`);
        handleRequestResponse(reqId, 'error');
    }
};

const generatePayloadAdmin = (data, revertCallback = null) => {
    const reqId = Math.floor(1000 + Math.random() * 9000);
    data.reqId = reqId;

    const timer = setTimeout(() => {
        handleRequestResponse(reqId, 'timeout');
    }, REQUEST_TIMEOUT);

    pendingRequests[reqId] = {
        type: data.type,
        timer: timer,
        revert: revertCallback
    };

    if (webSocket1 && webSocket1.readyState === WebSocket.OPEN) {
        webSocket1.send(JSON.stringify(data));
        console.log('OUTGOING :' + JSON.stringify(data));
    } else {
        addLogEntry("error", "Offline", `Cannot send ${data.type} - WS Closed`);
        handleRequestResponse(reqId, 'error');
    }
};

function handleRequestResponse(requestId, status, msg) {
    const request = pendingRequests[requestId];
    if (!request) return;

    clearTimeout(request.timer);
    const time = new Date().toLocaleTimeString();
    if (status === 'ack') {
        if (typeof msg === 'string' && msg.length > 3) {
            addLogEntry("info", "Ack", `${request.type} :${msg}:${time}`);
        }
    }
    else if (status === 'ncak') {
        addLogEntry("error", "Nack", `${request.type} :${msg}:${time}`);
    } else {
        const reason = status === 'timeout' ? "Timeout: No response" : "Server Error";
        addLogEntry("error", "Request Failed", `${reason} for ${request.type}:${msg} `);
        if (typeof request.revert === 'function') {
            request.revert();
        }
    }
    delete pendingRequests[requestId];
}
