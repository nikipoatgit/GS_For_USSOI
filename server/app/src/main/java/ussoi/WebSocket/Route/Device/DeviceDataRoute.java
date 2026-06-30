package ussoi.WebSocket.Route.Device;

import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Device.PoolRegistry.DataRegistry;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.WebSocket.Handler.Device.DeviceDataHandler;
import ussoi.WebSocket.Handler.Device.DeviceStreamHandler;

import java.util.List;

import static ussoi.Security.AuthenticationService.cookieSessionStore.doesDeviceIDExistInDb;
import static ussoi.Security.AuthenticationService.cookieSessionStore.getDeviceIdFromSessionInDb;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DeviceDataRoute.java
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
public class DeviceDataRoute {
    public boolean matches(String uri) {
        return uri.startsWith("/ws/device/data");
    }

    public void handle(ChannelHandlerContext ctx, String uri, String token) {

        if (!uri.startsWith("/ws/device/data?tunnelname=")) {
            close(ctx);
            return;
        }

        String deviceId = getDeviceIdFromSessionInDb(token);

        QueryStringDecoder decoder = new QueryStringDecoder(uri);

        UserSessionRegistry registry = UserSessionRegistry.getInstance();

        String tunnelname = decoder.parameters().getOrDefault("tunnelname", List.of()).stream().findFirst().orElse(null);

        // check for device existence
        if (deviceId == null ) {
            System.out.println("Device id null");
            close(ctx);
            return;
        }
        DeviceSession deviceSession =  registry.getUserSession().getDeviceSession(deviceId);
        if (deviceSession == null) {
            System.out.println("DeviceSession Don't Exist");
            close(ctx);
            return;
        }

        DataRegistry dataRegistry = deviceSession.getDataRegistryInstance(tunnelname);

        if (dataRegistry == null){
            System.out.println("dataRegistry Don't Exist");
            close(ctx);
            return;
        }

        ctx.pipeline().replace(
                "webSocketRouter",
                "devicedataHandler",
                new DeviceDataHandler(dataRegistry,deviceId,tunnelname)
        );


    }

    private void close(ChannelHandlerContext ctx) {
        System.out.println("ws closed by deviceStreamRoute");
        ctx.writeAndFlush(new CloseWebSocketFrame()).addListener(ChannelFutureListener.CLOSE);
    }
}
