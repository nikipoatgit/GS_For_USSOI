package ussoi.WebApp.DevicePage;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelHandlerContext;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.Utility.Role;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static ussoi.UssoiStrings.*;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file UserCommandRouter.java
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
public class UserCommandRouter {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final Set<Role> PRIVILEGED_ROLES = EnumSet.of(Role.ADMIN, Role.OPERATOR);

    // Commands  to ADMIN / OPERATOR only.
    private static final String[] PRIVILEGED_COMMANDS = { START_STREAM, STOP_STREAM, START_RECORDING, STOP_RECORDING, START_TUNNEL, STOP_TUNNEL, SWITCH, SET_PARAMS, SET_STREAM_RES, SET_RECORD_RES, WEBRTC_SDP };

    // public Commands
    private static final String[] PUBLIC_COMMANDS = { PLAY, PAUSE, ROTATE, MUTE, FLIP, WEBRTC_SDP, WEBRTC_ICE };

    private final Map<String, CommandHandler> commandMap;
    private final DeviceSession deviceSession;

    public UserCommandRouter(DeviceSession deviceSession, Role userRole) {
        this.deviceSession = deviceSession;
        this.commandMap    = buildCommandMap(userRole);
    }


    public void route(ChannelHandlerContext ctx, String rawJson) {
        JsonNode json = parseJson(ctx, rawJson);
        if (json == null) return;

        String cmd = json.path(CMD).asText("");
        String cmdId = json.path(CMD_ID).asText("");

        CommandHandler handler = commandMap.get(cmd);
        if (handler == null) {
            deviceSession.sendError(cmd,cmdId,"unknown_or_unauthorized_command");
            return;
        }

        handler.handle(json);
    }

    // TODO I was testing this then i forgot
    // Cheap cmd extraction before full parse
    private static String extractCmd(String rawJson) {
        try {
            // Jackson's streaming API — no full tree allocation
            try (var parser = MAPPER.createParser(rawJson)) {
                while (parser.nextToken() != null) {
                    if ("cmd".equals(parser.currentName())) {
                        parser.nextToken();
                        return parser.getText();
                    }
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private Map<String, CommandHandler> buildCommandMap(Role userRole) {
        Map<String, CommandHandler> map = new java.util.HashMap<>();

        // Role commands
        if (PRIVILEGED_ROLES.contains(userRole)) {
            for (String cmd : PRIVILEGED_COMMANDS) {
                map.put(cmd, deviceSession::processUserMessage);
            }
        }

        // Public commands
        for (String cmd : PUBLIC_COMMANDS) {
            map.put(cmd, deviceSession::processUserMessage);
        }

        // Commands with dedicated handlers ( cache )
        map.put(GET_TUNNELS, deviceSession::handleGetTunnels);
        map.put(GET_RES,     deviceSession::handleGetRes);
        map.put(GET_PARAMS,  deviceSession::handleGetParams);

        return Map.copyOf(map); // immutable after construction
    }

    private JsonNode parseJson(ChannelHandlerContext ctx, String rawJson) {
        try {
            return MAPPER.readTree(rawJson);
        } catch (Exception e) {
            WsResponseHelper.sendNack(ctx, "unknown", "invalid_json");
            return null;
        }
    }

    @FunctionalInterface
    public interface CommandHandler {
        void handle(JsonNode json);
    }
}