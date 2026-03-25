import asyncio
import json
import urllib.request
import urllib.error
import websockets

# ─── Global Configuration ────────────────────────────────────────────────────

HOST    = "http://localhost:8000"
WS_HOST = "ws://localhost:8000"

COOCKIE_USER   = {}
COOCKIE_DEVICE = {}
DEVICE_ID      = ""

USER_CREDENTIALS = {
    "1": {"role": "ADMIN",    "userId": "100", "userPass": "100"},
    "2": {"role": "OPERATOR", "userId": "200", "userPass": "200"},
    "3": {"role": "VIEWER",   "userId": "300", "userPass": "300"},
}


# ─── Utility ────────────────────────────────────────────────────────────────

def build_cookie_header(cookies: dict) -> str:
    return "; ".join(f"{k}={v}" for k, v in cookies.items())


# ─── HTTP Helper ─────────────────────────────────────────────────────────────

def http_post(path: str, payload: dict, cookies: dict = None) -> tuple[dict, dict]:
    url  = f"{HOST}{path}"
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")

    if cookies:
        req.add_header("Cookie", build_cookie_header(cookies))

    print(f"\n→ POST {url}")
    print(f"  Payload: {json.dumps(payload, indent=2)}")

    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))

            extracted_cookies = {}
            set_cookie = resp.headers.get("Set-Cookie")
            if set_cookie:
                first_part = set_cookie.split(";")[0]
                key, value = first_part.split("=", 1)
                extracted_cookies[key] = value

            print(f"  Status : {resp.status}")
            print(f"  Response: {json.dumps(body, indent=2)}")

            return body, extracted_cookies

    except urllib.error.HTTPError as e:
        print(f"  [HTTP {e.code}] {e.read().decode('utf-8')}")
        return {}, {}
    except Exception as e:
        print(f"  [ERROR] {e}")
        return {}, {}


# ─── Login ───────────────────────────────────────────────────────────────────

def login_user():
    global COOCKIE_USER

    print("""
Login As:
  1  ADMIN
  2  OPERATOR
  3  VIEWER
""")

    choice = input("Select role: ").strip()

    if choice not in USER_CREDENTIALS:
        print("Invalid selection.")
        return False

    creds = USER_CREDENTIALS[choice]

    body, cookies = http_post(
        "/api/user/login",
        {
            "userId": creds["userId"],
            "userPass": creds["userPass"]
        }
    )

    if cookies:
        COOCKIE_USER = cookies
        print(f"  ✓ Logged in as {creds['role']}")
        print(f"  ✓ Session: {COOCKIE_USER}")
        return True

    print("Login failed.")
    return False


# ─── Startup Setup ───────────────────────────────────────────────────────────

def setup():
    global COOCKIE_DEVICE, DEVICE_ID

    print("=" * 42)
    print("  Running startup setup...")
    print("=" * 42)

    # Step 0 — login
    if not login_user():
        print("Cannot continue without login.")
        return

    # Step 1 — add room
    http_post(
        "/api/user/rooms",
        {
            "type": "room",
            "reqId": 4516,
            "intent": "addRoom",
            "roomId": "r1",
            "roomName": "Test Room",
            "roomPassword": "123",
        },
        cookies=COOCKIE_USER,
    )

    # Step 2 — authenticate device
    resp, _ = http_post(
        "/api/device/authenticate",
        {"roomId": "r1", "roomPwd": "123"},
    )

    if resp.get("deviceToken") and resp.get("deviceId"):
        COOCKIE_DEVICE = {"session": resp["deviceToken"]}
        DEVICE_ID      = resp["deviceId"]
        print(f"\n  ✓ DEVICE session → {COOCKIE_DEVICE}")
        print(f"  ✓ DEVICE_ID      → {DEVICE_ID}")
    else:
        print("\n  [WARN] Device authentication failed.")

    print("=" * 42)


# ─── WebSocket Send Helper ───────────────────────────────────────────────────

async def ws_send(ws, msg: str):
    try:
        payload = json.dumps(json.loads(msg)).encode("utf-8")
        await ws.send(payload)
    except json.JSONDecodeError:
        print("  [WARN] Invalid JSON, sending as raw text")
        await ws.send(msg)


# ─── WebSocket Receive Helper ────────────────────────────────────────────────

async def ws_receive(ws):
    async for message in ws:
        if isinstance(message, bytes):
            print(f"\n  ← (bin) {message.decode('utf-8')}")
        else:
            print(f"\n  ← {message}")


# ─── WebSocket Clients ──────────────────────────────────────────────────────

async def connect_user_ws(device_id: str):
    url     = f"{WS_HOST}/ws/user?deviceId={device_id}"
    headers = {"Cookie": build_cookie_header(COOCKIE_USER)}

    print(f"\n→ Connecting to {url}")

    try:
        async with websockets.connect(url, additional_headers=headers) as ws:
            print("Connected. Type messages (exit to quit).")

            receive_task = asyncio.create_task(ws_receive(ws))

            while True:
                msg = await asyncio.get_event_loop().run_in_executor(None, input, "  → ")
                if msg.lower().strip() == "exit":
                    receive_task.cancel()
                    break
                await ws_send(ws, msg)

    except Exception as e:
        print(f"[ERROR] {e}")


async def connect_device_control_ws():
    url     = f"{WS_HOST}/ws/device/control"
    headers = {"Cookie": build_cookie_header(COOCKIE_DEVICE)}

    print(f"\n→ Connecting to {url}")

    try:
        async with websockets.connect(url, additional_headers=headers) as ws:
            print("Connected. Type messages (exit to quit).")

            receive_task = asyncio.create_task(ws_receive(ws))

            while True:
                msg = await asyncio.get_event_loop().run_in_executor(None, input, "  → ")
                if msg.lower().strip() == "exit":
                    receive_task.cancel()
                    break
                await ws_send(ws, msg)

    except Exception as e:
        print(f"[ERROR] {e}")


# ─── Menu ────────────────────────────────────────────────────────────────────

MENU = """
╔══════════════════════════════════════╗
║       WebSocket Tester               ║
╠══════════════════════════════════════╣
║  1  User WebSocket  (/ws/user)       ║
║  2  Device Control (/ws/device/control)
║  0  Exit                             ║
╚══════════════════════════════════════╝
"""


def run():
    setup()

    print(f"\nWS Tester — Host: {WS_HOST}")

    while True:
        print(MENU)
        choice = input("Select option: ").strip()

        if choice == "1":
            device_id = input(f"Enter deviceId [{DEVICE_ID}]: ").strip() or DEVICE_ID
            asyncio.run(connect_user_ws(device_id))

        elif choice == "2":
            asyncio.run(connect_device_control_ws())

        elif choice == "0":
            break

        else:
            print("Invalid option.")


if __name__ == "__main__":
    run()


 # {"impact":0,"type":"telem","data":{"temperature":24.6,"humidity":48.2,"voltage":12.1,"current":0.42},"timestamp":1710000000}   