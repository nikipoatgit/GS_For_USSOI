package ussoi.SessionHandler.Registry;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import ussoi.SessionHandler.Device.DeviceSession;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DeviceSessionRegistry.java
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
public class DeviceSessionRegistry {
    private final Map<String, DeviceSession> deviceMap = new ConcurrentHashMap<>();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public DeviceSessionRegistry(){
    }

    public boolean addDeviceTODeviceSessionRegistry(String token,String roomId, String roomName, String deviceId){
        return deviceMap.putIfAbsent(token, new DeviceSession( roomId,  roomName,  deviceId)) == null;
    }
    public boolean removeDeviceFromDeviceSessionRegistry(String token){
        return  deviceMap.remove(token) != null;
    }
    public boolean isDeviceInDeviceSessionRegistry(String token){
        return deviceMap.containsKey(token);
    }
    public DeviceSession getDevice(String token) {
        return deviceMap.get(token);
    }
    public JsonNode getAllDevices() {
        ArrayNode array = MAPPER.createArrayNode();
        for (DeviceSession session : deviceMap.values()) {
            array.add(session.getDeviceRoom());
        }
        return array;
    }
}
