package ussoi.WebApp.DevicePage;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file UserCommandRouter.java
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
public class UserCommandRouter {

    private static final ObjectMapper mapper = new ObjectMapper();

    // ─ Entry Point 

    public void route(ChannelHandlerContext ctx, String userId, String deviceId, String rawJson) {
        JsonNode json;
        try {
            json = mapper.readTree(rawJson);
        } catch (Exception e) {
            sendNack(ctx, "unknown", "invalid_json");
            return;
        }

        String type   = json.path("type").asText("");
        String cmd    = json.path("cmd").asText("");
        String cmdId  = json.path("cmdId").asText("unknown");

        if (!"cmd".equals(type)) {
            // Not a command from the user — ignore (telemetry etc. comes from device side)
            return;
        }

        // Authorization check before anything else
        if (!isAuthorized(userId, deviceId, cmd)) {
            sendNack(ctx, cmdId, "unauthorized");
            return;
        }

        switch (cmd) {
            //  Stream 
            case "start_stream"     -> handleStartStream(ctx, userId, deviceId, cmdId);
            case "stop_stream"      -> handleStopStream(ctx, userId, deviceId, cmdId);

            //  Record 
            case "start_recording"  -> handleStartRecording(ctx, userId, deviceId, cmdId);
            case "stop_recording"   -> handleStopRecording(ctx, userId, deviceId, cmdId);

            //  Tunnel 
            case "start_tunnel"     -> handleStartTunnel(ctx, userId, deviceId, cmdId, json.path("tunnelId").asInt(-1));
            case "stop_tunnel"      -> handleStopTunnel(ctx, userId, deviceId, cmdId, json.path("tunnelId").asInt(-1));
            case "get_tunnels"      -> handleGetTunnels(ctx, userId, deviceId, cmdId);

            //  Stream Resolution
            case "set_stream_res"   -> handleSetStreamRes(ctx, userId, deviceId, cmdId, json.path("params"));
            case "get_stream_res"   -> handleGetStreamRes(ctx, userId, deviceId, cmdId);

            //  Record Resolution
            case "set_record_res"   -> handleSetRecordRes(ctx, userId, deviceId, cmdId, json.path("params"));
            case "get_record_res"   -> handleGetRecordRes(ctx, userId, deviceId, cmdId);

            //  Playback Controls
            case "play"             -> handlePlay(ctx, userId, deviceId, cmdId);
            case "pause"            -> handlePause(ctx, userId, deviceId, cmdId);
            case "rotate"           -> handleRotate(ctx, userId, deviceId, cmdId);
            case "mute"             -> handleMute(ctx, userId, deviceId, cmdId);

            //  WebRTC 
            case "webrtc_offer"     -> handleWebrtcOffer(ctx, userId, deviceId, cmdId, json.path("payload"), json.path("timestamp").asLong());
            case "webrtc_ice"       -> handleWebrtcIce(ctx, userId, deviceId, cmdId, json.path("payload"), json.path("timestamp").asLong());

            //  Unknown
            default                 -> sendNack(ctx, cmdId, "unknown_command: " + cmd);
        }
    }

    // ─ Authorization ─

    private boolean isAuthorized(String userId, String deviceId, String cmd) {
        // TODO: plug in your real role/permission check here
        // e.g. UserSessionRegistry.getInstance().getUserSession()
        //          .getDeviceSession(deviceId).getUserRole(userId)
        return true;
    }

    // ─ Stream 

