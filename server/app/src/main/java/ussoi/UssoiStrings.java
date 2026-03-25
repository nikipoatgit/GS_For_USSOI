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
    public static final String HTTP_IP = "127.0.0.1";

    public static final String PARAMS_NOT_SET = "Params Not Set";
    public static final String UNKNOWN_CMD_TIMEOUT = "Unknown Command / Timeout";
    public static final String UNKNOWN_REQUEST_FORM_DEVICE = "Unknown request From Device";
    public static final String UNKNOWN_ACKNOWLEDGEMENT = "Unknown acknowledgement";
    public static final String CMD_TIMEOUT = "Request Timeout for Device";

    // ── Message types
    public static final String ACK = "ack";
    public static final String NACK = "nack";

    // ── Device errors
    public static final String DEVICE_OFFLINE = "Device Offline";
    public static final String DEVICE_ERROR              = "Device returned an error";

    // ── Timeout / unknown
    public static final String INVALID_PARAMS            = "Invalid or missing params";
    public static final String TUNNEL_INVALID            = "Tunnel Don't Exist";


}
