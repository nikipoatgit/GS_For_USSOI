package ussoi.WebApp.AdminPage;

import com.fasterxml.jackson.databind.JsonNode;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.netty.handler.codec.http.HttpResponseStatus;

import ussoi.Utility.Role;
import static ussoi.Http.HttpResponseUtil.sendJson;
import static ussoi.Security.AuthenticationService.cookieSessionStore.getUserRoleFromSessionInDb;
import static ussoi.Utility.utilityMethods.extractSession;
import static ussoi.Utility.utilityMethods.parseJsonFromBinaryBody;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file admin.java
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

//{
//        "type": "user",
//        "cmd": "get"
//        }
public class Admin {
    private static final AdminComponents adminComponents = new AdminComponents();

    public static void handleAdmin(ChannelHandlerContext ctx, FullHttpRequest req){

        String token = extractSession(req.headers().get(HttpHeaderNames.COOKIE),null);


        if (token == null){
            sendJson(ctx, HttpResponseStatus.UNAUTHORIZED,"Session token / cookie missing",null);
            return;
        }

        // get role for that  token
        Role userRole = getUserRoleFromSessionInDb(token);

        // chk for role equals admin
        if (userRole != Role.ADMIN){
            sendJson(ctx, HttpResponseStatus.UNAUTHORIZED,"Admin Access Needed",null);
            return;
        }

        JsonNode ans  = parseAdminRequest(parseJsonFromBinaryBody(req.content()));

        if (ans == null){
            sendJson(ctx, HttpResponseStatus.BAD_REQUEST,"Bad Json Request",null);
            return;
        }

        sendJson(ctx,HttpResponseStatus.OK,ans,null);
    }

    public static JsonNode parseAdminRequest(JsonNode req) {

        if (req == null) return null;

        String type = req.path("type").asText(null);
        String cmd  = req.path("cmd").asText(null);

        if (type == null || cmd == null) return null;

        return switch (type) {
            case "user" -> adminComponents.handleUser(req, cmd);
            case "device" -> adminComponents.handleDevice(req, cmd);
            case "ws" -> adminComponents.handleWs(req, cmd);
            default -> null;
        };
    }
}