    private void handleStartStream(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: tell the device session to start streaming
            // DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).startStream();
            sendState(ctx, cmdId, 1, -1, new int[]{0, 0, 0, 0, 0});
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleStopStream(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).stopStream();
            sendState(ctx, cmdId, 0, -1, new int[]{0, 0, 0, 0, 0});
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    // ─ Record 

    private void handleStartRecording(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).startRecording();
            sendState(ctx, cmdId, 1, 1, new int[]{0, 0, 0, 0, 0});
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleStopRecording(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).stopRecording();
            sendState(ctx, cmdId, 1, 0, new int[]{0, 0, 0, 0, 0});
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    // ─ Tunnel 

    private void handleStartTunnel(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId, int tunnelId) {
        if (tunnelId < 0 || tunnelId > 4) {
            sendNack(ctx, cmdId, "invalid_tunnelId");
            return;
        }
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).startTunnel(tunnelId);
            int[] tunnels = {0, 0, 0, 0, 0};
            tunnels[tunnelId] = 1;
            sendState(ctx, cmdId, 1, -1, tunnels);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleStopTunnel(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId, int tunnelId) {
        if (tunnelId < 0 || tunnelId > 4) {
            sendNack(ctx, cmdId, "invalid_tunnelId");
            return;
        }
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).stopTunnel(tunnelId);
            sendState(ctx, cmdId, 1, -1, new int[]{0, 0, 0, 0, 0});
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleGetTunnels(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: fetch real tunnel names from device session
            String[] tunnelNames = {"tunn1", "tunn2", "tunn3"};

            ObjectNode resp = mapper.createObjectNode();
            resp.put("type", "data");
            resp.put("cmd", "tunnels");
            resp.put("cmdId", cmdId);
            resp.set("tunnels", mapper.valueToTree(tunnelNames));
            send(ctx, resp);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    // ─ Stream Resolution 

    private void handleSetStreamRes(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId, JsonNode params) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).setStreamRes(params);
            sendAck(ctx, cmdId);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleGetStreamRes(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: fetch real resolution from device session
            ObjectNode params = mapper.createObjectNode();
            params.put("width", 454);
            params.put("height", 256);
            params.put("fps", 30);
            params.put("bitrate", 1000);

            ObjectNode resp = mapper.createObjectNode();
            resp.put("type", "data");
            resp.put("cmd", "stream_res");
            resp.put("cmdId", cmdId);
            resp.set("params", params);
            send(ctx, resp);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    // ─ Record Resolution 

    private void handleSetRecordRes(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId, JsonNode params) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).setRecordRes(params);
            sendAck(ctx, cmdId);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleGetRecordRes(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: fetch real resolution from device session
            ObjectNode params = mapper.createObjectNode();
            params.put("width", 454);
            params.put("height", 256);
            params.put("fps", 30);
            params.put("bitrate", 1000);

            ObjectNode resp = mapper.createObjectNode();
            resp.put("type", "data");
            resp.put("cmd", "record_res");
            resp.put("cmdId", cmdId);
            resp.set("params", params);
            send(ctx, resp);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    // ─ Playback Controls 

    private void handlePlay(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).play();
            sendAck(ctx, cmdId);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handlePause(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).pause();
            sendAck(ctx, cmdId);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleRotate(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).rotate();
            sendAck(ctx, cmdId);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleMute(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId) {
        try {
            // TODO: DeviceSessionRegistry.getInstance().getDeviceSession(deviceId).mute();
            sendAck(ctx, cmdId);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    // ─ WebRTC ─

    private void handleWebrtcOffer(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId, JsonNode payload, long timestamp) {
        try {
            // TODO: forward the SDP offer to the device via DeviceSession
            // The device will respond asynchronously with a webrtc_answer
            // which you then forward back to this user's ctx channel
            // DeviceSessionRegistry.getInstance().getDeviceSession(deviceId)
            //     .forwardWebrtcOffer(userId, cmdId, timestamp, payload, ctx.channel());
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    private void handleWebrtcIce(ChannelHandlerContext ctx, String userId, String deviceId, String cmdId, JsonNode payload, long timestamp) {
        try {
            // TODO: forward ICE candidate to the device
            // DeviceSessionRegistry.getInstance().getDeviceSession(deviceId)
            //     .forwardWebrtcIce(userId, cmdId, timestamp, payload);
        } catch (Exception e) {
            sendNack(ctx, cmdId, e.getMessage());
        }
    }

    // ─ Response Helpers ─

    private void sendAck(ChannelHandlerContext ctx, String cmdId) {
        ObjectNode resp = mapper.createObjectNode();
        resp.put("type", "ack");
        resp.put("cmdId", cmdId);
        resp.put("reason", "");
        send(ctx, resp);
    }

    private void sendNack(ChannelHandlerContext ctx, String cmdId, String reason) {
        ObjectNode resp = mapper.createObjectNode();
        resp.put("type", "nack");
        resp.put("cmdId", cmdId);
        resp.put("reason", reason != null ? reason : "");
        send(ctx, resp);
    }

    private void sendState(ChannelHandlerContext ctx, String cmdId, int stream, int record, int[] tunnel) {
        ObjectNode controls = mapper.createObjectNode();
        controls.put("stream", stream);
        controls.put("record", record);
        controls.set("tunnel", mapper.valueToTree(tunnel));

        ObjectNode resp = mapper.createObjectNode();
        resp.put("type", "state");
        resp.put("cmdId", cmdId);
        resp.set("controls", controls);
        send(ctx, resp);
    }

    private void send(ChannelHandlerContext ctx, ObjectNode json) {
        try {
            String text = mapper.writeValueAsString(json);
            ctx.writeAndFlush(new TextWebSocketFrame(text));
        } catch (Exception e) {
            ctx.close();
        }
    }
}