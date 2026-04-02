package ussoi.Http;

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import ussoi.SessionHandler.ApiHandler;
import ussoi.WebSocket.Route.WebSocketRouter;
import ussoi.Security.AuthenticationService.WebSocketAuthHandler;

import java.nio.file.Path;

public class ServerHttpInitializer extends ChannelInitializer<Channel> {

    @Override
    protected void initChannel(Channel ch) {

        ChannelPipeline p = ch.pipeline();

        p.addLast(new HttpServerCodec());
        p.addLast(new HttpObjectAggregator(10 * 1024 * 1024));

        p.addLast(new ApiHandler());

        p.addLast(new WebSocketServerProtocolHandler(
                        "/ws",          // base websocket path
                        null,           // subprotocols
                        true,           // checkStartsWith → allow /ws/*
                        65536,          // max frame payload length
                        true,           // allow extensions
                        true,           // allow mask mismatch
                        true           // don't forward pong frames DownStream
                )
        );
        p.addLast(new WebSocketAuthHandler());
        p.addLast("webSocketRouter", new WebSocketRouter());

        Path root = Path.of("/home/nikipo/user/WEB/GCS_For_USSOI/server/web/dist");
        p.addLast(new StaticFileHandler(root));
    }
}
