package ussoi.SessionHandler.User.Room;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file RoomHandler.java
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
public class RoomHandler   {
    private final Map<String, RoomBody> rooms = new ConcurrentHashMap<>();
    private final ObjectMapper MAPPER = new ObjectMapper();

    public boolean addRoom(String id, String name, String password) {
        return rooms.putIfAbsent(id, new RoomBody(id, name, password)) == null;
    }

    public boolean removeRoom(String id) {
        return rooms.remove(id) != null;
    }

    public JsonNode getRoomsJson() {
        Collection<RoomBody> roomList = rooms.values();

        ArrayNode array = MAPPER.createArrayNode();

        for (RoomBody room : roomList) {
            array.add(MAPPER.createObjectNode().put("roomId", room.roomId()).put("roomName", room.roomName()));
        }

        return array;
    }
    public boolean validateRoomExistanceAndPwd(String roomId, String roomPwd) {

        if (roomId == null || roomPwd == null) {
            return false;
        }
        RoomBody room = rooms.get(roomId);

        if (room == null) {
            return false;
        }
        return room.roomPassword().equals(roomPwd);
    }
}
