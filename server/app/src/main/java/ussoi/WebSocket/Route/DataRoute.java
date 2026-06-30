package ussoi.WebSocket.Route;

import io.netty.channel.ChannelFutureListener;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.QueryStringDecoder;
import io.netty.handler.codec.http.websocketx.CloseWebSocketFrame;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.SessionHandler.Device.PoolRegistry.DataRegistry;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.WebSocket.Handler.DataHandler;
import ussoi.WebSocket.Handler.DataHandlerListener;
import ussoi.WebSocket.Handler.Device.DeviceDataHandler;

import java.util.List;

import static ussoi.Security.AuthenticationService.cookieSessionStore.getDeviceIdFromSessionInDb;
import static ussoi.UssoiStrings.MODE_CONTROL;

public class DataRoute {
    public boolean matches(String uri) {
        return uri.startsWith("/ws/data");
    }

    public void handle(ChannelHandlerContext ctx, String uri, String token) {

        if (!uri.startsWith("/ws/data?tunneltoken=")) {
            close(ctx);
            return;
        }

        // ws://server:port/ws/data?tunneltoken=abc123&tunnelname=myTunnel&deviceid=device1&mode=control or listener

        QueryStringDecoder decoder = new QueryStringDecoder(uri);

        String tunnelName =
                decoder.parameters()
                        .getOrDefault("tunnelname", List.of())
                        .stream()
                        .findFirst()
                        .orElse(null);

        String deviceId =
                decoder.parameters()
                        .getOrDefault("deviceid", List.of())
                        .stream()
                        .findFirst()
                        .orElse(null);

        String tunnelToken =
                decoder.parameters()
                        .getOrDefault("tunneltoken", List.of())
                        .stream()
                        .findFirst()
                        .orElse(null);

        String mode =
                decoder.parameters()
                        .getOrDefault("mode", List.of())
                        .stream()
                        .findFirst()
                        .orElse(null);


        if (tunnelName == null ) {
            System.out.println("tunnelName null");
            close(ctx);
            return;
        }
        if (tunnelToken == null ) {
            System.out.println("tunnelToken null");
            close(ctx);
            return;
        }
        // check for device existence
        if (deviceId == null ) {
            System.out.println("Device id null");
            close(ctx);
            return;
        }

        UserSessionRegistry registry = UserSessionRegistry.getInstance();

        DeviceSession deviceSession =  registry.getUserSession().getDeviceSession(deviceId);
        if (deviceSession == null) {
            System.out.println("DeviceSession Don't Exist");
            close(ctx);
            return;
        }

        DataRegistry dataRegistry = deviceSession.getDataRegistryInstance(tunnelName);

        if (dataRegistry == null){
            System.out.println("dataRegistry Don't Exist");
            close(ctx);
            return;
        }

        if (!dataRegistry.getTunnelToken().equals(tunnelToken)){
            System.out.println("tunnel token  invalid : "+tunnelToken);
            System.out.println("Valid  token  is  : "+dataRegistry.getTunnelToken());
            close(ctx);
            return;
        }

        if (mode == null){
            System.out.println("mode null");
            close(ctx);
        }

        assert mode != null;
        if (mode.equals(MODE_CONTROL)){
            ctx.pipeline().replace(
                    "webSocketRouter",
                    "devicedataHandler",
                    new DataHandler(dataRegistry,deviceId,tunnelName)
            );
        }
        else{
            ctx.pipeline().replace(
                    "webSocketRouter",
                    "devicedataHandler",
                    new DataHandlerListener(dataRegistry,deviceId,tunnelName)
            );
        }



    }

    private void close(ChannelHandlerContext ctx) {
        System.out.println("ws closed by deviceStreamRoute");
        ctx.writeAndFlush(new CloseWebSocketFrame()).addListener(ChannelFutureListener.CLOSE);
    }
}
