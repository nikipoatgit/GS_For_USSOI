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
 * @file DeviceStreamWebSocketHandler.java
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
public class DeviceStreamHandler extends SimpleChannelInboundHandler<WebSocketFrame> {

    private final String deviceId ;
    // Device session is created when dev id is assigned , and not destroyed until restarts
    private final DeviceSession deviceSession;

    public DeviceStreamHandler(String deviceId) {
        this.deviceId = deviceId;
        deviceSession = UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId);
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx,WebSocketFrame frame) {

        if (frame instanceof TextWebSocketFrame textFrame) {
            handleText(ctx, textFrame.text());
        } else if (frame instanceof BinaryWebSocketFrame binaryFrame) {
            handleBinary(ctx, binaryFrame.content());
        } else if (frame instanceof CloseWebSocketFrame) {
            ctx.close();
        } else if (frame instanceof PingWebSocketFrame ping) {
            ctx.writeAndFlush(new PongWebSocketFrame(ping.content().retain()));
        }
    }

    private void handleText(ChannelHandlerContext ctx, String message) {
        // process JSON message
    }

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {
        deviceSession.broadcastToStreamUserPool(buf);
    }

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {
        // unidirectional flow
        if (deviceSession != null){
            System.out.println("[DEBUG] + [Stream] +  DEVICE ADDED  " + deviceId  );
            deviceSession.addDeviceToStreamPool(ctx.channel());
        }
        // connection established
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}
