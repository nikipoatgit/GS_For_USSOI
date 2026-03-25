package ussoi.SessionHandler.Device;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file PendingCommand.java
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
public class PendingCommand {
    public final String cmdId;
    public final String cmd;

    public PendingCommand(String cmdId, String cmd) {
        this.cmdId = cmdId;
        this.cmd = cmd;
    }
}
