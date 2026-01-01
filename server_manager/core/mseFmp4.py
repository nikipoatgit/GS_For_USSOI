
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