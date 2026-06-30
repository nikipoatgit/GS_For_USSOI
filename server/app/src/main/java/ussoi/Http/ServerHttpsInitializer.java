package ussoi.Http;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * @file ServerHttpsInitializer.java
 * *****************************************************************************
 * @attention Copyright (c) 2026
 * All rights reserved.
 * This software is licensed under the terms described in the LICENSE file
 * located in the root directory of this project.
 * If no LICENSE file is present, this software is provided "AS IS",
 * without warranty of any kind, express or implied.
 * *****************************************************************************
 *
 * Listens on port 443. Identical to the original single-port pipeline,
 * just with an SslHandler in front of it. This is the real application
 * entry point now that port 80 is redirect-only.
 */

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.ssl.SslContext;

import java.nio.file.Path;

public class ServerHttpsInitializer extends ChannelInitializer<Channel> {

    private final SslContext sslContext;

    Path root = Path.of("..", "web", "dist")
            .toAbsolutePath()
            .normalize();

    public ServerHttpsInitializer(SslContext sslContext) {
        this.sslContext = sslContext;
    }

    @Override
    protected void initChannel(Channel ch) {

        ChannelPipeline p = ch.pipeline();

        p.addLast(sslContext.newHandler(ch.alloc()));

        HttpPipelineBuilder.buildPipeline(p, root);
    }
}