package ussoi.WebSocket.Handler.Device;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.*;
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
public class DeviceControlWebSocketHandler extends SimpleChannelInboundHandler<WebSocketFrame> {
    private final String deviceId ;

    public DeviceControlWebSocketHandler(String deviceId) {
        this.deviceId = deviceId;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx,WebSocketFrame frame) {

        if (frame instanceof BinaryWebSocketFrame binaryFrame) {
            handleBinary(ctx, binaryFrame.content());
        } else if (frame instanceof CloseWebSocketFrame) {
            ctx.close();
        } else if (frame instanceof PingWebSocketFrame ping) {
            ctx.writeAndFlush(new PongWebSocketFrame(ping.content().retain()));
        }
    }

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {
       try{
           UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId).processIncomingDeviceMessage(buf);
       }
       finally {
           buf.release();
       }
    }

    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        // connection established
        UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId).addDevice(ctx.channel());
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        // cleanup
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}
