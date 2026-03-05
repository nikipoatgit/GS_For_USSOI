package ussoi.WebSocket.Route.Device;

import io.netty.channel.ChannelHandlerContext;
import ussoi.WebSocket.Handler.Device.DeviceStreamHandler;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DeviceStreamRoute.java
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
public class DeviceStreamRoute {

    public boolean matches(String uri) {
        return uri.startsWith("/ws/device/stream");
    }

    public void handle(ChannelHandlerContext ctx, String uri, String token) {

        ctx.pipeline().replace(
                "webSocketRouter",
                "deviceStreamHandler",
                new DeviceStreamHandler()
        );
    }
}
