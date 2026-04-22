package ussoi.WebSocket.Handler.User;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.*;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.WebApp.DevicePage.UserCommandRouter;

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

    private final UserCommandRouter router ;
    private static final ObjectMapper mapper = new ObjectMapper();

    private final String userId;
    private final String deviceId;

    private final DeviceSession deviceSession;

    public UserControlHandler(String userId, String deviceId) {
        this.userId = userId;
        this.deviceId = deviceId;
        deviceSession = UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId);

        router = new UserCommandRouter(deviceSession,getUserRole(userId));
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx,WebSocketFrame frame) {

        switch (frame) {
            case TextWebSocketFrame textFrame ->handleText(ctx, textFrame.text());
            case BinaryWebSocketFrame binaryFrame -> handleBinary(ctx, binaryFrame.content());
            case CloseWebSocketFrame ignored -> ctx.close();
            default -> {
            }
        }
    }

    private void handleText(ChannelHandlerContext ctx, String message) {
        try {
            JsonNode json = mapper.readTree(message);
            if (json == null || !json.isObject()) {
                return;
            }
        } catch (Exception e) {
            // TODO malformed JSON — drop silently Add Security Check
            return;
        }
        router.route(ctx,message);
    }

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {
        // no need right now
    }

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {// from cookie or handshake headers
        // triggered when ws connects
        // adding it to that deviceSessions UserWs Registry

        try {
            deviceSession.addUserToControlPool(userId, ctx.channel(),getUserRole(userId));

        } catch (Exception e) {
            // TODO LOG
            System.out.println("Failed to connect ws for deviceId="+ deviceId + " " + e);
            ctx.close();
        }
    }

    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) {
        // We already have put internal call back for this
    }
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}
