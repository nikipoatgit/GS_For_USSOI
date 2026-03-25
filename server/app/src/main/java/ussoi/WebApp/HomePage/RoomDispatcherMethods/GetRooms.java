package ussoi.WebApp.HomePage.RoomDispatcherMethods;

import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.HttpResponseStatus;
import ussoi.Http.HttpResponseUtil;
import ussoi.SessionHandler.User.UserSession;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file getRoom.java
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
public class GetRooms implements RoomIntent {

    @Override
    public void handle(ChannelHandlerContext ctx, JsonNode json, UserSession userSession) {
        HttpResponseUtil.sendJson(ctx, HttpResponseStatus.OK, userSession.getRoomDetails(),null);
    }
}
