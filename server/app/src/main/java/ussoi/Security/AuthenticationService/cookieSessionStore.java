package ussoi.Security.AuthenticationService;

import java.security.SecureRandom;
import java.sql.*;
import java.util.Base64;

import static ussoi.Storage.DB.Database.getConnection;
import static ussoi.Utility.utilityMethods.getTimestamp;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file SessionStore.java
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
public class cookieSessionStore {
    private static final String TAG = "SessionStore";

    public static String getUserIdFromSession(String sessionKey) {
        final String sql =
                "SELECT userId FROM userSessions WHERE session_cookie = ? LIMIT 1";

        try (Connection connection = getConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {

            ps.setString(1, sessionKey);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getString("userId") : null;
            }

        } catch (SQLException e) {
            //TODO log ??
            throw new RuntimeException("Failed to fetch userId from session", e);
        }
    }

    public static boolean doesUserTokenExist(String token) {

        if (token == null || token.isBlank()) {
            return false;
        }

        String sql = "SELECT 1 FROM userSessions WHERE session_cookie = ? LIMIT 1";

        try (Connection connection = getConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {

            ps.setString(1, token);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();   // true if token exists
            }

        } catch (SQLException e) {
            throw new RuntimeException("Device token validation failed", e);
        }
    }

    public static void addOrUpdateUserSessionToken(String sessionKey, String userId) {
        final String deleteOld =
                "DELETE FROM userSessions WHERE userId = ?";
        final String insert =
                "INSERT INTO userSessions (session_cookie, userId, created_at) VALUES (?, ?, ?)";

        try (Connection connection = getConnection()) {
            connection.setAutoCommit(false);

            try (PreparedStatement ps1 = connection.prepareStatement(deleteOld);
                 PreparedStatement ps2 = connection.prepareStatement(insert)) {

                ps1.setString(1, userId);
                ps1.executeUpdate();

                ps2.setString(1, sessionKey);
                ps2.setString(2, userId);
                ps2.setString(3, getTimestamp());
                ps2.executeUpdate();

                connection.commit();
            } catch (SQLException e) {
                //TODO log ??
                connection.rollback();
                throw e;
            }

        } catch (SQLException e) {
            //TODO log ??
            throw new RuntimeException("Failed to create session", e);
        }
    }
    public static String getDeviceIdFromSession(String token) {

        if (token == null || token.isBlank()) {
            return null;
        }

        String sql = "SELECT deviceId FROM deviceSessions WHERE session_cookie = ? LIMIT 1";

        try (Connection connection = getConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {

            ps.setString(1, token);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("deviceId");
                }
                return null;
            }

        } catch (SQLException e) {
            // TODO LOG
            throw new RuntimeException("Device token lookup failed", e);
        }
    }

    public static boolean doesDeviceIDExist(String deviceId) {

        if (deviceId == null || deviceId.isBlank()) {
            return false;
        }

        String sql = "SELECT 1 FROM deviceSessions WHERE deviceId = ? LIMIT 1";

        try (Connection connection = getConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {

            ps.setString(1, deviceId);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();   // deviceId if token exists
            }

        } catch (SQLException e) {
            throw new RuntimeException("Device token validation failed", e);
        }
    }

    public static boolean doesDeviceTokenExist(String token) {

        if (token == null || token.isBlank()) {
            return false;
        }

        String sql = "SELECT 1 FROM deviceSessions WHERE session_cookie = ? LIMIT 1";

        try (Connection connection = getConnection();
             PreparedStatement ps = connection.prepareStatement(sql)) {

            ps.setString(1, token);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();   // true if token exists
            }

        } catch (SQLException e) {
            throw new RuntimeException("Device token validation failed", e);
        }
    }

    public static void addOrUpdateDeviceSessionToken(String newToken, String newDeviceId) {

        String deleteSql = "DELETE FROM deviceSessions WHERE deviceId = ?";
        String insertSql = "INSERT INTO deviceSessions (session_cookie, deviceId, created_at) VALUES (?, ?, ?)";

        try (Connection connection = getConnection()) {

            connection.setAutoCommit(false);

            try (PreparedStatement deleteStmt =
                         connection.prepareStatement(deleteSql);
                 PreparedStatement insertStmt =
                         connection.prepareStatement(insertSql)) {

                // Remove old session
                deleteStmt.setString(1, newDeviceId);
                deleteStmt.executeUpdate();

                // Insert new session
                insertStmt.setString(1, newToken);
                insertStmt.setString(2, newDeviceId);
                insertStmt.setString(3, getTimestamp());

                insertStmt.executeUpdate();

                connection.commit();

            } catch (SQLException e) {
                connection.rollback();
                throw e;
            }

        } catch (SQLException e) {
            throw new RuntimeException("Device session insert failed", e);
        }
    }

    public static String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }


}
