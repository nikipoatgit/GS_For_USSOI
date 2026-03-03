package ussoi.WebSocket.Handler.User;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.*;
import ussoi.SessionHandler.Registry.UserSessionRegistry;

import static ussoi.Security.AuthenticationService.AuthService.getUserRole;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file UserControlWebSocketHandler.java
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
public class UserControlWebSocketHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    private final String userId;
    private final String deviceId;

    public UserControlWebSocketHandler(String userId, String deviceId) {
        this.userId = userId;
        this.deviceId = deviceId;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx,WebSocketFrame frame) {

        if (frame instanceof TextWebSocketFrame textFrame) {
            handleText(ctx, textFrame.text());
        }
        else if (frame instanceof BinaryWebSocketFrame binaryFrame) {
            handleBinary(ctx, binaryFrame.content());
        }
        else if (frame instanceof CloseWebSocketFrame) {
            ctx.close();
        }
        else if (frame instanceof PingWebSocketFrame ping) {
            ctx.writeAndFlush(new PongWebSocketFrame(ping.content().retain()));
        }
    }

    private void handleText(ChannelHandlerContext ctx, String message) {
        // process JSON message
    }

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {
        // optional
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) {// from cookie or handshake headers
        // triggered when ws connects
        // adding it to that deviceSessions UserWs Registry
      UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId).addUser(userId, ctx.channel(),getUserRole(userId));
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        // triggered when ws disconnects
        // cleanup
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}
