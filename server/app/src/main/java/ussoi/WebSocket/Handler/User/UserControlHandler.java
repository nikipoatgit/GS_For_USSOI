package ussoi.WebSocket.Handler.User;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.*;
import ussoi.SessionHandler.Registry.UserSessionRegistry;

import java.nio.charset.StandardCharsets;

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
public class UserControlHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    private final String userId;
    private final String deviceId;

    public UserControlHandler(String userId, String deviceId) {
        this.userId = userId;
        this.deviceId = deviceId;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx,WebSocketFrame frame) {

        switch (frame) {
            case TextWebSocketFrame textFrame ->handleText(ctx, textFrame.text());
            case BinaryWebSocketFrame binaryFrame -> handleBinary(ctx, binaryFrame.content());
            case CloseWebSocketFrame closeWebSocketFrame -> ctx.close();
            case PingWebSocketFrame ping -> ctx.writeAndFlush(new PongWebSocketFrame(ping.content().retain()));
            default -> {
            }
        }
    }

    private void handleText(ChannelHandlerContext ctx, String message) {
        // process JSON message
        System.out.println("Received text: " + message);
    }

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {
        // optional
        System.out.println("Received bin: User");
    }

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {// from cookie or handshake headers
        // triggered when ws connects
        // adding it to that deviceSessions UserWs Registry
        System.out.println("[DEBUG] + handlerAdded " + userId );

        try {
            System.out.println("User WS connected");
            UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId).addUser(userId, ctx.channel(),getUserRole(userId));
        } catch (Exception e) {
            // TODO LOG
            System.out.println("Failed to connect ws for deviceId="+ deviceId + " " + e);
        }
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}
