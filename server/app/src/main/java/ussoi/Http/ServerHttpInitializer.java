package ussoi.Http;

import io.netty.channel.Channel;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.SelfSignedCertificate;
import ussoi.SessionHandler.ApiHandler;
import ussoi.WebSocket.Route.WebSocketRouter;
import ussoi.Security.AuthenticationService.WebSocketAuthHandler;

import java.nio.file.Path;

public class ServerHttpInitializer extends ChannelInitializer<Channel> {

    Path root = Path.of("..", "web", "dist")
            .toAbsolutePath()
            .normalize();


    private final SslContext sslCtx;

    public ServerHttpInitializer() throws Exception {
        SelfSignedCertificate ssc = new SelfSignedCertificate();
        sslCtx = SslContextBuilder
                .forServer(ssc.certificate(), ssc.privateKey())
                .build();
    }

    @Override
    protected void initChannel(Channel ch) {

        ChannelPipeline p = ch.pipeline();

        p.addFirst(sslCtx.newHandler(ch.alloc()));

        p.addLast(new HttpServerCodec());
        p.addLast(new HttpObjectAggregator(10 * 1024 * 1024));

        p.addLast(new ApiHandler());

        p.addLast(new WebSocketServerProtocolHandler(
                "/ws",
                null,
                true,
                8 * 1024 * 1024,
                true,
                true,
                true
        ));

        p.addLast(new WebSocketAuthHandler());
        p.addLast("webSocketRouter", new WebSocketRouter());

        p.addLast(new StaticFileHandler(root));
    }
}
