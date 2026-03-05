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
public class DeviceControlHandler extends SimpleChannelInboundHandler<WebSocketFrame> {
    private final String deviceId ;

    public DeviceControlHandler(String deviceId) {
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
        System.out.println("Received text: " + message);
    }

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {
       try{
           System.out.println("handleBinary:  msg from device ");
           UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId).processIncomingDeviceMessage(buf);
       } catch (Exception e) {
           // TODO LOG
           System.out.println("Failed to process binary message for deviceId="+ deviceId + " " + e);
       }
    }

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {
        // connection established
        try {
            System.out.println("Device WS connected");
        UserSessionRegistry.getInstance().getUserSession().getDeviceSession(deviceId).addDevice(ctx.channel());
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
