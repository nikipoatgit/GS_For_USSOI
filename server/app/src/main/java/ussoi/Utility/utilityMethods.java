package ussoi.Utility;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.ByteBufInputStream;
import io.netty.handler.codec.http.cookie.Cookie;
import io.netty.handler.codec.http.cookie.ServerCookieDecoder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Set;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file uils.java
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
public class utilityMethods {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static JsonNode parseJsonFromBody(ByteBuf content) {
        if (!content.isReadable()) {
            return null;
        }

        try (ByteBufInputStream in = new ByteBufInputStream(content, false)) {
            return MAPPER.readTree(in);
        } catch (IOException e) {
            // TODO HANDLE IT
           return null;
        }
    }

    public static String getTimestamp() {
        return DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
    }

    // TODO : ADD salt
    public static String hashString(String password) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
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
