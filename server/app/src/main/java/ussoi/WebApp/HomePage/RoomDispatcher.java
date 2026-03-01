package ussoi.WebApp.HomePage;

import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import ussoi.Security.AuthenticationService.HttpResponseUtil;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.WebApp.HomePage.RoomDispatcherMethods.AddRoom;
import ussoi.WebApp.HomePage.RoomDispatcherMethods.GetRooms;
import ussoi.WebApp.HomePage.RoomDispatcherMethods.RemoveRoom;
import ussoi.WebApp.HomePage.RoomDispatcherMethods.RoomIntent;

import java.util.Map;

import static ussoi.utilityMethods.parseJsonFromBody;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file handleRooms.java
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

//        "type": "room",
//        "reqId": 4516,
//        "intent": "addRoom",
public class RoomDispatcher {
    private static final Map<String, RoomIntent> ROOM_INTENT_MAP =
            Map.of(
                    "addRoom", new AddRoom(),
                    "removeRoom", new RemoveRoom(),
                    "getRoom", new GetRooms()
            );

    public static void parseRequestRooms(ChannelHandlerContext ctx, FullHttpRequest req){
        JsonNode jsonBody = parseJsonFromBody(req.content());
        if (jsonBody == null){
            HttpResponseUtil.sendError(ctx,HttpResponseStatus.BAD_REQUEST,"Missing Json Body field");
            return;
        }

        String intent = jsonBody.path("intent").asText(null);

        if (intent == null) {
            HttpResponseUtil.sendError(ctx,HttpResponseStatus.BAD_REQUEST,"invalid intend");
            return;
        }

        RoomIntent handler = ROOM_INTENT_MAP.get(intent);

        if (handler == null) {
            HttpResponseUtil.sendError(ctx,HttpResponseStatus.BAD_REQUEST,"Missing intent Handler field");
            return;
        }

        handler.handle(ctx, jsonBody, UserSessionRegistry.getInstance().getUserSession());
    }
}
