package ussoi.Device;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpResponseStatus;
import ussoi.Security.AuthenticationService.HttpResponseUtil;
import ussoi.SessionHandler.Registry.UserSessionRegistry;
import ussoi.SessionHandler.User.UserSession;

import java.nio.charset.StandardCharsets;
import java.util.Map;

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
    public static void authenticateDevice(ChannelHandlerContext ctx, FullHttpRequest req) {

        String json = req.content().toString(StandardCharsets.UTF_8);

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode body = mapper.readTree(json);


            String roomId = body.get("roomId").asText();
            String roomPwd = body.get("roomPwd").asText();

            UserSession userSession = UserSessionRegistry.getInstance().getUserSession();

            boolean valid = userSession.validateRoomExistenceAndPwd(roomId,roomPwd);

            if (valid) {
                String newToken;
                do {
                    newToken = generateSecureToken();
                } while (doesDeviceTokenExistInDb(newToken));

                String newDeviceId;

                do {
                    newDeviceId = generateSecureToken();
                } while (doesDeviceIDExistInDb(newDeviceId));

                addOrUpdateDeviceSessionTokenInDb(newToken,newDeviceId);

                // room validation done earlier
                if (userSession.addDeviceToRoom(roomId,newDeviceId)) {

                    // TODO FORCE ADD DEVICE AND REMOVE NON ACTIVE DEVICES

                    Map<String, Object> payload = Map.of("deviceToken", newToken, "deviceId", newDeviceId);

                    HttpResponseUtil.sendJson(ctx, HttpResponseStatus.OK, payload, null);
                }
                else {
                    HttpResponseUtil.sendError(ctx,HttpResponseStatus.EXPECTATION_FAILED,"Room Not Valid");
                }

            }
            else {
                HttpResponseUtil.sendError(ctx,HttpResponseStatus.BAD_REQUEST,"Invalid Room Params");
            }

        } catch (Exception e) {
            HttpResponseUtil.sendError(ctx,HttpResponseStatus.BAD_REQUEST,"Invalid JSON");
        }
    }
}
