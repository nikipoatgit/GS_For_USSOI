package ussoi.Http;

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import ussoi.Http.HttpRoute.ApiHandler;
import ussoi.Http.HttpRoute.StaticFileHandler;
import ussoi.Security.AuthenticationService.AuthGuardHandler;
import ussoi.WebSocket.WebSocketRouter;

import java.nio.file.Path;

public class ServerHttpInitializer extends ChannelInitializer<Channel> {

    @Override
    protected void initChannel(Channel ch) {
        ChannelPipeline pipeline = ch.pipeline();
        pipeline.addLast(new HttpServerCodec());
        pipeline.addLast(new HttpObjectAggregator(10 * 1024 * 1024));

        pipeline.addLast(new AuthGuardHandler());

        pipeline.addLast(new WebSocketServerProtocolHandler("/ws", null, true));
        pipeline.addLast(new WebSocketRouter());

        pipeline.addLast(new ApiHandler());

        // TODO : this path is hardcoded need to fix for distribution
        Path root = Path.of("D:/WEB/GCS_For_USSOI/server/web/dist").toAbsolutePath();
        pipeline.addLast(new StaticFileHandler(root));
    }
}
