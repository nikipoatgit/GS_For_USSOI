package ussoi.SessionHandler.Device.PoolRegistry;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import io.netty.channel.Channel;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.util.concurrent.GlobalEventExecutor;
import ussoi.SessionHandler.Device.DeviceSession;
import ussoi.Utility.Role;
import ussoi.Utility.ControlMessageDispatcher;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file UserWebSocketRegistry.java
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

//      {
//        "impact": 0,  ( 0 = server , 1 ... )
//        "type":"..." ( telem ,info,)
//        "data": { ... },
//        "timestamp": 1710000000
//      }
public final class ControlRegistry implements ControlMessageDispatcher {

    // userId → channel
    private final Map<String, Channel> userChannels = new ConcurrentHashMap<>();

    // level 0 -> Admin
    private final ChannelGroup level1Channels = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);

    // level 1 -> operators + Admin
    private final ChannelGroup level2Channels = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);

    // level 2 -> viewers + operators + Admin
    private final ChannelGroup level3Channels = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);

    // Device Status variables
    private volatile long lastSeen = 0;
    private static final long TIMEOUT = 3_500; // 3.5 sec



    public ControlRegistry(DeviceSession deviceSession) {
    }

    public void registerUser(String userId, Channel channel, Role role) {
        userChannels.put(userId, channel);
        System.out.println("[DEBUG] + [control] + registerUser " + userId );

        switch (role) {
            case ADMIN:
                level1Channels.add(channel);
                level2Channels.add(channel);
                level3Channels.add(channel);
                break;

            case OPERATOR:
                level2Channels.add(channel);
                level3Channels.add(channel);
                break;

            case VIEWER:
                level3Channels.add(channel);
                break;
        }

        channel.closeFuture().addListener(future -> {
            userChannels.remove(userId, channel);
            level1Channels.remove(channel);
            level2Channels.remove(channel);
            level3Channels.remove(channel);
        });
    }

    //todo  this is wrong need to change if used
    public void sendToUser(String userId, Object frame) {
        Channel ch = userChannels.get(userId);
        if (ch != null && ch.isActive()) {
            ch.writeAndFlush(frame);
        }
    }

    //todo  this is wrong need to change if used
    public void broadcastToUsers(Object frame) {
        level3Channels.writeAndFlush(frame);
    }

    public boolean isUserConnected(String userId) {
        Channel ch = userChannels.get(userId);
        return ch != null && ch.isActive();
    }

    public int noOfUsers() {
        return userChannels.size();
    }

    public boolean checkIfUserExist(String userId){
        return userChannels.containsKey(userId);
    }


    // device methods
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

    public boolean sendToDevice(JsonNode frame) {
        Channel ch = deviceChannel.get();
        if (ch == null || !ch.isActive()) return false;

        ch.writeAndFlush(new TextWebSocketFrame(frame.toString()))
                .addListener(f -> {
                    if (!f.isSuccess()) {
                        f.cause().printStackTrace();
                        deviceChannel.compareAndSet(ch, null);
                    }
                });

        return true;
    }

    public boolean isDeviceConnected() {
        Channel ch = deviceChannel.get();

        if (ch == null || !ch.isActive()) return false;

        long now = System.currentTimeMillis();
        return (now - lastSeen) < TIMEOUT;
    }

    public void updateLastSeen() {
        lastSeen = System.currentTimeMillis();
    }

    public void broadcastToAdmins(JsonNode node) {
        if (node == null) return;
        TextWebSocketFrame frame = new TextWebSocketFrame(node.toString());
        level1Channels.writeAndFlush(frame);
    }

    public void broadcastToOperators(JsonNode node) {
        if (node == null) return;
        TextWebSocketFrame frame = new TextWebSocketFrame(node.toString());
        level2Channels.writeAndFlush(frame);
    }

    public void broadcastToViewers(JsonNode node) {
        if (node == null) return;
        TextWebSocketFrame frame = new TextWebSocketFrame(node.toString());
        level3Channels.writeAndFlush(frame);
    }

    public void broadcastToAll(JsonNode node) {
        if (node == null) return;
        TextWebSocketFrame frame = new TextWebSocketFrame(node.toString());
        level3Channels.writeAndFlush(frame);
    }

    public JsonNode getControlState() {

        ObjectMapper mapper = new ObjectMapper();
        ArrayNode users = mapper.createArrayNode();

        for (String uid : userChannels.keySet()) {
            users.add(uid);
        }

        return users;
    }
}
