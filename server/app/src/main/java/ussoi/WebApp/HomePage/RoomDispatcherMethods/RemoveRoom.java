package ussoi.WebApp.HomePage.RoomDispatcherMethods;

import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.HttpResponseStatus;
import ussoi.Http.HttpResponseUtil;
import ussoi.SessionHandler.User.UserSession;

import static ussoi.Security.AuthorizationService.AckAndNack.AckStatus.ACK;
import static ussoi.Security.AuthorizationService.AckAndNack.AckStatus.NACK;
import static ussoi.Security.AuthorizationService.AckAndNack.buildAckStatus;
import static ussoi.Http.HttpResponseUtil.sendJson;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file RemoveRoom.java
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

//        "roomId": "r1",
public class RemoveRoom implements RoomIntent {

    @Override
    public void handle(ChannelHandlerContext ctx, JsonNode json, UserSession userSession) {
        String roomId = json.path("roomId").asText(null);
        String reqId = json.path("reqId").asText(null);

        if (roomId == null) {
            HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST,"roomId Null");
            return;
        }

        if (userSession.removeRoom(roomId)){
            sendJson(ctx, HttpResponseStatus.OK, buildAckStatus(ACK,"Room","Room Removed",reqId),null);
        }
        else {
            sendJson(ctx, HttpResponseStatus.OK, buildAckStatus(NACK,"Room","Room Not Found",reqId),null);
        }
    }
}
