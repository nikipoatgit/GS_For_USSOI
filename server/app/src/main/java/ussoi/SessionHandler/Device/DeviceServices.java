package ussoi.SessionHandler.Device;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DeviceInfo.java
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
public class DeviceServices  {
    protected String roomId;
    protected String roomName;
    protected String deviceId;
    protected String deviceDetails;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public JsonNode getDeviceRoom() {
        ObjectNode node = MAPPER.createObjectNode();

        node.put("roomId", roomId);
        node.put("roomName", roomName);
        node.put("deviceId", deviceId);

        return node;
    }

}
