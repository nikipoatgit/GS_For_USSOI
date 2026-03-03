package ussoi.WebSocket;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.WebSocket.Handler.Device.DeviceControlWebSocketHandler;
import ussoi.WebSocket.Handler.Device.DeviceStreamWebSocketHandler;
import ussoi.WebSocket.Handler.User.UserControlWebSocketHandler;

import java.util.List;

import static ussoi.Utility.utilityMethods.extractSession;
import static ussoi.Security.AuthenticationService.cookieSessionStore.*;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file WebSocketRouterHandler.java
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
public class WebSocketRouter extends ChannelInboundHandlerAdapter {

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {

        if (!(evt instanceof WebSocketServerProtocolHandler.HandshakeComplete handshake)) {
            super.userEventTriggered(ctx, evt);
            return;
        }

        String uri = handshake.requestUri();
        String cookieHeader = handshake.requestHeaders().get(HttpHeaderNames.COOKIE);

        if (cookieHeader == null) {
            ctx.close();
            return;
        }
        String token = extractSession(cookieHeader);
        if (token == null) {
            ctx.close();
            return;
        }

        UserSessionRegistry registry = UserSessionRegistry.getInstance();

        if (uri.startsWith("/ws/user")) {

            if (!uri.startsWith("/ws/user?deviceId=")) {
                ctx.close();
                return;
            }

            QueryStringDecoder decoder = new QueryStringDecoder(uri);
            String deviceId = decoder.parameters()
                    .getOrDefault("deviceId", List.of())
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (!doesDeviceIDExistInDb(deviceId)) {
                ctx.close();
                return;
            }

            DeviceSession deviceSession = registry.getUserSession().getDeviceSession(deviceId);

            if (deviceSession == null) {
                ctx.close();
                return;
            }

            String userId = getUserIdFromSessionInDb(token);
            if (userId == null || deviceSession.checkIfUserExist(userId)) {
                ctx.close();
                return;
            }

            ctx.pipeline().replace(this,"userHandler",new UserControlWebSocketHandler(userId, deviceId));
            return;
        }
        else if (uri.startsWith("/ws/device/control")) {

            String deviceId = getDeviceIdFromSessionInDb(token);
            if (deviceId == null || registry.getUserSession().getDeviceSession(deviceId) == null) {
                ctx.close();
                return;
            }

            ctx.pipeline().replace(this,"deviceControlHandler", new DeviceControlWebSocketHandler(deviceId));
            return;
        }
        else if (uri.startsWith("/ws/device/stream")) {
            ctx.pipeline().replace(this,"deviceStreamHandler", new DeviceStreamWebSocketHandler());
            return;
        }

        ctx.close();
    }
}

