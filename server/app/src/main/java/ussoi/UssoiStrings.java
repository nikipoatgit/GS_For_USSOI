package ussoi;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file String.java
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
public final class UssoiStrings {
    public static final int HTTP_PORT = 8000;
    public static final String HTTP_IP = "0.0.0.0";

    public static final String PARAMS_NOT_SET = "Params Not Set";
    public static final String UNKNOWN_CMD_TIMEOUT = "Unknown Command / Timeout";
    public static final String UNKNOWN_REQUEST_FORM_DEVICE = "Unknown request From Device";
    public static final String UNKNOWN_ACKNOWLEDGEMENT = "Unknown acknowledgement";
    public static final String CMD_TIMEOUT = "Request Timeout for Device";

    // ── Message types
    public static final String RESPONSE = "response";
    public static final String ERROR = "error";
    public static final String REQUEST  = "request";

    // ── Device errors
    public static final String DEVICE_OFFLINE = "Device Offline";
    public static final String DEVICE_ERROR              = "Device returned an error";

    // ── Timeout / unknown
    public static final String INVALID_PARAMS            = "Invalid or missing params";
    public static final String TUNNEL_INVALID            = "Tunnel Don't Exist";


    // Errors
    public static final String INVALID_JSON       = "invalid_json";
    public static final String UNKNOWN_CMD        = "unknown_command";
    public static final String UNAUTHORIZED       = "unauthorized";

    public static final String TYPE     = "type";
    public static final String CMD     = "cmd";
    public static final String CMD_ID  = "cmdId";
    public static final String STATUS  = "status";
    public static final String DATA    = "data";
    public static final String ERROR_MSG = "error";

    // Privileged Commands
    public static final String START_STREAM     = "start_stream";
    public static final String STOP_STREAM      = "stop_stream";

    public static final String START_RECORDING  = "start_recording";
    public static final String STOP_RECORDING   = "stop_recording";

    public static final String START_TUNNEL     = "start_tunnel";
    public static final String STOP_TUNNEL      = "stop_tunnel";

    public static final String SWITCH           = "switch";

    public static final String SET_PARAMS       = "set_params";
    public static final String SET_STREAM_RES   = "set_stream_res";
    public static final String SET_RECORD_RES   = "set_record_res";

    // Public Commands
    public static final String PLAY         = "play";
    public static final String PAUSE        = "pause";
    public static final String ROTATE       = "rotate";
    public static final String MUTE         = "mute";
    public static final String FLIP         = "flip";

    public static final String WEBRTC_SDP = "webrtc_sdp";
    public static final String WEBRTC_ICE   = "webrtc_ice";

    // Cache / Query Commands
    public static final String GET_TUNNELS  = "get_tunnels";
    public static final String GET_RES      = "get_res";
    public static final String GET_PARAMS   = "get_params";

    public static final String TELEMETRY   = "telem";

    // Status Values
    public static final String STATUS_OK    = "ok";
    public static final String STATUS_FAIL  = "fail";

    // Stream Modes
    public static final String STREAM_WEBRTC = "WEBRTC";
    public static final String STREAM_H264   = "H264";
    public static final String STREAM_HFH264 = "HFH264";
    public static final String STREAM_NONE   = "NONE";


    public static final String DEVICE_IDENTITY   = "get_identity";
    public static final String DEVICE_INFO   = "get_info";

}
