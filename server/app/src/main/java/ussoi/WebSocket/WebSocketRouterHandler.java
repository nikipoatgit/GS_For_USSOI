package ussoi.WebSocket;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.WebSocketFrame;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.util.AttributeKey;
import ussoi.WebSocket.SocketHandler.DeviceControlWebSocketHandler;
import ussoi.WebSocket.SocketHandler.DeviceStreamWebSocketHandler;
import ussoi.WebSocket.SocketHandler.UserWebSocketHandler;

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
public class WebSocketRouterHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) {
        if (evt instanceof WebSocketServerProtocolHandler.HandshakeComplete handshake) {
            String uri = handshake.requestUri();

            if (uri.startsWith("/ws/user")) {
                ctx.pipeline().replace(this, "userHandler", new UserWebSocketHandler());
            }
            else if (uri.startsWith("/ws/device/control")) {
                ctx.pipeline().replace(this, "deviceControlHandler", new DeviceControlWebSocketHandler());
            }
            else if (uri.startsWith("/ws/device/stream")) {
                ctx.pipeline().replace(this, "deviceStreamHandler", new DeviceStreamWebSocketHandler());
            }
        }

        try {
            super.userEventTriggered(ctx, evt);
        } catch (Exception e) {
            //todo log
            throw new RuntimeException(e);
        }
    }
}
