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
import ussoi.Storage.DB.Database;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.Http.ServerHttpInitializer;

import static ussoi.UssoiStrings.HTTP_IP;
import static ussoi.UssoiStrings.HTTP_PORT;

public class Main {

    public void run() throws Exception {

        // Create the multithreaded event loops for the server

        EventLoopGroup bossGroup = new MultiThreadIoEventLoopGroup(1, NioIoHandler.newFactory());
        EventLoopGroup workerGroup = new MultiThreadIoEventLoopGroup(NioIoHandler.newFactory());


        try {
            // A helper class that simplifies server configuration
            ServerBootstrap httpBootstrap = new ServerBootstrap();

            // Configure the server
            httpBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new ServerHttpInitializer()) // <-- Our handler created here
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true);

            // Bind and start to accept incoming connections.
            ChannelFuture httpChannel = httpBootstrap.bind(HTTP_IP, HTTP_PORT).sync();

            // Wait until server socket is closed
            httpChannel.channel().closeFuture().sync();
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