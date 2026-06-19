package ussoi.SessionHandler.Device;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DeviceDataCache.java
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
public class DeviceDataCache {
    // Device state
    public JsonNode params;
    // tunnels
    public JsonNode tunnels;
    // camera resolution
    public JsonNode resolution;
    public JsonNode identity;
}
