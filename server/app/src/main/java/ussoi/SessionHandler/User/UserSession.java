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
 * @file UserSession.java
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
public class UserSession{
    private final RoomSessionRegistry roomSessionRegistry;

    public UserSession(){
        roomSessionRegistry = new RoomSessionRegistry();
        roomSessionRegistry.register("100", new RoomSession("100","nina","100"));
    }

    public boolean addRoom(String roomId, String roomName, String roomPassword) {
        // if key room exist return false
        return roomSessionRegistry.register(roomId, new RoomSession(roomId,roomName,roomPassword));
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
    public Boolean addDeviceToRoom(String roomId , String deviceId,String deviceName){
        RoomSession room = roomSessionRegistry.getSession(roomId);
        if (room != null){
            room.addDevice(deviceId,deviceName);
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

    public JsonNode getWsDetails() {
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode roomsArray = mapper.createArrayNode();

        for (RoomSession roomSession : roomSessionRegistry.getAll().values()) {
            roomsArray.add(roomSession.getRoomWsDetails());
        }

        return roomsArray;
    }

}
