package ussoi.Security.AuthenticationService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ussoi.Utility.Role;
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

    public static void setTestUsers() throws Exception {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement("""
            INSERT OR IGNORE INTO usersIdAndPassword
            (username, userId, userPass_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?)
         """)) {

            // ADMIN
            ps.setString(1, "Admin");
            ps.setString(2, "100");
            ps.setString(3, utilityMethods.hashString("100"));
            ps.setString(4, Role.ADMIN.name());
            ps.setString(5, getTimestamp());
            ps.addBatch();

            // OPERATOR
            ps.setString(1, "operator1");
            ps.setString(2, "200");
            ps.setString(3, utilityMethods.hashString("200"));
            ps.setString(4, Role.OPERATOR.name());
            ps.setString(5, getTimestamp());
            ps.addBatch();

            // VIEWER
            ps.setString(1, "viewer1");
            ps.setString(2, "300");
            ps.setString(3, utilityMethods.hashString("300"));
            ps.setString(4, Role.VIEWER.name());
            ps.setString(5, getTimestamp());
            ps.addBatch();

            ps.executeBatch();
        }
    }
    public static boolean isUserSessionValid(String cookieHeader) {
        // parse cookie header and validate session token
        String session = utilityMethods.extractSession(cookieHeader);
        if (session != null) {
            return cookieSessionStore.doesUserTokenExistInDb(session);
        }
        return false;
    }
    public static boolean isDeviceSessionValid(String cookieHeader) {
        // parse cookie header and validate session token
        String session = utilityMethods.extractSession(cookieHeader);
        if (session != null) {
            return cookieSessionStore.doesDeviceTokenExistInDb(session);
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
                    return  Role.valueOf(roleString.toUpperCase());
                } else {
                    return Role.VIEWER;
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public static ObjectNode buildControlUsers(ArrayNode uids,boolean isDeviceAlive) {

        ObjectMapper mapper = new ObjectMapper();

        ArrayNode admins = mapper.createArrayNode();
        ArrayNode operators = mapper.createArrayNode();
        ArrayNode viewers = mapper.createArrayNode();

        String sql = "SELECT username, role FROM usersIdAndPassword WHERE userId = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (JsonNode uidNode : uids) {

                String uid = uidNode.asText();
                ps.setString(1, uid);

                try (ResultSet rs = ps.executeQuery()) {

                    if (rs.next()) {

                        String uname = rs.getString("username");
                        String role = rs.getString("role");

                        ObjectNode user = mapper.createObjectNode();
                        user.put("uid", uid);
                        user.put("uname", uname);

                        switch (role.toUpperCase()) {
                            case "ADMIN":
                                admins.add(user);
                                break;

                            case "OPERATOR":
                                operators.add(user);
                                break;

                            default:
                                viewers.add(user);
                        }
                    }
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        ObjectNode control = mapper.createObjectNode();
        control.set("admins", admins);
        control.set("operators", operators);
        control.set("viewers", viewers);
        control.put("device", isDeviceAlive);

        return control;
    }

}
