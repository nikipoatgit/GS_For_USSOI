package ussoi.Http;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * @file HttpsRedirectHandler.java
 * *****************************************************************************
 * @attention Copyright (c) 2026
 * All rights reserved.
 * *****************************************************************************
 *
 */

import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.DefaultFullHttpResponse;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.FullHttpResponse;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpResponseStatus;
import io.netty.handler.codec.http.HttpVersion;

import static ussoi.UssoiStrings.HTTPS_BASE_URL;

public class HttpsRedirectHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest request) {
        String path = request.uri();
        if (path == null || path.isEmpty()) {
            path = "/";
        }

        String location = HTTPS_BASE_URL + path;

        FullHttpResponse response = new DefaultFullHttpResponse(
                HttpVersion.HTTP_1_1,
                HttpResponseStatus.MOVED_PERMANENTLY
        );
        response.headers().set(HttpHeaderNames.LOCATION, location);
        response.headers().set(HttpHeaderNames.CONTENT_LENGTH, 0);

        ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
    }
}