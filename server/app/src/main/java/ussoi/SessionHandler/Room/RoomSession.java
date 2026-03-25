package ussoi.SessionHandler.Room;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Registry.DeviceSessionRegistry;

import java.util.Objects;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file RoomSession.java
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
public class RoomSession {
    public final String RoomName;
    private final String RoomPwd;
    public final String RoomId;

    private final DeviceSessionRegistry deviceSessionRegistry;

    public RoomSession(String RoomId,String RoomName, String RoomPwd) {
        this.RoomId = RoomId;
        this.RoomName = RoomName;
        this.RoomPwd = RoomPwd;
        deviceSessionRegistry = new DeviceSessionRegistry();
    }

    // handles Null case also
    public boolean validatePassword(String roomPwd){
        return Objects.equals(this.RoomPwd, roomPwd);
    }

    // Device Related Methods
    public void addDevice(String deviceId, String deviceName){
        deviceSessionRegistry.register(deviceId, new DeviceSession(deviceId,deviceName));
    }
    public boolean removeDevice(String deviceId){
        return  deviceSessionRegistry.unregister(deviceId);
    }
    public DeviceSession getDeviceSession(String deviceId) {
        return deviceSessionRegistry.getSession(deviceId);
    }
    public JsonNode getDevices() {
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode array = mapper.createArrayNode();

        for (DeviceSession device: deviceSessionRegistry.getAll().values()){
            ObjectNode node = mapper.createObjectNode();
            node.put("d_Name", device.deviceName);
            node.put("d_Id", device.deviceId);
            node.put("d_Stat", device.deviceStatus());
            array.add(node);
        }

        return array;
    }

    public JsonNode getRoomWsDetails() {

        ObjectMapper mapper = new ObjectMapper();

        ObjectNode roomNode = mapper.createObjectNode();
        ArrayNode devicesArray = mapper.createArrayNode();

        roomNode.put("r_id", RoomId);
        roomNode.put("r_name", RoomName);

        for (DeviceSession device : deviceSessionRegistry.getAll().values()) {
            devicesArray.add(device.getControlWsDetails());
        }

        roomNode.set("devices", devicesArray);

        return roomNode;
    }
}
