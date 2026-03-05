package ussoi.WebSocket.Registry;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.channel.Channel;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;
import io.netty.util.concurrent.GlobalEventExecutor;
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



    public ControlRegistry() {}

    public void registerUser(String userId, Channel channel, Role role) {
        userChannels.put(userId, channel);
        System.out.println("[DEBUG] + registerUser " + userId );

        switch (role) {
            case ADMIN:
                System.out.println("[DEBUG] + ADMIN");
                level1Channels.add(channel);
                level2Channels.add(channel);
                level3Channels.add(channel);
                break;

            case OPERATOR:
                System.out.println("[DEBUG] + OPERATOR");
                level2Channels.add(channel);
                level3Channels.add(channel);
                break;

            case VIEWER:
                System.out.println("[DEBUG] + VIEWER");
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

    public boolean sendToUser(String userId, Object frame) {
        Channel ch = userChannels.get(userId);
        if (ch != null && ch.isActive()) {
            ch.writeAndFlush(frame);
            return true;
        }
        return false;
    }

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

    public boolean sendTODevice(Object frame) {
        Channel ch = deviceChannel.get();
        if (ch != null && ch.isActive()) {
            ch.writeAndFlush(frame);
            return true;
        }
        return false;
    }

    public boolean isDeviceConnected() {
        Channel ch = deviceChannel.get();
        return ch != null && ch.isActive();
    }


    public void broadcastToAdmins(JsonNode node) {
        if (node == null) return;
        System.out.println("[DEBUG] lev 1, size=" + level1Channels.size());
        TextWebSocketFrame frame = new TextWebSocketFrame(node.toString());
        level1Channels.writeAndFlush(frame);
    }

    public void broadcastToOperators(JsonNode node) {
        if (node == null) return;
        System.out.println("[DEBUG] lev 2, size=" + level2Channels.size());
        TextWebSocketFrame frame = new TextWebSocketFrame(node.toString());
        level2Channels.writeAndFlush(frame);
    }

    public void broadcastToViewers(JsonNode node) {
        if (node == null) return;
        System.out.println("[DEBUG] lev 3, size=" + level3Channels.size());
        TextWebSocketFrame frame = new TextWebSocketFrame(node.toString());
        level3Channels.writeAndFlush(frame);
    }

    public void broadcastToAll(JsonNode node) {
        if (node == null) return;
        System.out.println("[DEBUG] broadcastToAll lev 3, size=" + level3Channels.size());
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
