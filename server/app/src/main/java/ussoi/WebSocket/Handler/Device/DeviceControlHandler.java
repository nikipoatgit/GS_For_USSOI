package ussoi.WebSocket.Handler.Device;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.*;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Registry.UserSessionRegistry;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DeviceControlWebSocketHandler.java
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
public class DeviceControlHandler extends SimpleChannelInboundHandler<WebSocketFrame> {
    private final String deviceId ;
    // Device session is created when dev id is assigned , and not destroyed until restarts
    private final DeviceSession deviceSession;
//    private ScheduledFuture<?> heartbeatTask;

    public DeviceControlHandler(String deviceId) {
        this.deviceId = deviceId;
        deviceSession = UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId);
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx,WebSocketFrame frame) {
        deviceSession.updateLastSeen();
        switch (frame) {
            case TextWebSocketFrame textFrame ->handleText(ctx, textFrame.text());
            case BinaryWebSocketFrame binaryFrame -> handleBinary(ctx, binaryFrame.content());
            case CloseWebSocketFrame ignored -> ctx.close();
            default -> {
            }
        }
    }

    private void handleText(ChannelHandlerContext ctx, String message) {
        deviceSession.processDeviceMessage(message);
    }

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {
    }

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {
        try {
            System.out.println("Device WS connected");
//            startHeartbeat(ctx);
            deviceSession.addDevice(ctx.channel());

        } catch (Exception e) {
            System.out.println("Failed to connect ws for deviceId="+ deviceId + " " + e);
        }
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {

//        if (heartbeatTask != null) {
//            heartbeatTask.cancel(false);
//            heartbeatTask = null;
//        }
    }

//    private void startHeartbeat(ChannelHandlerContext ctx) {
//
//        heartbeatTask = ctx.executor().scheduleAtFixedRate(() -> {
//
//            Channel ch = ctx.channel();
//
//            if (!ch.isActive()) return;
//
//            ch.writeAndFlush(new PingWebSocketFrame());
//
//        }, 0, 2, TimeUnit.SECONDS); // 2 sec interval
//    }
}
