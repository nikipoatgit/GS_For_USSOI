package ussoi.Security.AuthenticationService;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.*;
import ussoi.Http.HttpError.ErrorResponse;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file HttpResponse.java
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
public final class HttpResponseUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void sendError(ChannelHandlerContext ctx, HttpResponseStatus status,String message) {
        ErrorResponse error = new ErrorResponse(status.code(),status.reasonPhrase(), message);
        send(ctx, status, error, null);
    }

    public static void sendJson(ChannelHandlerContext ctx,HttpResponseStatus status, Object body,String cookie) {
        send(ctx, status, body, cookie);
    }

    private static void send(ChannelHandlerContext ctx,HttpResponseStatus status, Object body,String cookie) {
        try {
            byte[] bytes = MAPPER.writeValueAsBytes(body);

            FullHttpResponse res = new DefaultFullHttpResponse(
                    HttpVersion.HTTP_1_1,
                    status,
                    Unpooled.wrappedBuffer(bytes)
            );

            res.headers().set(HttpHeaderNames.CONTENT_TYPE, "application/json");
            res.headers().setInt(HttpHeaderNames.CONTENT_LENGTH, bytes.length);

            if (cookie != null) {
                res.headers().set(HttpHeaderNames.SET_COOKIE, cookie);
            }

            ctx.writeAndFlush(res);

        } catch (Exception e) {
            // todo : Log
            ctx.close();
        }
    }
}
