package ussoi.Security.AuthenticationService;

import ussoi.SessionHandler.User.RolePolicy.Role;
import ussoi.Utility.utilityMethods;

import java.sql.*;

import static ussoi.Storage.DB.Database.getConnection;
import static ussoi.Utility.utilityMethods.getTimestamp;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file AuthService.java
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
public class AuthService {
    private static final String TAG = "AuthService";

    public static boolean authenticateUser(String user, String pass) {
        String sql = "SELECT userPass_hash FROM usersIdAndPassword WHERE userId = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, user);

            try (ResultSet rs = ps.executeQuery()) {

                if (!rs.next()) {
                    return false; // user not found
                }

                String storedHash = rs.getString("userPass_hash");
                String incomingHash = utilityMethods.hashString(pass);
                return storedHash.equals(incomingHash);

            } catch (Exception e) {
               // Todo : log
                throw new RuntimeException(e);
            }
        } catch (SQLException e) {
            // Todo : log
            throw new RuntimeException(e);
        }
    }

    public static void setTestAdmin() throws Exception {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement("""
            INSERT OR IGNORE INTO usersIdAndPassword
            (username, userId, userPass_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?)
         """)) {

            ps.setString(1, "zeke");
            ps.setString(2, "123");
            ps.setString(3, utilityMethods.hashString("123"));
            ps.setString(4, "admin");
            ps.setString(5, getTimestamp());

            ps.executeUpdate();
        }
    }
    public static boolean isUserValidSession(String cookieHeader) {
        // parse cookie header and validate session token
        String session = utilityMethods.extractSession(cookieHeader);
        if (session != null) {
            return cookieSessionStore.doesUserTokenExist(session);
        }
        return false;
    }
    public static boolean isDeviceValidSession(String cookieHeader) {
        // parse cookie header and validate session token
        String session = utilityMethods.extractSession(cookieHeader);
        if (session != null) {
            return cookieSessionStore.doesDeviceTokenExist(session);
        }
        return false;
    }

    public static Role getUserRole(String userId) {
        String sql = "SELECT role FROM usersIdAndPassword WHERE userId = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, userId);

            try (ResultSet rs = ps.executeQuery()) {

                if (rs.next()) {
                    String roleString = rs.getString("role");
                    return Role.valueOf(roleString);
                } else {
                    return Role.VIEWER;
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
