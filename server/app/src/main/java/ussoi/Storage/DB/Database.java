package ussoi.Storage.DB;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

import static ussoi.Security.AuthenticationService.AuthService.setTestAdmin;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DataBase.java
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
public final class Database {
    private static String url;

    private static Connection connection;

    public static synchronized void init() throws Exception {
        Path dbPath = Path.of("data", "users.db").toAbsolutePath();
        Files.createDirectories(dbPath.getParent());

        url = "jdbc:sqlite:" + dbPath;
        connection = DriverManager.getConnection(url);

        try (Statement stmt = connection.createStatement()) {
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS usersIdAndPassword (
                    username TEXT NOT NULL,
                    userId VARCHAR(50) UNIQUE NOT NULL,
                    userPass_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(25) NOT NULL,
                    created_at VARCHAR(25) NOT NULL,
                    PRIMARY KEY (userId)
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS userSessions (
                    session_cookie VARCHAR(255) NOT NULL,
                     userId VARCHAR(50) UNIQUE NOT NULL,
                     created_at VARCHAR(25) NOT NULL,
                    PRIMARY KEY (session_cookie)
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS deviceSessions (
                    session_cookie VARCHAR(255) NOT NULL,
                     deviceId VARCHAR(50) UNIQUE NOT NULL,
                     created_at VARCHAR(25) NOT NULL,
                    PRIMARY KEY (session_cookie)
                );
            """);

        }
        setTestAdmin();
    }


    public static Connection getNewConnection() throws SQLException {
        return DriverManager.getConnection(url);
    }

    public static Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            connection = DriverManager.getConnection(url);
        }
        return connection;
    }
}
