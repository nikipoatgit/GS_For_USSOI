package ussoi.WebSocket.Route;

import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import ussoi.WebSocket.Route.Device.DeviceControlRoute;
import ussoi.WebSocket.Route.Device.DeviceDataRoute;
import ussoi.WebSocket.Route.Device.DeviceStreamRoute;
import ussoi.WebSocket.Route.User.UserControlRoute;
import ussoi.WebSocket.Route.User.UserStreamRoute;

import static ussoi.Utility.utilityMethods.extractSession;

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

    private final UserControlRoute userRoute = new UserControlRoute();
    private final DeviceControlRoute deviceControlRoute = new DeviceControlRoute();
    private final DeviceStreamRoute deviceStreamRoute = new DeviceStreamRoute();
    private final UserStreamRoute userStreamRoute = new UserStreamRoute();
    private final DeviceDataRoute deviceDataRoute = new DeviceDataRoute();
    private final DataRoute dataRoute = new DataRoute();


    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {

        if (!(evt instanceof WebSocketServerProtocolHandler.HandshakeComplete handshake)) {
            System.out.println("Ws Request Handshake Incomplete");
            super.userEventTriggered(ctx, evt);
            return;
        }

        String uri = handshake.requestUri();
        System.out.println("Ws Handshake complete :"+uri);

        if (dataRoute.matches(uri)) {
            System.out.println("dataRoute.matches :" +uri);
            dataRoute.handle(ctx, uri,null);
            return;
        }

        String authHeader = handshake.requestHeaders().get(HttpHeaderNames.AUTHORIZATION);
        String cookie = handshake.requestHeaders().get(HttpHeaderNames.COOKIE);

        String token = extractSession(cookie,authHeader);

        if (token == null) {
            System.out.println("Token: null");
            close(ctx);
            return;
        }
        // this has to be at top cause then userRoute will match then it wil handle ws
        if (userStreamRoute.matches(uri)) {
            System.out.println("userStreamRoute.matches :" +uri);
            userStreamRoute.handle(ctx, uri, token);
            return;
        }

        if (userRoute.matches(uri)) {
            System.out.println("userRoute.matches :" +uri);
            userRoute.handle(ctx, uri, token);
            return;
        }

        if (deviceControlRoute.matches(uri)) {
            System.out.println("deviceControlRoute.matches :" +uri);
            deviceControlRoute.handle(ctx, uri, token);
            return;
        }

        if (deviceStreamRoute.matches(uri)) {
            System.out.println("deviceStreamRoute.matches :" +uri);
            deviceStreamRoute.handle(ctx, uri, token);
            return;
        }

        if (deviceDataRoute.matches(uri)) {
            System.out.println("deviceDataRoute.matches :" +uri);
            deviceDataRoute.handle(ctx, uri, token);
            return;
        }

        close(ctx);
}

    private void close(ChannelHandlerContext ctx) {
        ctx.writeAndFlush(new CloseWebSocketFrame()).addListener(ChannelFutureListener.CLOSE);
    }
}

