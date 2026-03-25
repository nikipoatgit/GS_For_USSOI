package ussoi.WebApp.AdminPage;

import com.fasterxml.jackson.databind.JsonNode;
import ussoi.WebApp.AdminPage.Services.DeviceServices;
import ussoi.WebApp.AdminPage.Services.UserServices;
import ussoi.WebApp.AdminPage.Services.WsServices;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file AdminComponents.java
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
public class AdminComponents {
    private final UserServices userServices;
    private final DeviceServices deviceServices;
    private final WsServices wsServices;

    public  AdminComponents(){
        userServices = new UserServices();
        deviceServices = new DeviceServices();
        wsServices = new WsServices();
    }

    public JsonNode handleUser(JsonNode req, String cmd) {

        return switch (cmd) {
            case "get" -> userServices.getUsers();
            case "add" -> userServices.addUser(req);
            case "delete" -> userServices.deleteUser(req);
            default -> null;
        };

    }

    public JsonNode handleDevice(JsonNode req, String cmd) {
        if (cmd.equals("get")) {
            return deviceServices.getDevice();
        }
        return null;
    }

    public JsonNode handleWs(JsonNode req, String cmd) {
        if (cmd.equals("get")) {
            return wsServices.getWS(req);
        }
        return null;
    }
}
