package ussoi.SessionHandler.Device;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.channel.Channel;
import ussoi.Utility.Role;
import ussoi.WebApp.DevicePage.UserCommandRouter;
import ussoi.WebSocket.Registry.ControlRegistry;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static ussoi.Security.AuthenticationService.AuthService.buildControlUsers;
import static ussoi.UssoiStrings.*;
import static ussoi.Utility.utilityMethods.parseJsonFromTextBody;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file ClientSession.java
 * @attention Copyright (c) 2026
 * All rights reserved.
 * <p>
 * This software is licensed under the terms described in the LICENSE file
 * located in the root directory of this project.
 * If no LICENSE file is present, this software is provided "AS IS",
 * without warranty of any kind, express or implied.
 * <p>
 * *****************************************************************************
 */
public class DeviceSession {
    public final String deviceId;
    public final String deviceName ;
    private UserUIState userUIState = null;
    private ControlRegistry controlWSRegistry ;
    private final ObjectMapper mapper = new ObjectMapper();
    private final int timeoutMs = 6_000;

    private final Map<String, UserCommandRouter.CommandHandler> commandMap = new HashMap<>();
    public  Map<String, PendingCommand> pending = new ConcurrentHashMap<>();

    private static final ScheduledExecutorService scheduler =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "pending-timeout");
                t.setDaemon(true);
                return t;
            });

    public DeviceSession(String deviceId, String deviceName) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.userUIState = new UserUIState();

        controlWSRegistry = new ControlRegistry(this);


        // Stream
        commandMap.put("start_stream",    processStartStream);
        commandMap.put("stop_stream",     processStopStream);

        // Recording
        commandMap.put("start_recording", processStartRecording);
        commandMap.put("stop_recording",  processStopRecording);

        // Tunnel
        commandMap.put("start_tunnel",    processStartTunnel);
        commandMap.put("stop_tunnel",     processStopTunnel);

        // camera
        commandMap.put("switch",          processSwitch);

        //params
        commandMap.put("set_params",      processSetParams);

        // Tunnel
        commandMap.put("get_tunnels",     processGetTunnels);

        // Resolution
        commandMap.put("set_stream_res",  processSetStreamRes);
        commandMap.put("get_stream_res",  processGetStreamRes);
        commandMap.put("set_record_res",  processSetRecordRes);
        commandMap.put("get_record_res",  processGetRecordRes);
        commandMap.put("get_res",         processGetRes);

        // Playback / stream controls
        commandMap.put("play",            processPlay);
        commandMap.put("pause",           processPause);
        commandMap.put("rotate",          processRotate);
        commandMap.put("mute",            processMute);
        commandMap.put("flip",            processFlip);


        // Params
        commandMap.put("get_params",      processGetParams);

        // WebRTC
        commandMap.put("webrtc_offer",    processWebrtcAnswer);
        commandMap.put("webrtc_ice",      processWebrtcIce);

    }

    public boolean deviceStatus(){
        return controlWSRegistry.isDeviceConnected();
    }

    public void updateLastSeen() {
        controlWSRegistry.updateLastSeen();
    }



    // assuming user Exist in db
    public void addUser(String userId, Channel channel, Role role){
        controlWSRegistry.registerUser(userId,channel,role);
    }

    public boolean checkIfUserExistInWsRegistry(String userId){
        return controlWSRegistry.checkIfUserExist(userId);
    }

    // assuming user has done this checkIfDevicerExist
    public void addDevice(Channel channel){
        controlWSRegistry.registerDevice(channel);
    }



    public void processDeviceMessage(String message) {
        System.out.println(message);
        JsonNode msg;

        try {
            msg = parseJsonFromTextBody(message);
            if (msg == null) return;
        } catch (JsonProcessingException e) {
            return;
        }

        String cmdId = msg.path("cmdId").asText("");
        String cmd   = msg.path("cmd").asText("");

        if (cmd.equals("telem")){
            controlWSRegistry.broadcastToAll(msg);
            return;
        }

        PendingCommand pendingCommand = pending.remove(cmdId);
        if (pendingCommand == null) {
            sendNack(cmd, UNKNOWN_CMD_TIMEOUT);
            return;
        }

        UserCommandRouter.CommandHandler handler = commandMap.get(cmd);
        if (handler == null) {
            sendNack(cmd, UNKNOWN_REQUEST_FORM_DEVICE);
            return;
        }
        handler.handle(msg);
    }


    // TODO Add other ws details
    public JsonNode getControlWsDetails() {

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode root = mapper.createObjectNode();

        root.put("d_id", deviceId);
        root.put("d_name", deviceName);

        ObjectNode control = buildControlUsers((ArrayNode) controlWSRegistry.getControlState(), controlWSRegistry.isDeviceConnected());

        root.set("control", control);

        // dummy stream
        ObjectNode stream = mapper.createObjectNode();
        ArrayNode streamUsers = mapper.createArrayNode();
        streamUsers.add(mapper.createObjectNode().put("uid", "dummy1").put("uname", "dummy1"));
        streamUsers.add(mapper.createObjectNode().put("uid", "dummy2").put("uname", "dummy2"));

        stream.set("users", streamUsers);
        stream.put("device", true);

        root.set("stream", stream);

        // dummy data
        ArrayNode data = mapper.createArrayNode();

        data.add(mapper.createObjectNode().put("uid", "dummy1").put("uname", "dummy1"));
        data.add(mapper.createObjectNode().put("uid", "dummy2").put("uname", "dummy2"));

        root.set("data", data);

        return root;
    }

    public void sendUiStateToALl(){
        ObjectNode root = mapper.createObjectNode();

        root.put("type", "ui_state");
        root.put("timestamp", System.currentTimeMillis());

        ObjectNode payload = mapper.createObjectNode();

        ObjectNode actions = mapper.createObjectNode();
        actions.put("stream", userUIState.streamState.name());
        actions.put("record", userUIState.recordState.name());
        payload.set("actions", actions);

        ObjectNode tunnels = mapper.createObjectNode();
        userUIState.tunnelStates.forEach((name, state) -> tunnels.put(name, state.name()));
        payload.set("tunnels", tunnels);

        root.set("payload", payload);

        controlWSRegistry.broadcastToAll(root);
    }

    public void sendNack(String cmd,String msg){
        ObjectNode root = mapper.createObjectNode();

        root.put("type", NACK);
        root.put("cmd",   cmd  != null ? cmd  : "");
        root.put("error", msg);

        controlWSRegistry.broadcastToAll(root);
    }

    private void sendAck(String cmd) {
        ObjectNode root = mapper.createObjectNode();
        root.put("type",   ACK);
        root.put("cmd",    cmd);
        root.put("status", "ok");
        controlWSRegistry.broadcastToAll(root);
    }

    private void enqueueAndSend(String cmdId, String cmd, JsonNode node, long timeoutMs) {
        pending.put(cmdId, new PendingCommand(cmdId, cmd));
        scheduleTimeout(cmdId, timeoutMs);
//      TODO   if (!controlWSRegistry.isDeviceConnected() || !controlWSRegistry.sendToDevice(node)) {
        if (!controlWSRegistry.sendToDevice(node)) {
            pending.remove(cmdId);
            sendNack(cmd, DEVICE_OFFLINE);
        }
    }

    private void scheduleTimeout(String cmdId, long delayMs) {
        scheduler.schedule(() -> {
            PendingCommand expired = pending.remove(cmdId);
            if (expired != null) {
                sendNack(expired.cmd, CMD_TIMEOUT);
            }
        }, delayMs, TimeUnit.MILLISECONDS);
    }

    
    public void handleStartStream(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        userUIState.streamState = ActionState.PROCESSING;
        sendUiStateToALl();
        enqueueAndSend(cmdId, cmd, node, timeoutMs);
    }

    public void handleStopStream(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        userUIState.streamState = ActionState.PROCESSING;
        sendUiStateToALl();
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleStartRecording(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        userUIState.recordState = ActionState.PROCESSING;
        sendUiStateToALl();
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleStopRecording(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        userUIState.recordState = ActionState.PROCESSING;
        sendUiStateToALl();
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleStartTunnel(JsonNode node) {
        String cmd    = node.path("cmd").asText("");
        String cmdId  = node.path("cmdId").asText("");
        String tunnelName = node.path("tunnelName").asText("");

        if (!userUIState.tunnelStates.containsKey(tunnelName)) {
            sendNack(cmd, TUNNEL_INVALID);
            return;
        }

        userUIState.tunnelStates.put(tunnelName, ActionState.PROCESSING);
        sendUiStateToALl();
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleStopTunnel(JsonNode node) {
        String cmd    = node.path("cmd").asText("");
        String cmdId  = node.path("cmdId").asText("");
        String tunnelName = node.path("tunnelName").asText("");

        if (!userUIState.tunnelStates.containsKey(tunnelName)) {
            sendNack(cmd, TUNNEL_INVALID);
            return;
        }

        userUIState.tunnelStates.put(tunnelName, ActionState.PROCESSING);
        sendUiStateToALl();
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleSwitch(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleSetParams(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        enqueueAndSend(cmdId, cmd, node, timeoutMs);
    }

    public void handleGetParams(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleGetTunnels(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleSetStreamRes(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleGetStreamRes(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleSetRecordRes(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleGetRecordRes(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleGetRes(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handlePlay(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handlePause(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleRotate(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleMute(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleFlip(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, timeoutMs 
);
    }

    public void handleWebrtcOffer(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, 10_000);   // WebRTC negotiation gets more time
    }

    public void handleWebrtcIce(JsonNode node) {
        String cmd   = node.path("cmd").asText("");
        String cmdId = node.path("cmdId").asText("");
        if (!userUIState.paramsSet) { sendNack(cmd, PARAMS_NOT_SET); return; }
        enqueueAndSend(cmdId, cmd, node, 10_000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ── Device → App ACK/NACK handlers  (entries in commandMap)
    // ─────────────────────────────────────────────────────────────────────────

    // Stream ──────────────────────────────────────────────────────────────────

    private UserCommandRouter.CommandHandler processStartStream = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("start_stream");
        if (type.equals(ACK)) {
            userUIState.streamState = ActionState.ACTIVE;
            sendUiStateToALl();
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            userUIState.streamState = ActionState.IDLE;
            sendUiStateToALl();
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private  UserCommandRouter.CommandHandler processStopStream = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("stop_stream");
        if (type.equals(ACK)) {
            userUIState.streamState = ActionState.IDLE;
            sendUiStateToALl();
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            userUIState.streamState = ActionState.ACTIVE;   // roll back
            sendUiStateToALl();
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    // Recording ───────────────────────────────────────────────────────────────

    private  UserCommandRouter.CommandHandler processStartRecording = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("start_recording");
        if (type.equals(ACK)) {
            userUIState.recordState = ActionState.ACTIVE;
            sendUiStateToALl();
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            userUIState.recordState = ActionState.IDLE;
            sendUiStateToALl();
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private  UserCommandRouter.CommandHandler processStopRecording = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("stop_recording");
        if (type.equals(ACK)) {
            userUIState.recordState = ActionState.IDLE;
            sendUiStateToALl();
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            userUIState.recordState = ActionState.ACTIVE;
            sendUiStateToALl();
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    // Tunnel ──────────────────────────────────────────────────────────────────

    private UserCommandRouter.CommandHandler processStartTunnel = msg -> {
        String type   = msg.path("type").asText();
        String cmd    = msg.path("cmd").asText("start_tunnel");
        String tunnelName = msg.path("tunnelName").asText("");
        if (type.equals(ACK)) {
            if (userUIState.tunnelStates.containsKey(tunnelName)){
                userUIState.tunnelStates.put(tunnelName, ActionState.ACTIVE);
            }
            sendUiStateToALl();
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            if (userUIState.tunnelStates.containsKey(tunnelName)){
                userUIState.tunnelStates.put(tunnelName, ActionState.IDLE);
            }
            sendUiStateToALl();
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processStopTunnel = msg -> {
        String type   = msg.path("type").asText();
        String cmd    = msg.path("cmd").asText("stop_tunnel");
        String tunnelName = msg.path("tunnelName").asText("");
        if (type.equals(ACK)) {
            if (userUIState.tunnelStates.containsKey(tunnelName)){
                userUIState.tunnelStates.put(tunnelName, ActionState.IDLE);
            }
            sendUiStateToALl();
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            if (userUIState.tunnelStates.containsKey(tunnelName)){
                userUIState.tunnelStates.put(tunnelName, ActionState.ACTIVE);
            }
            sendUiStateToALl();
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    // Camera switch ───────────────────────────────────────────────────────────

    private UserCommandRouter.CommandHandler processSwitch = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("switch");
        if (type.equals(ACK)) {
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    // Params ──────────────────────────────────────────────────────────────────

    private UserCommandRouter.CommandHandler processSetParams = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("set_params");
        if (type.equals(ACK)) {
            userUIState.paramsSet = true;
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processGetParams = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("get_params");
        if (type.equals(ACK)) {
            controlWSRegistry.broadcastToAll(msg);

        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    // Tunnel list ─────────────────────────────────────────────────────────────

    private UserCommandRouter.CommandHandler processGetTunnels = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("get_tunnels");
        if (type.equals(ACK)) {
            controlWSRegistry.broadcastToAll(msg);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    // Resolution ──────────────────────────────────────────────────────────────

    private UserCommandRouter.CommandHandler processSetStreamRes = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("set_stream_res");
        if (type.equals(ACK)) {
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processGetStreamRes = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("get_stream_res");
        if (type.equals(ACK)) {
            controlWSRegistry.broadcastToAll(msg);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processSetRecordRes = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("set_record_res");
        if (type.equals(ACK)) {
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processGetRecordRes = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("get_record_res");
        if (type.equals(ACK)) {
            controlWSRegistry.broadcastToAll(msg);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processGetRes = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("get_res");
        if (type.equals(ACK)) {
            controlWSRegistry.broadcastToAll(msg);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    // Playback / stream controls ──────────────────────────────────────────────

    private UserCommandRouter.CommandHandler processPlay = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("play");
        if (type.equals(ACK)) {
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processPause = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("pause");
        if (type.equals(ACK)) {
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processRotate = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("rotate");
        if (type.equals(ACK)) {
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processMute = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("mute");
        if (type.equals(ACK)) {
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private UserCommandRouter.CommandHandler processFlip = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("flip");
        if (type.equals(ACK)) {
            sendAck(cmd);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    // WebRTC ──────────────────────────────────────────────────────────────────

    private  UserCommandRouter.CommandHandler processWebrtcAnswer = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("webrtc_answer");
        String UserId  = msg.path("userId").asText("webrtc_answer");
        if (type.equals(ACK)) {
            // only that specific user who requested sdp
            controlWSRegistry.sendToUser(UserId,msg);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    private  UserCommandRouter.CommandHandler processWebrtcIce = msg -> {
        String type = msg.path("type").asText();
        String cmd  = msg.path("cmd").asText("webrtc_ice");
        String UserId  = msg.path("userId").asText("webrtc_answer");
        if (type.equals(ACK)) {
            // only that specific user who requested ice
            controlWSRegistry.sendToUser(UserId,msg);
        } else if (type.equals(NACK)) {
            sendNack(cmd, msg.path("error").asText(DEVICE_ERROR));
        } else {
            sendNack(cmd, UNKNOWN_ACKNOWLEDGEMENT);
        }
    };

    public void UiState(JsonNode node) {
        sendUiStateToALl();
    }
}
