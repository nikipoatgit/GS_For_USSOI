package ussoi.Utility;

import java.util.Map;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file SessionRegistry.java
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
public interface SessionRegistry<K, V> {
    boolean register(K key, V session);
    boolean unregister(K key);
    boolean isRegistered(K key);
    V getSession(K key);
    Map<K, V> getAll();
    int registrySize();
}
