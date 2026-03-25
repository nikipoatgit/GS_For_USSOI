package ussoi.WebApp.AdminPage.Services;

import com.fasterxml.jackson.databind.JsonNode;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.SessionHandler.User.UserSession;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DeviceServices.java
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
public class DeviceServices {
    public JsonNode getDevice() {
         UserSession userSession =  UserSessionRegistry.getInstance().getUserSession();
         return userSession.getAllDeviceDetails();
    }
}
