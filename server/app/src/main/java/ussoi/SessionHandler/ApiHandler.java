package ussoi.SessionHandler;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.*;
import ussoi.Device.HandleDeviceAuth;
import ussoi.WebApp.HomePage.DeviceDispatcher;
import ussoi.WebApp.HomePage.RoomDispatcher;
import ussoi.WebApp.LoginPage.HandleUserLogin;

import java.util.HashMap;
import java.util.Map;

import static ussoi.Http.HttpResponseUtil.*;
import static ussoi.Security.AuthenticationService.AuthService.isUserSessionValid;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file ApiHandler.java
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
public class ApiHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    private static final Map<String, ApiRouteHandler> API_ROUTES = new HashMap<>();

    static {
        // user Api
        API_ROUTES.put(key(HttpMethod.POST, "/api/user/login"),HandleUserLogin::handleLogin);

        API_ROUTES.put(key(HttpMethod.POST, "/api/user/rooms"),RoomDispatcher::parseRequestRooms);

        API_ROUTES.put(key(HttpMethod.POST, "/api/user/devices"),DeviceDispatcher::parseRequestDevices);

        // device api
        API_ROUTES.put(key(HttpMethod.POST, "/api/device/authenticate"), HandleDeviceAuth::authenticateDevice);

    }

    private static String key(HttpMethod method, String uri) {
        return method.name() + ":" + uri;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) {

        String path = new QueryStringDecoder(req.uri()).path();

        if (!path.startsWith("/api")) {
            ctx.fireChannelRead(req.retain());
            return;
        }

        if (!req.method().equals(HttpMethod.POST)) {
            sendError(ctx, HttpResponseStatus.METHOD_NOT_ALLOWED, "Only POST allowed");
            return;
        }

        // User / Device Pass Through Api
        if (!(path.equals("/api/user/login") || path.equals("/api/device/authenticate"))) {

            String cookieHeader = req.headers().get(HttpHeaderNames.COOKIE);

            if (cookieHeader == null || !isUserSessionValid(cookieHeader)) {
                sendJson(ctx, HttpResponseStatus.UNAUTHORIZED, "Auth Token Invalid", null);
                return;
            }
        }

        ApiRouteHandler handler = API_ROUTES.get(key(req.method(), req.uri()));

        if (handler != null) {
            handler.handle(ctx, req);
        } else {
            sendError(ctx,HttpResponseStatus.NOT_FOUND,"Api Route Not Found");
        }

    }


    @FunctionalInterface
    public interface ApiRouteHandler {
        void handle(ChannelHandlerContext ctx, FullHttpRequest req);
    }

}

