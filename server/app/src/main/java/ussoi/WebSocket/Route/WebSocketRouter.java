package ussoi.WebSocket.Route;

import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.WebSocket.Handler.Device.DeviceControlHandler;
import ussoi.WebSocket.Handler.Device.DeviceStreamHandler;
import ussoi.WebSocket.Handler.User.UserControlHandler;
import ussoi.WebSocket.Route.Device.DeviceControlRoute;
import ussoi.WebSocket.Route.Device.DeviceStreamRoute;
import ussoi.WebSocket.Route.User.UserRoute;

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

    private final UserRoute userRoute = new UserRoute();
    private final DeviceControlRoute deviceControlRoute = new DeviceControlRoute();
    private final DeviceStreamRoute deviceStreamRoute = new DeviceStreamRoute();

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {

        if (!(evt instanceof WebSocketServerProtocolHandler.HandshakeComplete handshake)) {
            System.out.println("Ws Request Handshake Incomplete");
            super.userEventTriggered(ctx, evt);
            return;
        }

        String uri = handshake.requestUri();
        String cookie = handshake.requestHeaders().get(HttpHeaderNames.COOKIE);

        System.out.println("Ws Handshake complete :"+uri);

        if (cookie == null) {
            close(ctx);
            return;
        }

        String token = extractSession(cookie);
        if (token == null) {
            close(ctx);
            return;
        }

        if (userRoute.matches(uri)) {
            System.out.println("userRoute.matches");
            userRoute.handle(ctx, uri, token);
            return;
        }

        if (deviceControlRoute.matches(uri)) {
            System.out.println("deviceControlRoute.matches");
            deviceControlRoute.handle(ctx, uri, token);
            return;
        }

        if (deviceStreamRoute.matches(uri)) {
            System.out.println("deviceStreamRoute.matches");
            deviceStreamRoute.handle(ctx, uri, token);
            return;
        }

        close(ctx);
}

    private void close(ChannelHandlerContext ctx) {
        ctx.writeAndFlush(new CloseWebSocketFrame()).addListener(ChannelFutureListener.CLOSE);
    }
}

