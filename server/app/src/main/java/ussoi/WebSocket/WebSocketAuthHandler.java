package ussoi.WebSocket;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpResponseStatus;

import static ussoi.Http.HttpResponseUtil.sendJson;
import static ussoi.Security.AuthenticationService.AuthService.isDeviceSessionValid;
import static ussoi.Security.AuthenticationService.AuthService.isUserSessionValid;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file WebSocketAuthHandler.java
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
public class WebSocketAuthHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) {

        if (!isWebSocketUpgrade(req)) {
            ctx.fireChannelRead(req.retain());
            return;
        };

        String path = req.uri();
        String cookieHeader = req.headers().get(HttpHeaderNames.COOKIE);

        System.out.println("Ws Auth Request :" + path);

        if (path.startsWith("/ws/user")) {

            if (cookieHeader != null && isUserSessionValid(cookieHeader)) {
                ctx.fireChannelRead(req.retain());
                return;
            }

            sendJson(ctx, HttpResponseStatus.UNAUTHORIZED,"Auth Token Not Valid",null);
            return;
        }

        if (path.startsWith("/ws/device/")) {

            if (cookieHeader != null && isDeviceSessionValid(cookieHeader)) {
                ctx.fireChannelRead(req.retain());
                return;
            }

            sendJson(ctx, HttpResponseStatus.UNAUTHORIZED,"Auth Token Not Valid",null);
            return;
        }

        sendJson(ctx, HttpResponseStatus.NOT_FOUND,"Ws Path Don't Exist",null);
    }

    private boolean isWebSocketUpgrade(FullHttpRequest req) {
        return "websocket".equalsIgnoreCase(req.headers().get(HttpHeaderNames.UPGRADE));
    }
}
