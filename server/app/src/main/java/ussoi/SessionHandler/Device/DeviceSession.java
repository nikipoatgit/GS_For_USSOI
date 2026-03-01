package ussoi.SessionHandler.Device;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

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
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String roomId;
    private final String roomName;
    private final String deviceId;

    public DeviceSession(String roomId, String roomName, String deviceId) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.deviceId = deviceId;
    }

    public JsonNode getDeviceRoom() {
        ObjectNode node = MAPPER.createObjectNode();

        node.put("roomId", roomId);
        node.put("roomName", roomName);
        node.put("deviceId", deviceId);

        return node;
    }

}
