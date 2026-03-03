package ussoi.SessionHandler.Registry;

import ussoi.Utility.Role;
import ussoi.SessionHandler.User.UserSession;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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

// initially I decided to make it multi sessional so -->
public  class UserSessionRegistry {
    private static final String TAG = "SessionRegistry";
    private static UserSessionRegistry Instance;

    // I am using Token - Role map but userId can be used
    private static final Map<String, Role> activeUsers = new ConcurrentHashMap<>();

    private final UserSession userSession;

    private UserSessionRegistry() {
        userSession = new UserSession();
    }

    public static UserSessionRegistry getInstance() {
        if (Instance == null) {
            Instance = new UserSessionRegistry();
        }
        return Instance;
    }

    public UserSession getUserSession(){
        return userSession;
    }

    public static void registerUser(String token, Role role) {
        activeUsers.put(token, role);
    }

    public static Role getUserRole(String token) {
        return activeUsers.get(token);
    }

    public static boolean isUserValid(String token) {
        return activeUsers.containsKey(token);
    }

    public static void removeUser(String token) {
        activeUsers.remove(token);
    }

}
