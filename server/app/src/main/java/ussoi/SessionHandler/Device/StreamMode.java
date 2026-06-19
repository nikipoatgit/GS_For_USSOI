package ussoi.SessionHandler.Device;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file StreamMode.java
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
public enum StreamMode {
    WebRtc,
    H264,
    HFH264,
    None;

    public static StreamMode fromString(String value) {
        if (value == null) return None;

        switch (value.toLowerCase()) {
            case "webrtc": return WebRtc;
            case "h264": return H264;
            case "hfh264": return HFH264;
            case "none": return None;
            default: return null;
        }
    }
}
