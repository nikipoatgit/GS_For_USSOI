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
 * Always serves the full application pipeline directly over plaintext,
 * regardless of UssoiStrings.HTTPS_ENABLED. Plaintext HTTP is never
 * redirected to HTTPS — clients that connect on port 80 are served
 * as-is. When HTTPS_ENABLED is true, port 443 is still bound
 * separately (see ServerHttpsInitializer) as an additional option,
 * not a replacement, for port 80.
 */

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;

import java.nio.file.Path;

public class ServerHttpInitializer extends ChannelInitializer<Channel> {

    Path root = Path.of("..", "web", "dist")
            .toAbsolutePath()
            .normalize();

    @Override
    protected void initChannel(Channel ch) {

        ChannelPipeline p = ch.pipeline();

        HttpPipelineBuilder.buildPipeline(p, root);
    }
}