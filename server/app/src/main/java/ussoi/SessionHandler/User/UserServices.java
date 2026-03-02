package ussoi.SessionHandler.User;

import com.fasterxml.jackson.databind.JsonNode;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Registry.DeviceSessionRegistry;
import ussoi.SessionHandler.User.Room.RoomHandler;

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
    private final RoomHandler roomHandler;
    private final DeviceSessionRegistry deviceSessionRegistry;

    public UserServices(){
        roomHandler = new RoomHandler();
        deviceSessionRegistry = new DeviceSessionRegistry();
    }

    //  Room Related Methods
    public boolean addRoom(String id, String name, String password) {
        return roomHandler.addRoom(id, name, password);
    }
    public boolean removeRoom(String id) {
        return roomHandler.removeRoom(id);
    }
    public JsonNode getRoomsJson() {
        return roomHandler.getRoomsJson();
    }
    public boolean validateRoomExistanceAndPwd(String roomId, String roomPwd) {
        return roomHandler.validateRoomExistanceAndPwd(roomId,roomPwd);
    }

    // Device Related Methods
    public boolean addDeviceTODeviceSessionRegistry(String roomId, String roomName, String deviceId){
        return deviceSessionRegistry.addDeviceTODeviceSessionRegistry(roomId,roomName,deviceId);
    }
    public boolean removeDeviceFromDeviceSessionRegistry(String deviceId){
        return  deviceSessionRegistry.removeDeviceFromDeviceSessionRegistry(deviceId);
    }
    public boolean isDeviceInDeviceSessionRegistry(String deviceId){
        return deviceSessionRegistry.isDeviceInDeviceSessionRegistry(deviceId);
    }
    public DeviceSession getDeviceSession(String deviceId) {
        return deviceSessionRegistry.getDeviceSession(deviceId);
    }

    public JsonNode getAllDevices() {
        return deviceSessionRegistry.getAllDevices();
    }

}
