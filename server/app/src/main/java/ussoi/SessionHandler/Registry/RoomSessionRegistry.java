package ussoi.SessionHandler.Registry;

import ussoi.SessionHandler.Room.RoomSession;
import ussoi.Utility.SessionRegistry;

import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file RoomSessionRegistry.java
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
public class RoomSessionRegistry implements SessionRegistry<String, RoomSession> {

    private final Map<String, RoomSession> roomMap = new ConcurrentHashMap<>();

    @Override
    public boolean register(String roomId, RoomSession session) {
        return roomMap.putIfAbsent(roomId, session) == null;
    }

    @Override
    public boolean unregister(String roomId) {
        return roomMap.remove(roomId) != null;
    }

    @Override
    public boolean isRegistered(String roomId) {
        return roomMap.containsKey(roomId);
    }

    @Override
    public RoomSession getSession(String roomId) {
        return roomMap.get(roomId);
    }

    @Override
    public Map<String, RoomSession> getAll() {
        return Collections.unmodifiableMap(roomMap);
    }

    @Override
    public int registrySize() {
        return roomMap.size();
    }

}
