package ussoi.SessionHandler.Device.DeviceAuth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static ussoi.Storage.DB.Database.getConnection;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file handleAuthenticate.java
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
public class HandleAuthenticate {
    public static boolean authenticateDevice(String token, String deviceId) {
        if (token == null  || deviceId == null){
            return  false;
        }

        String sql = "SELECT 1 FROM deviceSessions WHERE deviceId = ? AND session_cookie = ? LIMIT 1";

        try (Connection connection = getConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {

            ps.setString(1, deviceId);
            ps.setString(2, token);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next(); // true if match found
            }

        } catch (SQLException e) {
            //todo log
            throw new RuntimeException("Device session validation failed", e);
        }
    }

}
