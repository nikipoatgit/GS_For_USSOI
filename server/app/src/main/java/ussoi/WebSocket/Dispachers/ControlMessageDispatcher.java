package ussoi.WebSocket.Dispachers;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file ControlMessageDispatcher.java
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
public interface ControlMessageDispatcher {
    public void broadcastToAdmins(JsonNode frame);
    public void broadcastToOperators(JsonNode frame);
    public void broadcastToViewers(JsonNode frame);
    public void broadcastToAll(JsonNode frame);

}
