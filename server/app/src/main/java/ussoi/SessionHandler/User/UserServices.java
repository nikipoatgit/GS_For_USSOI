package ussoi.SessionHandler.User;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Registry.RoomSessionRegistry;
import ussoi.SessionHandler.Room.RoomSession;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file UserServices.java
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
public class UserServices {

    private final RoomSessionRegistry roomSessionRegistry;

    public UserServices(){
        roomSessionRegistry = new RoomSessionRegistry();
    }

    public boolean addRoom(String id, String name, String password) {
        return roomSessionRegistry.register(id, new RoomSession(id,name,password));
    }

    public boolean removeRoom(String id) {
        return roomSessionRegistry.unregister(id);
    }

    public JsonNode getRoomDetails() {
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode array = mapper.createArrayNode();

        for (RoomSession room : roomSessionRegistry.getAll().values()) {
            ObjectNode node = mapper.createObjectNode();
            node.put("roomId", room.RoomId);
            node.put("roomName", room.RoomName);
            array.add(node);
        }
        return array;
    }
    public JsonNode getAllDeviceDetails(){
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode array = mapper.createArrayNode();

        for (RoomSession room : roomSessionRegistry.getAll().values()) {
            ObjectNode node = mapper.createObjectNode();
            node.put("roomId", room.RoomId);
            node.put("roomName", room.RoomName);
            node.set("devices",room.getDevices());
            array.add(node);
        }
        return array;
    }

    // note we dont validate RoomId and pass
    public Boolean addDeviceToRoom(String roomId , String deviceId){
        RoomSession room = roomSessionRegistry.getSession(roomId);
        if (room != null){
            room.addDevice(deviceId);
            return true;
        }
        return false;
    }

    public RoomSession getRoomSession(String roomId){
        return roomSessionRegistry.getSession(roomId);
    }

    public DeviceSession getDeviceSession(String deviceId){
        for (RoomSession room : roomSessionRegistry.getAll().values()) {
            DeviceSession session = room.getDeviceSession(deviceId);
            if (session != null) return session;
        }
        return null;
    }

    public boolean validateRoomExistenceAndPwd(String roomId, String roomPwd) {
        RoomSession room =  roomSessionRegistry.getSession(roomId);
        if (room != null){
            return room.validatePassword(roomPwd);
        }
        return false;
    }
}
