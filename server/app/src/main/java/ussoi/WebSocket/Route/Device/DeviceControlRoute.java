package ussoi.WebSocket.Route.Device;

import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.WebSocket.Handler.Device.DeviceControlHandler;

import static ussoi.Security.AuthenticationService.cookieSessionStore.getDeviceIdFromSessionInDb;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file deviceRoute.java
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
public class DeviceControlRoute {

    public boolean matches(String uri) {
        return uri.startsWith("/ws/device/control");
    }

    public void handle(ChannelHandlerContext ctx, String uri, String token) {

        String deviceId = getDeviceIdFromSessionInDb(token);

        UserSessionRegistry registry = UserSessionRegistry.getInstance();

        // check for device existence
        if (deviceId == null || registry.getUserSession().getDeviceSession(deviceId) == null) {
            System.out.println("DeviceSession Don't Exist");
            close(ctx);
            return;
        }

        ctx.pipeline().replace("webSocketRouter","deviceControlHandler", new DeviceControlHandler(deviceId));
    }

    private void close(ChannelHandlerContext ctx) {
        System.out.println("ws closed by deviceStreamRoute");
        ctx.writeAndFlush(new CloseWebSocketFrame()).addListener(ChannelFutureListener.CLOSE);
    }
}
