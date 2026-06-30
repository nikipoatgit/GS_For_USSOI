package ussoi.SessionHandler.Device;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public final class DB {

    private DB() {}

    public static void insertDevice(Connection con,
                                    String deviceId,
                                    String deviceName,
                                    long createdAt) throws SQLException {

        String sql = """
                INSERT INTO devices(device_id, device_name, created_at)
                VALUES (?, ?, ?)
                """;

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, deviceId);
            ps.setString(2, deviceName);
            ps.setLong(3, createdAt);
            ps.executeUpdate();
        }
    }

    public static void insertMessage(Connection con,
                                     String deviceId,
                                     long timestamp,
                                     int direction,
                                     String json) throws SQLException {

        String sql = """
                INSERT INTO messages(device_id, timestamp, direction, json)
                VALUES (?, ?, ?, ?)
                """;

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, deviceId);
            ps.setLong(2, timestamp);
            ps.setInt(3, direction);
            ps.setString(4, json);
            ps.executeUpdate();
        }
    }

    public static void insertTelemetry(Connection con,
                                       String deviceId,
                                       long timestamp,
                                       int direction,
                                       byte[] data) throws SQLException {

        String sql = """
                INSERT INTO telemetry(device_id, timestamp,direction, data)
                VALUES (?, ?, ?,?)
                """;

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, deviceId);
            ps.setLong(2, timestamp);
            ps.setInt(3, direction);
            ps.setBytes(4, data);
            ps.executeUpdate();
        }
    }

    public static void insertStream(Connection con,
                                    String deviceId,
                                    long timestamp,
                                    byte[] data) throws SQLException {

        String sql = """
                INSERT INTO stream(device_id, timestamp, data)
                VALUES (?, ?, ?)
                """;

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, deviceId);
            ps.setLong(2, timestamp);
            ps.setBytes(3, data);
            ps.executeUpdate();
        }
    }
}