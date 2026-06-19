package ussoi.WebApp.LoginPage;

import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.*;
import ussoi.Http.HttpResponseUtil;
import ussoi.Security.AuthenticationService.cookieSessionStore;

import java.util.Map;

import static ussoi.Security.AuthenticationService.AuthService.authenticateUser;
import static ussoi.Utility.utilityMethods.extractSession;
import static ussoi.Security.AuthenticationService.cookieSessionStore.*;
import static ussoi.Utility.utilityMethods.parseJsonFromBinaryBody;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file HandleUserLogin.java
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
public class HandleUserLogin {
    private static final String TAG = "HandleLogin";

    public static void handleLogin(ChannelHandlerContext ctx, FullHttpRequest req) {

        String cookieHeader = req.headers().get(HttpHeaderNames.COOKIE);
        String sessionToken = extractSession(cookieHeader,null);

        // 1If session already valid return OK
        if (cookieSessionStore.doesUserTokenExistInDb(sessionToken)) {
            HttpResponseUtil.sendJson(ctx, HttpResponseStatus.OK, Map.of("ok", true),null);
            return;
        }

        JsonNode body = parseJsonFromBinaryBody(req.content());

        // Check Credentials and issue new token
        if (body != null && checkCredentials(body)) {
            String newToken;
            do {
                newToken = generateSecureToken();
            } while (doesUserTokenExistInDb(newToken));

            String user = body.get("userId").asText().trim();
            String cookie = "session=" + newToken +"; HttpOnly; SameSite=Strict; Max-Age=604800; Path=/";

            //  add token to db
            addOrUpdateUserSessionTokenInDb(newToken,user);
            HttpResponseUtil.sendJson(ctx,HttpResponseStatus.OK, Map.of("ok", true), cookie);
            return;
        }

        // Wrong Login
        HttpResponseUtil.sendError(ctx, HttpResponseStatus.UNAUTHORIZED, "Invalid credentials");
    }

    private static boolean checkCredentials(JsonNode json) {
        if (!json.hasNonNull("userId") || !json.hasNonNull("userPass")) {
            return false;
        }

        String user = json.get("userId").asText().trim();
        String pass = json.get("userPass").asText().trim();

        if (user.isEmpty() || pass.isEmpty()) {
            return false;
        }

        return authenticateUser(user,pass);
    }

}

