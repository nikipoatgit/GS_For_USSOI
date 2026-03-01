package ussoi.Security.AuthenticationService;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.*;

import static ussoi.Security.AuthenticationService.AuthService.isDeviceValidSession;
import static ussoi.Security.AuthenticationService.AuthService.isUserValidSession;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file AuthGuardHandler.java
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
public class AuthGuardHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) {

        String path = new QueryStringDecoder(req.uri()).path();


        if (path.equals("/") || path.startsWith("/assets")) {
            ctx.fireChannelRead(req.retain());
            return;
        }

        // User Api
        if (path.startsWith("/api/user")) {

            if (path.equals("/api/user/login")) {
                ctx.fireChannelRead(req.retain());
                return;
            }

            String cookieHeader = req.headers().get(HttpHeaderNames.COOKIE);

            if (cookieHeader != null && isUserValidSession(cookieHeader)) {
                ctx.fireChannelRead(req.retain());
                return;
            }

            sendUserRedirect(ctx);
            return;
        }

        // Device Api
        if (path.startsWith("/api/device/")) {

            // authenticate endpoint is public
            if (path.equals("/api/device/authenticate")) {
                ctx.fireChannelRead(req.retain());
                return;
            }

            sendUnauthorized(ctx);
            return;
        }

        // User ws
        if (path.startsWith("/ws/user")) {

            String cookieHeader = req.headers().get(HttpHeaderNames.COOKIE);

            if (cookieHeader != null && isUserValidSession(cookieHeader)) {
                ctx.fireChannelRead(req.retain());
                return;
            }

            sendUnauthorized(ctx);
            return;
        }

        // Device ws
        if (path.startsWith("/ws/device")) {


            String cookieHeader = req.headers().get(HttpHeaderNames.COOKIE);

            if (cookieHeader != null && isDeviceValidSession(cookieHeader)) {
                ctx.fireChannelRead(req.retain());
                return;
            }

            sendUnauthorized(ctx);
            return;
        }

        sendUserRedirect(ctx);
    }

    private void sendUserRedirect(ChannelHandlerContext ctx) {
        FullHttpResponse res = new DefaultFullHttpResponse(
                HttpVersion.HTTP_1_1,
                HttpResponseStatus.FOUND
        );
        res.headers().set(HttpHeaderNames.LOCATION, "/");
        res.headers().set(HttpHeaderNames.CONTENT_LENGTH, 0);
        ctx.writeAndFlush(res);
    }

    private void sendUnauthorized(ChannelHandlerContext ctx) {
        FullHttpResponse res = new DefaultFullHttpResponse(
                HttpVersion.HTTP_1_1,
                HttpResponseStatus.UNAUTHORIZED
        );
        res.headers().set(HttpHeaderNames.CONTENT_LENGTH, 0);
        ctx.writeAndFlush(res);
    }
}
