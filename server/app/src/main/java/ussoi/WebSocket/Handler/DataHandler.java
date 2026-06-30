package ussoi.WebSocket.Handler;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.*;
import ussoi.SessionHandler.Device.PoolRegistry.DataRegistry;

public class DataHandler extends SimpleChannelInboundHandler<WebSocketFrame> {
    private final DataRegistry dataRegistry;
    private final String deviceId;
    private final String tunnelName;

    public DataHandler(DataRegistry dataRegistry, String deviceId, String tunnelName) {
        this.dataRegistry = dataRegistry;
        this.deviceId = deviceId;
        this.tunnelName = tunnelName;
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

    private void handleBinary(ChannelHandlerContext ctx, ByteBuf buf) {
        dataRegistry.relayFromUser(buf);
    }

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {
        // connection established
        dataRegistry.registerUser(ctx.channel());
        System.out.println("[DEBUG] + [Data] + User ADDED To" + deviceId +" to "+ tunnelName );
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        ctx.close();
    }
}
