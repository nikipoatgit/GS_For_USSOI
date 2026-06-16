package ussoi.SessionHandler.Device;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import ussoi.Utility.Role;
import ussoi.WebApp.DevicePage.UserCommandRouter;
import ussoi.SessionHandler.Device.PoolRegistry.ControlRegistry;
import ussoi.SessionHandler.Device.PoolRegistry.StreamRegistry;

import java.util.HashMap;
import java.util.Map;

import static ussoi.Security.AuthenticationService.AuthService.buildObjectNode;
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
    private DeviceDataCache deviceDataCache = null;
    private final ControlRegistry controlWSRegistry ;
    private final StreamRegistry streamRegistry ;
    private final ObjectMapper mapper = new ObjectMapper();

    private final Map<String, UserCommandRouter.CommandHandler> commandMap = new HashMap<>();

    public DeviceSession(String deviceId, String deviceName) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.streamRegistry = new StreamRegistry();
        this.deviceDataCache = new DeviceDataCache();

        controlWSRegistry = new ControlRegistry(this);


        commandMap.put(TELEMETRY, this::logTelemetry);
        commandMap.put(GET_TUNNELS, this::processGetTunnels);
        commandMap.put(GET_RES, this::processGetRes);
        commandMap.put(GET_PARAMS, this::processGetParams);


    }

    void logTelemetry(JsonNode jsonNode){
        // todo add proper storage mechanism
    }

    void  processGetTunnels(JsonNode jsonNode){
        deviceDataCache.tunnels = jsonNode;
    }

    void  processGetRes(JsonNode jsonNode){
        deviceDataCache.resolution = jsonNode;
    }

    void  processGetParams(JsonNode jsonNode){
        deviceDataCache.params = jsonNode;
    }


    public boolean deviceStatus(){
        return controlWSRegistry.isDeviceConnected();
    }

    public void updateLastSeen() {
        controlWSRegistry.updateLastSeen();
    }



    // assuming user Exist in db
    public void addUserToControlPool(String userId, Channel channel, Role role){
        controlWSRegistry.registerUser(userId,channel,role);
    }

    // assuming user Exist in db
    public void addUserToStreamPool(String userId, Channel channel){
        streamRegistry.registerUser(userId,channel);
    }

    public void broadcastToStreamUserPool(ByteBuf buf) {
        streamRegistry.broadcastToUsers(buf);
    }

    public boolean checkIfUserExistInWsRegistry(String userId){
        return controlWSRegistry.checkIfUserExist(userId);
    }

    // assuming user has done this checkIfDeviceExist
    public void addDeviceToControlPool(Channel channel){
        controlWSRegistry.registerDevice(channel);
    }

    public void addDeviceToStreamPool(Channel channel){
        streamRegistry.registerDevice(channel);
    }

    public void processUserMessage(JsonNode jsonNode) {
        System.out.println("USER TO DEV :"+jsonNode);
        if (!controlWSRegistry.sendToDevice(jsonNode)){
            sendError(jsonNode.path(CMD).asText(""),jsonNode.path(CMD_ID).asText(""),DEVICE_OFFLINE);
        }
    }

    public void processDeviceMessage(String message) {
        JsonNode msg;
        try {
            msg = parseJsonFromTextBody(message);
            if (msg == null) return;
        } catch (JsonProcessingException e) {
            return;
        }

        System.out.println(msg);

        String cmd = msg.path(CMD).asText("");

        UserCommandRouter.CommandHandler handler = commandMap.get(cmd);
        if (handler != null) {
            // this saves / caches some cmds
            handler.handle(msg);
        }
        controlWSRegistry.broadcastToAll(msg);
    }

    // TODO Add other ws details
    public JsonNode getControlWsDetails() {

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode root = mapper.createObjectNode();

        root.put("d_id", deviceId);
        root.put("d_name", deviceName);

        ObjectNode controlJson = buildObjectNode((ArrayNode) controlWSRegistry.getControlState(), controlWSRegistry.isDeviceConnected());

        root.set("control", controlJson);

        // stream
        ObjectNode streamJson = buildObjectNode((ArrayNode) streamRegistry.getControlState(),streamRegistry.isDeviceConnected());
        root.set("stream", streamJson);

        //  data
        ObjectNode dataJson = buildObjectNode((ArrayNode) streamRegistry.getControlState(),true);
        root.set("data", dataJson);

        return root;
    }


    public void sendError(String cmd,String cmdId, String error){
        ObjectNode root = mapper.createObjectNode();

        root.put(TYPE, ERROR);
        root.put(CMD,   cmd  != null ? cmd  : "");
        root.put(CMD_ID,   cmdId  != null ? cmdId  : "");
        root.put(ERROR, error  != null ? error  : "");
        controlWSRegistry.broadcastToAll(root);
    }


    // if not in cache forward req to device
    public void handleGetTunnels(JsonNode jsonNode) {
        if (deviceDataCache.tunnels != null){
            controlWSRegistry.broadcastToAll(deviceDataCache.tunnels);
        }
        else {
            if (!controlWSRegistry.sendToDevice(jsonNode)){
                sendError(jsonNode.path(CMD).asText(""),jsonNode.path(CMD_ID).asText(""),DEVICE_OFFLINE);
            }
        }
    }
    public void handleGetRes(JsonNode jsonNode) {
        if (deviceDataCache.resolution != null){
            controlWSRegistry.broadcastToAll(deviceDataCache.resolution);
        }
        else {
            if (!controlWSRegistry.sendToDevice(jsonNode)){
                sendError(jsonNode.path(CMD).asText(""),jsonNode.path(CMD_ID).asText(""),DEVICE_OFFLINE);
            }
        }
    }
    public void handleGetParams(JsonNode jsonNode) {
        if (deviceDataCache.params != null){
            controlWSRegistry.broadcastToAll(deviceDataCache.params);
        }
        else {
            if (!controlWSRegistry.sendToDevice(jsonNode)){
                sendError(jsonNode.path(CMD).asText(""),jsonNode.path(CMD_ID).asText(""),DEVICE_OFFLINE);
            }
        }
    }


}
