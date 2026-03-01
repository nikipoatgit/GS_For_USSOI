package ussoi.Security.AuthorizationService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file AckAndNack.java
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
public class AckAndNack {
    public enum AckStatus {
        ACK,
        NACK
    }
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private AckAndNack() {}

    public static JsonNode buildAckStatus(AckStatus status,
                                 String type,
                                 String message,
                                          String reqId) {

        ObjectNode root = MAPPER.createObjectNode();

        root.put("reqId", reqId);
        root.put("status", status.name());   // ACK / NACK
        root.put("type", type);
        root.put("message", message);

        return root;
    }
}
