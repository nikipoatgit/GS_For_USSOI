package ussoi.Http;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * @file ServerHttpInitializer.java
 * *****************************************************************************
 * @attention Copyright (c) 2026
 * All rights reserved.
 * This software is licensed under the terms described in the LICENSE file
 * located in the root directory of this project.
 * If no LICENSE file is present, this software is provided "AS IS",
 * without warranty of any kind, express or implied.
 * *****************************************************************************
 *
 * Listens on port 80.
 *
 * Behavior depends on UssoiStrings.HTTPS_ENABLED:
 *   - true  : acts as a pure redirector, bouncing every request to HTTPS.
 *   - false : serves the full application pipeline directly over plaintext
 *             (HTTPS is turned off entirely, port 443 is never bound).
 */

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;

import java.nio.file.Path;

import static ussoi.UssoiStrings.HTTPS_ENABLED;

public class ServerHttpInitializer extends ChannelInitializer<Channel> {

    Path root = Path.of("..", "web", "dist")
            .toAbsolutePath()
            .normalize();

    @Override
    protected void initChannel(Channel ch) {

        ChannelPipeline p = ch.pipeline();

        if (HTTPS_ENABLED) {
            p.addLast(new HttpServerCodec());
            p.addLast(new HttpObjectAggregator(10 * 1024 * 1024));
            p.addLast(new HttpsRedirectHandler());
        } else {
            HttpPipelineBuilder.buildPipeline(p, root);
        }
    }
}