package ussoi.Http;

import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.*;

import java.nio.file.Files;
import java.nio.file.Path;

public class StaticFileHandler extends SimpleChannelInboundHandler<FullHttpRequest> {

    private final Path root;

    public StaticFileHandler(Path root) {
        this.root = root;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, FullHttpRequest req) throws Exception {
        if (!req.method().equals(HttpMethod.GET)) {
            ctx.fireChannelRead(req.retain());
            return;
        }

        String uri = req.uri();
        
        // Strip query string from URI
        int q = uri.indexOf('?');
        if (q != -1) uri = uri.substring(0, q);


        if (uri.equals("/")) uri = "/index.html";

        Path file = root.resolve(uri.substring(1)).normalize();

        // handle all cases if uri : /<someGarbage>
        // For single-file React builds: serve index.html for any non-existent path
        if (!file.startsWith(root) || !Files.exists(file) || Files.isDirectory(file)) {
            file = root.resolve("index.html");
        }

        //TODO DefaultFileRegion (zero-copy sendfile)
        byte[] data = Files.readAllBytes(file);

        FullHttpResponse res = new DefaultFullHttpResponse(
                HttpVersion.HTTP_1_1,
                HttpResponseStatus.OK,
                Unpooled.wrappedBuffer(data)
        );

        res.headers().set(HttpHeaderNames.CONTENT_LENGTH, data.length);
        res.headers().set(HttpHeaderNames.CONTENT_TYPE, contentType(file));

        boolean keepAlive = HttpUtil.isKeepAlive(req);
        if (keepAlive) {
            res.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
        }

        ctx.writeAndFlush(res);
    }

    private String contentType(Path file) {
        String name = file.toString();

        if (name.endsWith(".html")) return "text/html";
        if (name.endsWith(".js")) return "application/javascript";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".json")) return "application/json";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";

        return "application/octet-stream";
    }
}