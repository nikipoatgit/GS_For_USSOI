package ussoi.SessionHandler.User;

import ussoi.SessionHandler.Registry.DeviceSessionRegistry;
import ussoi.SessionHandler.User.Room.RoomHandler;

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
public class UserSession {
    private final RoomHandler roomHandler;
    private final DeviceSessionRegistry deviceSessionRegistry;

    public UserSession(){
        roomHandler = new RoomHandler();
        deviceSessionRegistry = new DeviceSessionRegistry();
    }
    public RoomHandler getRoomHandler() {
        return roomHandler;
    }
    public DeviceSessionRegistry getDeviceSessionRegistry() {
        return deviceSessionRegistry;
    }


}
