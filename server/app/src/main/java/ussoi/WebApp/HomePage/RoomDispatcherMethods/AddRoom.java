package ussoi.WebApp.HomePage.RoomDispatcherMethods;

import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.HttpResponseStatus;
import ussoi.Security.AuthenticationService.HttpResponseUtil;
import ussoi.SessionHandler.User.Room.RoomHandler;
import ussoi.SessionHandler.User.UserSession;

import static ussoi.Security.AuthorizationService.AckAndNack.AckStatus.ACK;
import static ussoi.Security.AuthorizationService.AckAndNack.AckStatus.NACK;
import static ussoi.Security.AuthorizationService.AckAndNack.buildAckStatus;
import static ussoi.Security.AuthenticationService.HttpResponseUtil.sendJson;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file AddRoomHandler.java
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
//        "roomName": "Test Room",
//        "roomPassword": "1234"
public class AddRoom implements RoomIntent {

    @Override
    public void handle(ChannelHandlerContext ctx, JsonNode json, UserSession userSession) {

        String roomId = json.path("roomId").asText(null);
        String roomName = json.path("roomName").asText(null);
        String roomPassword = json.path("roomPassword").asText(null);
        String reqId = json.path("reqId").asText(null);

        if (roomId == null || roomName == null || roomPassword == null) {
            HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST,"Room Value Null");
            return;
        }
        RoomHandler room = userSession.getRoomHandler();
        if (room.addRoom(roomId,roomName,roomPassword)){
            sendJson(ctx, HttpResponseStatus.OK, buildAckStatus(ACK,"Room","Room Added",reqId),null);
        }
        else {
            sendJson(ctx, HttpResponseStatus.OK, buildAckStatus(NACK,"Room","Room Already Exist",reqId),null);
        }
    }
}