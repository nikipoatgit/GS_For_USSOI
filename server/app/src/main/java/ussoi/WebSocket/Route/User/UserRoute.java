package ussoi.WebSocket.Route.User;

import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.WebSocket.Handler.User.UserControlHandler;

import java.util.List;

import static ussoi.Security.AuthenticationService.cookieSessionStore.doesDeviceIDExistInDb;
import static ussoi.Security.AuthenticationService.cookieSessionStore.getUserIdFromSessionInDb;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file UserRoute.java
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
public class UserRoute {

    public boolean matches(String uri) {
        return uri.startsWith("/ws/user");
    }

    public void handle(ChannelHandlerContext ctx, String uri, String token) {

        if (!uri.startsWith("/ws/user?deviceId=")) {
            close(ctx);
            return;
        }

        QueryStringDecoder decoder = new QueryStringDecoder(uri);
        String deviceId = decoder.parameters().getOrDefault("deviceId", List.of()).stream().findFirst().orElse(null);

        if (!doesDeviceIDExistInDb(deviceId)) {
            close(ctx);
            return;
        }

        UserSessionRegistry registry = UserSessionRegistry.getInstance();
        DeviceSession deviceSession = registry.getUserSession().getDeviceSession(deviceId);

        if (deviceSession == null) {
            close(ctx);
            return;
        }

        String userId = getUserIdFromSessionInDb(token);

        if (userId == null || deviceSession.checkIfUserExistInWsRegistry(userId)) {
            close(ctx);
            return;
        }

        ctx.pipeline().replace("webSocketRouter", "userHandler", new UserControlHandler(userId, deviceId));
    }

    private void close(ChannelHandlerContext ctx) {
        ctx.writeAndFlush(new CloseWebSocketFrame()).addListener(ChannelFutureListener.CLOSE);
    }
}
