package ussoi;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * @file Main.java
 * *****************************************************************************
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

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.MultiThreadIoEventLoopGroup;
import io.netty.channel.nio.NioIoHandler;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import ussoi.Storage.DB.Database;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.Http.ServerHttpInitializer;
import ussoi.Http.ServerHttpsInitializer;

import java.io.File;

import static ussoi.UssoiStrings.*;

public class Main {

    public void run() throws Exception {

        // Create the multithreaded event loops for the server, shared by
        // both the HTTP (redirect) and HTTPS (application) servers.
        EventLoopGroup bossGroup = new MultiThreadIoEventLoopGroup(1, NioIoHandler.newFactory());
        EventLoopGroup workerGroup = new MultiThreadIoEventLoopGroup(NioIoHandler.newFactory());

        // Load the certificate once and share it between every TLS connection.
        // Only done when HTTPS is actually enabled — otherwise we skip
        // touching the filesystem for cert files entirely.
        SslContext sslContext = null;
        if (HTTPS_ENABLED) {
            sslContext = SslContextBuilder
                    .forServer(new File(SSL_FULLCHAIN_PATH), new File(SSL_PRIVKEY_PATH))
                    .build();
        }

        try {
            // ── Bootstrap #1: port 80.
            // Redirects to HTTPS when enabled, otherwise serves the app directly.
            ServerBootstrap httpBootstrap = new ServerBootstrap();
            httpBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new ServerHttpInitializer())
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true);

            ChannelFuture httpChannel = httpBootstrap.bind(SERVER_IP, HTTP_PORT).sync();

            if (HTTPS_ENABLED) {
                // ── Bootstrap #2: TLS port 443
                ServerBootstrap httpsBootstrap = new ServerBootstrap();
                httpsBootstrap.group(bossGroup, workerGroup)
                        .channel(NioServerSocketChannel.class)
                        .childHandler(new ServerHttpsInitializer(sslContext))
                        .option(ChannelOption.SO_BACKLOG, 128)
                        .childOption(ChannelOption.SO_KEEPALIVE, true);

                ChannelFuture httpsChannel = httpsBootstrap.bind(SERVER_IP, HTTPS_PORT).sync();

                // Wait until both server sockets are closed
                httpChannel.channel().closeFuture().sync();
                httpsChannel.channel().closeFuture().sync();
            } else {
                // HTTPS off — port 80 is the only listener
                httpChannel.channel().closeFuture().sync();
            }
        } finally {
            // TODO : log
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws Exception {
        Database.init();
        UserSessionRegistry.getInstance();
        new Main().run();
    }
}