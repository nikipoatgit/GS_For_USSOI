package ussoi.SessionHandler.Device;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import ussoi.Utility.Role;
import ussoi.WebSocket.Registry.ControlRegistry;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static ussoi.Security.AuthenticationService.AuthService.buildControlUsers;
import static ussoi.Storage.DB.Database.getConnection;
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
public class DeviceSession {
    public final String deviceId;
    public volatile String deviceName;
    protected String deviceDetails;

    private final ControlRegistry controlWebSocketRegistry;

    public DeviceSession(String deviceId) {
        this.deviceId = deviceId;
        controlWebSocketRegistry = new ControlRegistry();
    }

    public boolean deviceStatus(){
        controlWebSocketRegistry.isDeviceConnected();
    }

    // assuming user Exist in db
    public void addUser(String userId, Channel channel, Role role){
        controlWebSocketRegistry.registerUser(userId,channel,role);
    }

    public boolean checkIfUserExistInWsRegistry(String userId){
        return controlWebSocketRegistry.checkIfUserExist(userId);
    }

    // assuming user has done this checkIfDevicerExist
    public void addDevice(Channel channel){
        controlWebSocketRegistry.registerDevice(channel);
    }

    public void processIncomingDeviceMessage( ByteBuf message){
        JsonNode msg = parseJsonFromBody(message);
        if (msg == null) {
            return;
        }
        int impact = msg.path("impact").asInt(-1);

        if (impact == -1) return;

        // TODO CLEANup
        switch (impact) {
            case 0:
                System.out.println("processDeviceMessage");
                processDeviceMessage(msg);
                break;

            case 1:
                System.out.println("broadcastToAdmins");
                controlWebSocketRegistry.broadcastToAdmins(msg);
                break;

            case 2:
                System.out.println("broadcastToOperators");
                controlWebSocketRegistry.broadcastToOperators(msg);
                break;

            case 3:
                System.out.println("broadcastToViewers");
                controlWebSocketRegistry.broadcastToViewers(msg);
                break;

            case 4:
                System.out.println("broadcastToViewers+processDeviceMessage");
                controlWebSocketRegistry.broadcastToAll(msg);
                processDeviceMessage(msg);
                break;

            default:
                System.out.println(" issue ");
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

    public JsonNode getControlWsDetails() {

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode root = mapper.createObjectNode();

        root.put("d_id", deviceId);
        root.put("d_name", deviceName);

        ObjectNode control = buildControlUsers((ArrayNode) controlWebSocketRegistry.getControlState(),controlWebSocketRegistry.isDeviceConnected());

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

}
