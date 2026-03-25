package ussoi.WebApp.DevicePage;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelHandlerContext;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.Utility.Role;
import java.util.HashMap;
import java.util.Map;

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
    private final Map<String, CommandHandler> commandMap = new HashMap<>();

    private final DeviceSession deviceSession;

    public UserCommandRouter(DeviceSession deviceSession, Role userRole){
        this.deviceSession = deviceSession;

        if (userRole == Role.ADMIN || userRole == Role.OPERATOR){
            // Stream
            commandMap.put("start_stream",    deviceSession::handleStartStream);
            commandMap.put("stop_stream",     deviceSession::handleStopStream);

            // Recording
            commandMap.put("start_recording", deviceSession::handleStartRecording);
            commandMap.put("stop_recording",  deviceSession::handleStopRecording);

            // Tunnel
            commandMap.put("start_tunnel",    deviceSession::handleStartTunnel);
            commandMap.put("stop_tunnel",     deviceSession::handleStopTunnel);

            // camera
            commandMap.put("switch",          deviceSession::handleSwitch);

            //params
            commandMap.put("set_params",      deviceSession::handleSetParams);
        }

        // Tunnel
        commandMap.put("get_tunnels",     deviceSession::handleGetTunnels);

        // Resolution
        commandMap.put("set_stream_res",  deviceSession::handleSetStreamRes);
        commandMap.put("get_stream_res",  deviceSession::handleGetStreamRes);
        commandMap.put("set_record_res",  deviceSession::handleSetRecordRes);
        commandMap.put("get_record_res",  deviceSession::handleGetRecordRes);
        commandMap.put("get_res",         deviceSession::handleGetRes);

        // Playback / stream controls
        commandMap.put("play",            deviceSession::handlePlay);
        commandMap.put("pause",           deviceSession::handlePause);
        commandMap.put("rotate",          deviceSession::handleRotate);
        commandMap.put("mute",            deviceSession::handleMute);
        commandMap.put("flip",            deviceSession::handleFlip);


        // Params
        commandMap.put("get_params",      deviceSession::handleGetParams);

        // WebRTC
        commandMap.put("webrtc_offer",    deviceSession::handleWebrtcOffer);
        commandMap.put("webrtc_ice",      deviceSession::handleWebrtcIce);

        // sendUiStateToALl
        commandMap.put("ui_state", deviceSession::UiState);
    }

    public void route(ChannelHandlerContext ctx,String rawJson) {
        JsonNode json;
        try {
            json = mapper.readTree(rawJson);
        } catch (Exception e) {
            WsResponseHelper.sendNack(ctx, "unknown", "invalid_json");
            return;
        }

        String cmd = json.path("cmd").asText("");

        CommandHandler handler = commandMap.get(cmd);

        if (handler == null) {
            // TODO CHANGE TO NEW FORMAT
            deviceSession.sendNack(cmd, "unknown/unauthorized request");
            return;
        }

        handler.handle(json);
    }

    @FunctionalInterface
    public interface CommandHandler {
        void handle(JsonNode json);
    }

}