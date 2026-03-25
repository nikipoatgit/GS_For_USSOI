package ussoi.Device;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import ussoi.Http.HttpResponseUtil;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.SessionHandler.User.UserSession;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static ussoi.Security.AuthenticationService.Cryptography.getPublicKeyString;
import static ussoi.Security.AuthenticationService.Cryptography.rsaDecrypt;
import static ussoi.Security.AuthenticationService.cookieSessionStore.*;
import static ussoi.Security.AuthenticationService.cookieSessionStore.generateSecureToken;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file HandleDeviceAuth.java
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
public class HandleDeviceAuth {

    // TODO Update this to more robust mechanism
    private static final ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();

    public static void authenticateDevice(ChannelHandlerContext ctx, FullHttpRequest req) {

        String json = req.content().toString(StandardCharsets.UTF_8);

        try {
            JsonNode body = mapper.readTree(json);

            JsonNode typeNode = body.get("type");

            if (typeNode == null || typeNode.asText().isEmpty()) {
                HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST, "Missing type");
                return;
            }

            String type = typeNode.asText();

            switch (type) {
                case "getKey":
                    getPublicKey(ctx);
                    break;
                case "login":
                    validateLogin(ctx, body);
                    break;
                default:
                    HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST, "Invalid type");
            }

        } catch (Exception e) {
            System.out.println(e);
            // TODO LOG
            HttpResponseUtil.sendError(ctx,HttpResponseStatus.BAD_REQUEST,"Invalid JSON");
        }
    }

    private static final ObjectMapper mapper = new ObjectMapper();

    private static void getPublicKey(ChannelHandlerContext ctx) {

        String newDeviceId;

        do {
            newDeviceId = generateSecureToken();
        } while (doesDeviceIDExistInDb(newDeviceId) ||  map.containsKey(newDeviceId));

        //  addOrUpdateDeviceSessionTokenInDb(newToken,newDeviceId);

        String challenge = generateSecureToken();

        map.put(newDeviceId,challenge);

        //TODO  implement expiry logic
        long expiresAt = System.currentTimeMillis() + 60_000; // 60 sec

        Map<String, Object> payload = Map.of(
                "publicKey", getPublicKeyString(),
                "deviceId", newDeviceId,
                "challenge", challenge,
                "expiresAt", expiresAt
        );

        HttpResponseUtil.sendJson(ctx, HttpResponseStatus.OK, payload, null);
    }

    private static void validateLogin(ChannelHandlerContext ctx,JsonNode body) {
        JsonNode deviceIdNode = body.get("deviceId");
        JsonNode deviceNameNode = body.get("deviceName");
        JsonNode dataNode = body.get("data");

        if (deviceIdNode == null || dataNode == null || deviceNameNode == null) {
            HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST, "Missing fields");
            return;
        }

        String deviceId = deviceIdNode.asText();
        String deviceName = deviceNameNode.asText();
        String encrypted = dataNode.asText();

        try {
            String decryptedJson = rsaDecrypt(encrypted);
            JsonNode decrypted = mapper.readTree(decryptedJson);

            String roomId = decrypted.get("roomId").asText();
            String roomPwd = decrypted.get("roomPwd").asText();
            String challenge = decrypted.get("challenge").asText();
            long timestamp = decrypted.get("timestamp").asLong();

            String pendingChallenge = map.remove(deviceId);

            if (pendingChallenge == null) {
                HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST, "DeviceId Not Found");
                return;
            }

            if (!pendingChallenge.equals(challenge)) {
                HttpResponseUtil.sendError(ctx, HttpResponseStatus.UNAUTHORIZED, "Challenge mismatch");
                return;
            }

            // remove key form hash map
            map.remove(deviceId);

            if (Math.abs(System.currentTimeMillis() - timestamp) > 30_000) {
                HttpResponseUtil.sendError(ctx, HttpResponseStatus.UNAUTHORIZED, "Stale request");
                return;
            }

            UserSession userSession = UserSessionRegistry.getInstance().getUserSession();

            // chk room details
            if (!userSession.validateRoomExistenceAndPwd(roomId, roomPwd)) {
                HttpResponseUtil.sendError(ctx, HttpResponseStatus.UNAUTHORIZED, "Invalid room credentials");
                return;
            }

            String token = generateSecureToken();
            System.out.println(token);

            addOrUpdateDeviceSessionTokenInDb(token, deviceId);

            if (!userSession.addDeviceToRoom(roomId, deviceId,deviceName)) {
                HttpResponseUtil.sendError(ctx, HttpResponseStatus.INTERNAL_SERVER_ERROR, "Room attach failed");
                return;
            }

            Map<String, Object> payload = Map.of(
                    "deviceToken", token,
                    "deviceId", deviceId
            );

            HttpResponseUtil.sendJson(ctx, HttpResponseStatus.OK, payload, null);

        } catch (Exception e) {
            HttpResponseUtil.sendError(ctx, HttpResponseStatus.BAD_REQUEST, "Decryption failed");
        }

    }
}
