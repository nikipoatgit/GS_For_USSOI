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


from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio

class streamingFmp4WebsocketConnector(AsyncWebsocketConsumer): # Android to js 
    group_name = "gp1"
    active_ws = None
    lock = asyncio.Lock()

    async def connect(self):
        async with self.lock:
            if streamingFmp4WebsocketConnector.active_ws is not None:
                # Reject: slot occupied
                await self.close(code=4001)
                return

            streamingFmp4WebsocketConnector.active_ws = self

        print("streamingFmp4 connected (accepted)")
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        print(f"streamingFmp4 disconnected: {code}")

        async with self.lock:
            if streamingFmp4WebsocketConnector.active_ws is self:
                streamingFmp4WebsocketConnector.active_ws = None

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, bytes_data=None, text_data=None):
        if bytes_data:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "send_fragment",
                    "fragment": bytes_data,
                },
            )

    async def send_fragment(self, event):
        pass


class streamingFmp4WebsocketConnectorJS(AsyncWebsocketConsumer): # js to Android
    group_name = "gp1"

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def send_fragment(self, event):
        fragment = event["fragment"]
        await self.send(bytes_data=fragment)