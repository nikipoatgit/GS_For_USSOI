import json
from channels.generic.websocket import AsyncWebsocketConsumer

GROUP1 ="js_to_client" 
GROUP2 ="client_to_js" 

class jsWsConnector(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(GROUP2, self.channel_name) #join the group2
        print("JS WS Connected") 
        await self.accept()


    async def disconnect(self, code):
        await self.channel_layer.group_discard(GROUP2, self.channel_name) # leave the gp2
        print(f"JS WS Disconnected with code : {code}")

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
    async def connect(self):
        await self.channel_layer.group_add(GROUP1, self.channel_name) # join group1
        await self.channel_layer.group_send(
            GROUP2,
            {
                "type":"sendPayload",
                "data": "{\"type\":\"1\",\"s\":\"Connected\",\"t\":\"1\"}" 
            }
        )
        await self.accept()


    async def disconnect(self, code):
        await self.channel_layer.group_discard(GROUP1, self.channel_name) # leave group1
        await self.channel_layer.group_send(
            GROUP2,
            {
                "type":"sendPayload",
                "data": "{\"type\":\"1\",\"s\":\"Not Connected\",\"t\":\"0\"}" 
            }
        )

    async def receive(self, text_data):
            await self.channel_layer.group_send(
            GROUP2,
            {
                "type":"sendPayload",
                "data": text_data
            }
        )

    async def sendPayload(self,event):
        text_data = event['data']
        await self.send(text_data)    