package ussoi.WebApp.DevicePage;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file WsResponseHelper.java
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
public class WsResponseHelper {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static void sendAck(ChannelHandlerContext ctx, String cmdId) {
        ObjectNode resp = mapper.createObjectNode();
        resp.put("type", "ack");
        resp.put("cmdId", cmdId);
        resp.put("reason", "");
        send(ctx, resp);
    }

    public static void sendNack(ChannelHandlerContext ctx, String cmdId, String reason) {
        ObjectNode resp = mapper.createObjectNode();
        resp.put("type", "nack");
        resp.put("cmdId", cmdId);
        resp.put("reason", reason != null ? reason : "");
        send(ctx, resp);
    }

    public static void sendState(ChannelHandlerContext ctx, String cmdId, int stream, int record, int[] tunnel) {
        ObjectNode controls = mapper.createObjectNode();
        controls.put("stream", stream);
        controls.put("record", record);
        controls.set("tunnel", mapper.valueToTree(tunnel));

        ObjectNode resp = mapper.createObjectNode();
        resp.put("type", "state");
        resp.put("cmdId", cmdId);
        resp.set("controls", controls);
        send(ctx, resp);
    }

    public static void send(ChannelHandlerContext ctx, ObjectNode json) {
        try {
            String text = mapper.writeValueAsString(json);
            ctx.writeAndFlush(new TextWebSocketFrame(text));
        } catch (Exception e) {
            ctx.close();
        }
    }
}
