package ussoi.WebSocket.Handler.User;

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
 * @file UserStreamWebSocketHandler.java
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
public class UserStreamHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    private final String userId;
    private final String deviceId;

    private final DeviceSession deviceSession;

    public UserStreamHandler(String userId, String deviceId) {
        this.userId = userId;
        this.deviceId = deviceId;
        deviceSession = UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId);
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, WebSocketFrame frame) {

        if (frame instanceof CloseWebSocketFrame) {
            ctx.close();
        } else if (frame instanceof PingWebSocketFrame ping) {
            ctx.writeAndFlush(new PongWebSocketFrame(ping.content().retain()));
        }
    }


    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {
        if (deviceSession != null){
            deviceSession.addUserToStreamPool(userId, ctx.channel());
        }
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}

