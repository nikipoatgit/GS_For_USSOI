package ussoi.WebApp.AdminPage.Services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ussoi.Security.AuthorizationService.AckAndNack;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static ussoi.Security.AuthorizationService.AckAndNack.buildAckStatus;
import static ussoi.Storage.DB.Database.getConnection;
import static ussoi.Utility.utilityMethods.hashString;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file UserServices.java
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
public class UserServices {

    public JsonNode getUsers() {

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode root = mapper.createObjectNode();
        ArrayNode users = mapper.createArrayNode();

        String sql = "SELECT userId, username, role FROM usersIdAndPassword";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                users.add(mapper.createObjectNode()
                        .put("id", rs.getString("userId"))
                        .put("name", rs.getString("username"))
                        .put("role", rs.getString("role"))
                        .put("last_login", "####")
                        .put("active", "####"));
            }

            root.set("users", users);
            return root;

        } catch (SQLException e) {
            // todo log
            e.printStackTrace();
            return null;
        }
    }

    public JsonNode addUser(JsonNode req) {

        String userId = req.path("user_id").asText();
        String username = req.path("username").asText();
        String password = req.path("password").asText();
        String role = req.path("role").asText();

//        String sql = "INSERT INTO usersIdAndPassword (username, userId, userPass_hash, role, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(userId) DO UPDATE SET username = excluded.username, userPass_hash = excluded.userPass_hash, role = excluded.role;";
        String sql = "INSERT INTO usersIdAndPassword  (username, userId, userPass_hash, role,created_at)  VALUES (?, ?, ?, ?, ?)  ON CONFLICT(userId) DO NOTHING;";

        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {

            String hashPassword = hashString(password);

            ps.setString(1, username);
            ps.setString(2, userId);
            ps.setString(3, hashPassword);
            ps.setString(4, role);
            ps.setString(5, String.valueOf(System.currentTimeMillis()));

            int rows = ps.executeUpdate();

            if (rows == 0) {
                return buildAckStatus(AckAndNack.AckStatus.NACK, "user", "user already exists", "-1");
            }

            return buildAckStatus(AckAndNack.AckStatus.ACK, "user", "user Added", "-1");

        } catch (Exception e) {
            // todo log
            e.printStackTrace();
            return buildAckStatus(AckAndNack.AckStatus.NACK, "user", "user add failed", "-1");
        }
    }

    public JsonNode deleteUser(JsonNode req) {

        String userId = req.path("user_id").asText();

        String sql = "DELETE FROM usersIdAndPassword WHERE userId = ?";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, userId);

            int rows = ps.executeUpdate();

            if (rows == 0) {
                return buildAckStatus(AckAndNack.AckStatus.NACK, "user", "user not found", "-1");
            }

            return buildAckStatus(AckAndNack.AckStatus.ACK, "user", "user deleted", "-1");

        } catch (SQLException e) {
            // todo log
            e.printStackTrace();
            return buildAckStatus(AckAndNack.AckStatus.NACK, "user", "user delete failed", "-1");
        }
    }
}
