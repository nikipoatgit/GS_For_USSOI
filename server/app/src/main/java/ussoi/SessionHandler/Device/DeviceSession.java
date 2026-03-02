package ussoi.SessionHandler.Device;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import ussoi.SessionHandler.User.RolePolicy.Role;
import ussoi.WebSocket.Registry.ControlWebSocketRegistry;

import static ussoi.Utility.utilityMethods.parseJsonFromBody;

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
public class DeviceSession extends DeviceServices {

    private final ControlWebSocketRegistry controlWebSocketRegistry;

    public DeviceSession(String roomId, String roomName, String deviceId) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.deviceId = deviceId;
        controlWebSocketRegistry = new ControlWebSocketRegistry();
    }

    // assuming user Exist in db
    public void addUserToUserWsRegistry(String userId, Channel channel, Role role){
        controlWebSocketRegistry.registerUser(userId,channel,role);
    }

    public boolean checkIfUserExist(String userId){
        return controlWebSocketRegistry.checkIfUserExist(userId);
    }

    // assuming user has done this checkIfDevicerExist
    public void addDeviceToDeviceWs(Channel channel){
        controlWebSocketRegistry.registerDevice(channel);
    }

    public void processIncomingDeviceMessage( ByteBuf message){
        JsonNode msg = parseJsonFromBody(message);
        if (msg == null) {
            return;
        }
        int impact = msg.path("impact").asInt(-1);

        if (impact == -1) return;

        switch (impact) {
            case 0:
                processDeviceMessage(msg);
                break;

            case 1:
                controlWebSocketRegistry.broadcastToAdmins(msg);
                break;

            case 2:
                controlWebSocketRegistry.broadcastToOperators(msg);
                break;

            case 3:
                controlWebSocketRegistry.broadcastToViewers(msg);
                break;

            case 4:
                controlWebSocketRegistry.broadcastToAll(msg);
                processDeviceMessage(msg);
                break;

            default:
                break;
        }
    }
    private void processDeviceMessage(JsonNode msg){
        String type = msg.path("type").asText(null);
        if (type == null) return;

        switch (type){
            case "info":
                 deviceDetails= msg.get("data").asText("none");
                break;

            case "telem":
//                logTelemetry(msg.get("data"));
                break;

            default:
                break;
        }
    }

}
