package ussoi.SessionHandler.Device.PoolRegistry;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.netty.buffer.ByteBuf;
import io.netty.channel.Channel;
import io.netty.channel.group.ChannelGroup;
import io.netty.channel.group.DefaultChannelGroup;
import io.netty.handler.codec.http.websocketx.BinaryWebSocketFrame;
import io.netty.util.concurrent.GlobalEventExecutor;
import ussoi.SessionHandler.Device.DeviceSession;

import java.util.concurrent.atomic.AtomicReference;

import static ussoi.Security.AuthenticationService.cookieSessionStore.generateSecureToken;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file DataWebSocketRegistry.java
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

public class DataRegistry {

    public final String tunnelName;

    private final AtomicReference<Channel> deviceNode =
            new AtomicReference<>();

    private final AtomicReference<Channel> userNode =
            new AtomicReference<>();

    private final ChannelGroup listenerNodes =
            new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);
    private final String tunnelToken;

    private final DeviceSession.SerialDataCallback serialDataCallback;


    public DataRegistry(String name,DeviceSession.SerialDataCallback callback ) {
        this.tunnelName = name;
        tunnelToken = generateSecureToken();
        this.serialDataCallback = callback;
    }

    public String getTunnelToken() {
        return tunnelToken;
    }
    public JsonNode getTunnnelDetails() {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode root = mapper.createObjectNode();
        root.put("t_name", tunnelName);
        root.put("t_token", getTunnelToken());
        return root;
    }

    public void registerDevice(Channel channel) {


        Channel old = deviceNode.getAndSet(channel);

        if (old != null &&
                old != channel &&
                old.isActive()) {
            old.close();
        }

        channel.closeFuture().addListener(f ->
                deviceNode.compareAndSet(channel, null)
        );
    }

    public void registerUser(Channel channel) {

        Channel old = userNode.getAndSet(channel);

        if (old != null &&
                old != channel &&
                old.isActive()) {
            old.close();
        }

        channel.closeFuture().addListener(f ->
                userNode.compareAndSet(channel, null)
        );
    }

    public void registerListener(Channel channel) {

        listenerNodes.add(channel);

        channel.closeFuture().addListener(f ->
                listenerNodes.remove(channel)
        );
    }


    public boolean isDeviceConnected() {
        Channel ch = deviceNode.get();
        return ch != null && ch.isActive();
    }

    public boolean isUserConnected() {
        Channel ch = userNode.get();
        return ch != null && ch.isActive();
    }

    public Channel getDevice() {
        return deviceNode.get();
    }

    public Channel getUser() {
        return userNode.get();
    }


    /**
     * Device -> User + Listeners
     */
    public void relayFromDevice(ByteBuf buf) {

        if (serialDataCallback != null) {
            serialDataCallback.accept(buf, 1); // Device -> User
        }
        Channel user = userNode.get();

        if (user != null && user.isActive()) {
            user.writeAndFlush(
                    new BinaryWebSocketFrame(
                            buf.retainedDuplicate()
                    )
            );
        }

        listenerNodes.writeAndFlush(
                new BinaryWebSocketFrame(
                        buf.retainedDuplicate()
                )
        );
    }

    /**
     * User -> Device + Listeners
     */
    public void relayFromUser(ByteBuf buf) {

        if (serialDataCallback != null) {
            serialDataCallback.accept(buf, 0); // Device -> User
        }

        Channel device = deviceNode.get();

        if (device != null && device.isActive()) {
            device.writeAndFlush(
                    new BinaryWebSocketFrame(
                            buf.retainedDuplicate()
                    )
            );
        }

        listenerNodes.writeAndFlush(
                new BinaryWebSocketFrame(
                        buf.retainedDuplicate()
                )
        );
    }
}