package ussoi.Security.AuthenticationService;

import io.netty.handler.codec.http.cookie.Cookie;
import io.netty.handler.codec.http.cookie.ServerCookieDecoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.*;
import java.util.Base64;
import java.util.Set;

import static ussoi.Storage.DB.Database.getConnection;
import static ussoi.utilityMethods.getTimestamp;

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

    public static boolean authenticate(String user, String pass) {
        String sql = "SELECT userPass_hash FROM usersIdAndPassword WHERE userId = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, user);

            try (ResultSet rs = ps.executeQuery()) {

                if (!rs.next()) {
                    return false; // user not found
                }

                String storedHash = rs.getString("userPass_hash");
                String incomingHash = hashString(pass);
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

    // TODO : ADD salt
    public static String hashString(String password) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
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
            ps.setString(3, hashString("123"));
            ps.setString(4, "admin");
            ps.setString(5, getTimestamp());

            ps.executeUpdate();
        }
    }
    public static boolean isUserValidSession(String cookieHeader) {
        // parse cookie header and validate session token
        String session = extractSession(cookieHeader);
        if (session != null) {
            return cookieSessionStore.doesUserTokenExist(session);
        }
        return false;
    }
    public static boolean isDeviceValidSession(String cookieHeader) {
        // parse cookie header and validate session token
        String session = extractSession(cookieHeader);
        if (session != null) {
            return cookieSessionStore.doesDeviceTokenExist(session);
        }
        return false;
    }

    public static String extractSession(String cookieHeader) {
        if (cookieHeader == null) return null;
        Set<Cookie> cookies = ServerCookieDecoder.STRICT.decode(cookieHeader);
        for (Cookie c : cookies) {
            if (c.name().equals("session")) {
                return c.value();
            }
        }
        return null;
    }

}
