package ussoi.WebApp.HomePage;

import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import ussoi.Security.AuthenticationService.HttpResponseUtil;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.SessionHandler.User.Room.RoomHandler;
import ussoi.WebApp.HomePage.RoomDispatcherMethods.RoomIntent;

import static ussoi.Security.AuthenticationService.HttpResponseUtil.sendJson;
import static ussoi.Security.AuthorizationService.AckAndNack.AckStatus.ACK;
import static ussoi.Security.AuthorizationService.AckAndNack.AckStatus.NACK;
import static ussoi.Security.AuthorizationService.AckAndNack.buildAckStatus;
import static ussoi.utilityMethods.parseJsonFromBody;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file handleClients.java
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
public class DeviceDispatcher {
    public static void parseRequestDevices(ChannelHandlerContext ctx, FullHttpRequest req){
        JsonNode jsonBody = parseJsonFromBody(req.content());
        if (jsonBody == null){
            HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST,"Missing Json Body field");
            return;
        }

        String intent = jsonBody.path("intent").asText(null);

        if (intent == null) {
            HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST,"intend Null");
            return;
        }
        if(intent.equals("getDevices")){
            sendJson(ctx, HttpResponseStatus.OK,UserSessionRegistry.getInstance().getUserSession().getDeviceSessionRegistry().getAllDevices(),null);
        }
        else{
            HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST,"Invalid intend");
        }

    }
}
