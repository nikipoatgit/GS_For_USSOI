import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer

GROUP1 ="js_to_client" 
GROUP2 ="client_to_js" 

class jsWsConnector(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(GROUP2, self.channel_name) #join the group2
        print("Host Connected") 
        await self.accept()


    async def disconnect(self, code):
        await self.channel_layer.group_discard(GROUP2, self.channel_name) # leave the gp2
        print(f"Host Disconnected  code : {code}")

    async def receive(self, text_data):
            await self.channel_layer.group_send(
            GROUP1,
            {
                "type":"sendPayload",
                "data": text_data
            }
        )

    async def sendPayload(self,event):
        text_data = event['data']
        await self.send(text_data)


class clientWsConnector(AsyncWebsocketConsumer):
    active_ws = None
    lock = asyncio.Lock()

    async def connect(self):
        async with self.lock:
            if clientWsConnector.active_ws is not None:
                await self.close(code=4001)   
                return
            clientWsConnector.active_ws = self

        await self.channel_layer.group_add(GROUP1, self.channel_name)

        await self.channel_layer.group_send(
            GROUP2,
            {
                "type": "sendPayload",
                "data": "{\"type\":\"clientStatus\",\"s\":\"Connected\",\"t\":\"1\"}"
            }
        )

        print("Client Connected")
        await self.accept()


    async def disconnect(self, code):
        was_active = False

        async with self.lock:
            if clientWsConnector.active_ws is self:
                clientWsConnector.active_ws = None
                was_active = True

        await self.channel_layer.group_discard(GROUP1, self.channel_name)

        if was_active:
            await self.channel_layer.group_send(
                GROUP2,
                {
                    "type": "sendPayload",
                    "data": "{\"type\":\"clientStatus\",\"s\":\"Not Connected\",\"t\":\"0\"}"
                }
            )

        print("Client Disconnected")



    async def receive(self, text_data):
        await self.channel_layer.group_send(
            GROUP2,
            {
                "type": "sendPayload",
                "data": text_data
            }
        )

    async def sendPayload(self, event):
        await self.send(text_data=event["data"])  