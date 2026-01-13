# Copyright (C) 2026 Nikhil
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import json
import os
import asyncio
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs

def get_tcp_config():
    """
    Reads the TCP Host and Port from gs_config.json.
    Falls back to defaults if file is missing.
    """
    # default fallback values
    host = "127.0.0.1"
    port = 9000 

    try:
        # Try to find file next to EXE (EXTERNAL_DIR)
        config_path = os.path.join(settings.EXTERNAL_DIR, 'gs_config.json')
    except AttributeError:
        # Fallback for dev mode (BASE_DIR)
        config_path = os.path.join(settings.BASE_DIR, 'gs_config.json')

    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                data = json.load(f)
                # Fetch keys: "TCP_host" and "TCP_port"
                host = data.get("TCP_host", host)
                port = data.get("TCP_port", port)
        except Exception as e:
            print(f"[!] Error reading config for TCP: {e}")

    return host, port

class telemetryWebSocketConnector(AsyncWebsocketConsumer):
    tcp_server = None
    mission_planner_writer = None
    connected_websockets = set()

    active_ws = None
    lock = asyncio.Lock()
    tcp_lock = asyncio.Lock()

    @classmethod
    async def handle_tcp_connection(cls, reader, writer):
        peername = writer.get_extra_info('peername')

        # FCFS: reject if already occupied
        if cls.mission_planner_writer is not None:
            print(f"Rejected TCP client {peername} (slot occupied)")
            writer.close()
            await writer.wait_closed()
            return

        print(f"Mission Planner accepted from {peername}")
        cls.mission_planner_writer = writer

        try:
            while True:
                data = await asyncio.wait_for(reader.read(8192), timeout=15)
                if not data:
                    break

                for ws in list(cls.connected_websockets):
                    try:
                        await ws.send(bytes_data=data)
                    except Exception:
                        cls.connected_websockets.discard(ws)

        except asyncio.TimeoutError:  
            print("TCP timeout")                 

        except Exception as e:
            print(f"TCP error: {e}")

        finally:
            print("Mission Planner disconnected")
            cls.mission_planner_writer = None
            writer.close()
            await writer.wait_closed()


    async def connect(self):
        async with self.lock:
            if telemetryWebSocketConnector.active_ws is not None:
                await self.close(code=4001)  
                return
            telemetryWebSocketConnector.active_ws = self
        await self.accept()
        print("WebSocket connected")
        telemetryWebSocketConnector.connected_websockets.add(self)
        if telemetryWebSocketConnector.tcp_server is None:
            TCP_HOST, TCP_PORT = get_tcp_config()
            try:
                print(f"Starting TCP server on {TCP_HOST}:{TCP_PORT}...")
                server = await asyncio.start_server(
                    telemetryWebSocketConnector.handle_tcp_connection, TCP_HOST, TCP_PORT
                )
                telemetryWebSocketConnector.tcp_server = server
                print("TCP Server is running. Waiting for Mission Planner to connect.")
            except OSError as e:
                print(f"Could not start TCP server: {e}. It might already be running.")
        else:
            print("TCP server is already running.")



    async def disconnect(self, close_code):
        async with self.lock:
            if telemetryWebSocketConnector.active_ws is self:
                telemetryWebSocketConnector.active_ws = None
        print("WebSocket disconnected")
        telemetryWebSocketConnector.connected_websockets.discard(self)


    async def receive(self, text_data=None, bytes_data=None):
        """
        Called when the WebSocket receives data. Forwards it to Mission Planner.
        """
        if bytes_data and telemetryWebSocketConnector.mission_planner_writer:
            writer = telemetryWebSocketConnector.mission_planner_writer
            if not writer.is_closing():
                writer.write(bytes_data)
                await writer.drain()
        


ACTIVE = {
    "fc": None,
    "mp": None,
    "listen": set(),
}


class UartTunnelConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # default mode
        self.mode = "listen"

        raw_qs = self.scope.get("query_string", b"").decode()
        query = parse_qs(raw_qs)
        mode = query.get("mode", [None])[0]

        if mode in ("fc", "mp", "listen"):
            self.mode = mode

        # enforce singleton roles
        if self.mode in ("fc", "mp"):
            if ACTIVE[self.mode] is not None:
                print(f"[REJECT] {self.mode.upper()} already connected")
                await self.close(code=4002)
                return
            ACTIVE[self.mode] = self.channel_name

        elif self.mode == "listen":
            ACTIVE["listen"].add(self.channel_name)

        await self.accept()

        # ---- CONNECT LOGS ----
        if self.mode == "fc":
            print("Flight Controller connected")
        elif self.mode == "mp":
            print(" Mission Planner connected")
        else:
            print("Listener connected")

    async def disconnect(self, code):
        mode = getattr(self, "mode", None)
        if not mode:
            return

        # ---- DISCONNECT LOGS ----
        if mode == "fc":
            if ACTIVE["fc"] == self.channel_name:
                ACTIVE["fc"] = None
                print("Flight Controller disconnected")

        elif mode == "mp":
            if ACTIVE["mp"] == self.channel_name:
                ACTIVE["mp"] = None
                print(" Mission Planner disconnected")

        elif mode == "listen":
            if self.channel_name in ACTIVE["listen"]:
                ACTIVE["listen"].discard(self.channel_name)
                print("Listener disconnected")
            

    async def receive(self, text_data=None, bytes_data=None):
        payload = text_data if text_data is not None else bytes_data
        if payload is None:
            return

        if self.mode == "fc":
            # fc → mp
            if ACTIVE["mp"]:
                await self.channel_layer.send(
                    ACTIVE["mp"],
                    {"type": "uart.message", "data": payload},
                )

            # fc → listeners
            for ch in ACTIVE["listen"]:
                await self.channel_layer.send(
                    ch,
                    {"type": "uart.message", "data": payload},
                )

        elif self.mode == "mp":
            # mp → fc
            if ACTIVE["fc"]:
                await self.channel_layer.send(
                    ACTIVE["fc"],
                    {"type": "uart.message", "data": payload},
                )

        # listen mode is receive-only

    async def uart_message(self, event):
        data = event.get("data")

        if isinstance(data, bytes):
            await self.send(bytes_data=data)
        else:
            await self.send(text_data=data)
