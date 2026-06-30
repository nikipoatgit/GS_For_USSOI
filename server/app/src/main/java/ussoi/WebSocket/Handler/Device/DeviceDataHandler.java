package ussoi.WebSocket.Handler.Device;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.*;
import ussoi.SessionHandler.Device.PoolRegistry.DataRegistry;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DeviceDataWebSocketHandler.java
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
public class DeviceDataHandler extends SimpleChannelInboundHandler<WebSocketFrame> {
    private final DataRegistry dataRegistry;
    private final String  deviceId;
    private final String  tunnelname;

    public DeviceDataHandler(DataRegistry dataRegistry, String deviceId, String tunnelname) {
        this.dataRegistry = dataRegistry;
        this.deviceId = deviceId;
        this.tunnelname = tunnelname;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, WebSocketFrame frame) {

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

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {dataRegistry.relayFromDevice(buf);
    }


    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {
        dataRegistry.registerDevice(ctx.channel());
        System.out.println("[DEBUG] + [Data] + DEVICE ADDED " + deviceId +" to "+tunnelname );
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}

