package ussoi.SessionHandler.Device;

import java.lang.reflect.Array;
import java.util.HashMap;
import java.util.Map;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file UserUIState.java
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
public class UserUIState {

    // Device state
    public boolean paramsSet;
    public StreamMode streamMode;

    // btns
    public ActionState streamState = ActionState.IDLE;
    public ActionState recordState = ActionState.IDLE;
    // tunnelId → state
    public Map<String, ActionState> tunnelStates = new HashMap<>();
}
