package ussoi;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.buffer.ByteBuf;
import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.util.CharsetUtil;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

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
    public static JsonNode parseJsonFromBody(ByteBuf content) {
        ObjectMapper mapper = new ObjectMapper();
        String body = content.toString(CharsetUtil.UTF_8);

        if (body == null || body.isEmpty()) {
            // todo : null
            return null;
        }
        JsonNode jsn;

        try {
            jsn = mapper.readTree(body);
        } catch (JsonProcessingException e) {
            // todo RuntimeException
            throw new RuntimeException(e);
        }

        return jsn;
    }

    public static String getTimestamp() {
        return DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());
    }
}
