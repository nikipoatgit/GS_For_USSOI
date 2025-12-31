import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer

TCP_HOST = "127.0.0.1"
TCP_PORT = 9000  # port on which mission planner will connect  

class telemetryWebSocketConnector(AsyncWebsocketConsumer):
    tcp_server = None
    mission_planner_writer = None
    connected_websockets = set()

    @classmethod
    async def handle_tcp_connection(cls, reader, writer):

        peername = writer.get_extra_info('peername')
        print(f"Mission Planner connected from {peername}")
        cls.mission_planner_writer = writer

        try:
            while True:
                data = await reader.read(8192)
                if not data:
                    break
                living_clients = list(cls.connected_websockets)
                for ws_client in living_clients:
                    try:
                        await ws_client.send(bytes_data=data)
                    except Exception as e:
                        print(f"Could not send to a disconnected WebSocket. Removing it. Error: {e}")
                        cls.connected_websockets.remove(ws_client)

        except ConnectionResetError:
            print("Mission Planner connection was forcibly closed.")
        except Exception as e:
            print(f"TCP connection error: {e}")
        finally:
            print("Mission Planner disconnected.")
            cls.mission_planner_writer = None
            writer.close()
            await writer.wait_closed()

    async def connect(self):
        await self.accept()
        print("WebSocket connected")
        telemetryWebSocketConnector.connected_websockets.add(self)
        if telemetryWebSocketConnector.tcp_server is None:
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
        print("WebSocket disconnected")
        telemetryWebSocketConnector.connected_websockets.remove(self)

    async def receive(self, text_data=None, bytes_data=None):
        """
        Called when the WebSocket receives data. Forwards it to Mission Planner.
        """
        if bytes_data and telemetryWebSocketConnector.mission_planner_writer:
            writer = telemetryWebSocketConnector.mission_planner_writer
            if not writer.is_closing():
                writer.write(bytes_data)
                await writer.drain()
        elif bytes_data:
            print("Received WebSocket data, but Mission Planner is not connected.")