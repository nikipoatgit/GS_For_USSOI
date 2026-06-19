package ussoi.SessionHandler.Device.PoolRegistry;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.handler.codec.http.websocketx.BinaryWebSocketFrame;
import io.netty.util.concurrent.GlobalEventExecutor;
import ussoi.Utility.Role;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file StreamWebSocketRegistry.java
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
public class StreamRegistry {
    private final Map<String, Channel> userChannels = new ConcurrentHashMap<>();
    private final ChannelGroup level1Channels = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
    private final AtomicReference<Channel> deviceChannel = new AtomicReference<>();

    public void registerDevice(Channel newChannel) {

        Channel oldChannel = deviceChannel.getAndSet(newChannel);

        if (oldChannel != null && oldChannel.isActive()) {
            oldChannel.close();
        }

        newChannel.closeFuture().addListener(f ->
                deviceChannel.compareAndSet(newChannel, null)
        );
    }

    public void registerUser(String userId, Channel channel) {
        userChannels.put(userId, channel);
        System.out.println("[DEBUG] + [stream] + registerUser " + userId );

        level1Channels.add(channel);

        channel.closeFuture().addListener(future -> {
            userChannels.remove(userId, channel);
        });
    }

    public void broadcastToUsers(ByteBuf buf) {
        level1Channels.write(
                new BinaryWebSocketFrame(
                        buf.retainedDuplicate()
                )
        );
        level1Channels.flush();
    }

    public boolean isDeviceConnected(){
        Channel ch = deviceChannel.get();
        return ch != null && ch.isActive();
    }

    public JsonNode getControlState() {

        ObjectMapper mapper = new ObjectMapper();
        ArrayNode users = mapper.createArrayNode();

        for (String uid : userChannels.keySet()) {
            users.add(uid);
        }
        System.out.println("[DEBUG] + [Stream] +  broadcastToUsers " + users  );
        return users;
    }
}
