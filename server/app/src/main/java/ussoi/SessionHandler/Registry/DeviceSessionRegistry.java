package ussoi.SessionHandler.Registry;

import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.Utility.SessionRegistry;

import java.util.Collections;
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
public class DeviceSessionRegistry implements SessionRegistry<String, DeviceSession> {

    private final Map<String, DeviceSession> deviceMap = new ConcurrentHashMap<>();

    @Override
    public boolean register(String deviceId, DeviceSession session) {
        return deviceMap.putIfAbsent(deviceId, session) == null;
    }

    @Override
    public boolean unregister(String deviceId) {
        return deviceMap.remove(deviceId) != null;
    }

    @Override
    public boolean isRegistered(String deviceId) {
        return deviceMap.containsKey(deviceId);
    }

    @Override
    public DeviceSession getSession(String deviceId) {
        return deviceMap.get(deviceId);
    }

    @Override
    public Map<String, DeviceSession> getAll() {
        return Collections.unmodifiableMap(deviceMap);
    }

    @Override
    public int registrySize() {
        return deviceMap.size();
    }
}
