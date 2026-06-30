package ussoi.Http;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * @file HttpPipelineBuilder.java
 * *****************************************************************************
 * @attention Copyright (c) 2026
 * All rights reserved.
 * *****************************************************************************
 *
 * Builds the application-level pipeline (codec, aggregator, API handler,
 * websocket stack, static file handler) shared by both the plaintext
 * ServerHttpInitializer (port 80, currently only used for the 301 redirect)
 * and ServerHttpsInitializer (port 443). Keeping this in one place means
 * the TLS and non-TLS pipelines can never drift apart.
 */

import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import ussoi.SessionHandler.ApiHandler;
import ussoi.WebSocket.Route.WebSocketRouter;
import ussoi.Security.AuthenticationService.WebSocketAuthHandler;

import java.nio.file.Path;

public final class HttpPipelineBuilder {

    private HttpPipelineBuilder() {
        // static utility, not instantiable
    }

    /**
     * Adds the full HTTP application pipeline to {@code p}.
     * Callers are responsible for adding anything that must come before
     * this (e.g. SslHandler) prior to calling this method.
     */
    public static void buildPipeline(ChannelPipeline p, Path root) {
        p.addLast(new HttpServerCodec());
        p.addLast(new HttpObjectAggregator(10 * 1024 * 1024));

        p.addLast(new ApiHandler());

        p.addLast(new WebSocketServerProtocolHandler(
                        "/ws",          // base websocket path
                        null,           // subprotocols
                        true,           // checkStartsWith → allow /ws/*
                        8 * 1024 * 1024, // max frame payload length 8 MB changing this may throttle stream
                        true,           // allow extensions
                        true,           // allow mask mismatch
                        true           // don't forward pong frames DownStream
                )
        );
        p.addLast(new WebSocketAuthHandler());
        p.addLast("webSocketRouter", new WebSocketRouter());

        p.addLast(new StaticFileHandler(root));
    }
}