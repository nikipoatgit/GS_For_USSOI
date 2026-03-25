import asyncio
import json
import urllib.request
import websockets

HOST = "http://localhost:8000"
WS_HOST = "ws://localhost:8000"


# ─────────────────────────────────────
# TEST USERS
# ─────────────────────────────────────

USERS = {
    "admin2":   {"userId": "101", "userPass": "101"},
    "op1":     {"userId": "200", "userPass": "200"},
    "op2":     {"userId": "201", "userPass": "201"},
    "viewer":  {"userId": "300", "userPass": "300"},
}

ROOMS = [
    {"id": "r1", "pwd": "123"},
    {"id": "r2", "pwd": "123"},
    {"id": "r3", "pwd": "123"}
]

USER_COOKIES = {}
DEVICE_COOKIES = {}
DEVICE_IDS = {}


# ─────────────────────────────────────
# HTTP POST
# ─────────────────────────────────────

def http_post(path, payload, cookies=None):

    url = f"{HOST}{path}"

    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")

    if cookies:
        cookie_header = "; ".join(f"{k}={v}" for k, v in cookies.items())
        req.add_header("Cookie", cookie_header)

    try:

        with urllib.request.urlopen(req, timeout=5) as resp:

            raw = resp.read().decode()

            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = {"raw": raw}

            cookie = {}

            set_cookie = resp.headers.get("Set-Cookie")
            if set_cookie:
                k, v = set_cookie.split(";")[0].split("=", 1)
                cookie[k] = v

            print(f"HTTP {resp.status}")
            print("Response:", json.dumps(body, indent=2))

            return body, cookie


    except urllib.error.HTTPError as e:

        try:
            error_body = e.read().decode()
        except:
            error_body = "no response body"

        print("\nHTTP ERROR")
        print("status:", e.code)
        print("message:", error_body)

        return {}, {}

    except urllib.error.URLError as e:

        print("\nNETWORK ERROR")
        print("reason:", e.reason)

        return {}, {}

    except Exception as e:

        print("\nUNKNOWN ERROR")
        print(str(e))

        return {}, {}


# ─────────────────────────────────────
# LOGIN ALL USERS
# ─────────────────────────────────────

def login_all_users():

    for name, creds in USERS.items():

        body, cookie = http_post(
            "/api/user/login",
            {
                "userId": creds["userId"],
                "userPass": creds["userPass"]
            }
        )

        if cookie:
            USER_COOKIES[name] = cookie
            print("logged:", name, cookie)
        else:
            print("login failed:", name)


# ─────────────────────────────────────
# CREATE ROOMS
# ─────────────────────────────────────

def create_rooms():

    admin_cookie = USER_COOKIES["admin2"]

    for r in ROOMS:

        http_post(
            "/api/user/rooms",
            {
                "type":"room",
                "reqId":1,
                "intent":"addRoom",
                "roomId": r["id"],
                "roomName": r["id"],
                "roomPassword": r["pwd"]
            },
            cookies=admin_cookie
        )

        print("room created:", r["id"])


# ─────────────────────────────────────
# AUTH DEVICES
# ─────────────────────────────────────

def authenticate_devices():

    for r in ROOMS:

        resp,_ = http_post(
            "/api/device/authenticate",
            {
                "roomId": r["id"],
                "roomPwd": r["pwd"]
            }
        )

        if resp.get("deviceToken"):

            DEVICE_COOKIES[r["id"]] = {"session": resp["deviceToken"]}
            DEVICE_IDS[r["id"]] = resp["deviceId"]

            print("device:", r["id"], resp["deviceId"])


# ─────────────────────────────────────
# USER WS
# ─────────────────────────────────────

async def user_ws(user, room):

    cookie = USER_COOKIES[user]
    device_id = DEVICE_IDS[room]

    url = f"{WS_HOST}/ws/user?deviceId={device_id}"
    headers = {"Cookie": "; ".join(f"{k}={v}" for k,v in cookie.items())}

    try:

        async with websockets.connect(url, additional_headers=headers) as ws:

            print("USER CONNECTED:", user, room)

            while True:

                msg = await ws.recv()
                print("USER MSG:", user, room, msg)

    except Exception as e:
        print("USER WS ERROR:", user, e)


# ─────────────────────────────────────
# DEVICE WS
# ─────────────────────────────────────

async def device_ws(room):

    cookie = DEVICE_COOKIES[room]

    url = f"{WS_HOST}/ws/device/control"
    headers = {"Cookie": "; ".join(f"{k}={v}" for k,v in cookie.items())}

    try:

        async with websockets.connect(url, additional_headers=headers) as ws:

            print("DEVICE CONNECTED:", room)

            while True:

                telemetry = {
                    "impact":0,
                    "type":"telem",
                    "data":{
                        "temperature":24.6,
                        "humidity":48.2,
                        "voltage":12.1,
                        "current":0.42
                    },
                    "timestamp":123456
                }

                await ws.send(json.dumps(telemetry))
                await asyncio.sleep(3)

    except Exception as e:
        print("DEVICE WS ERROR:", room, e)


# ─────────────────────────────────────
# CONNECT EVERYTHING
# ─────────────────────────────────────

async def connect_all():

    tasks = []

    for room in DEVICE_IDS:

        tasks.append(asyncio.create_task(device_ws(room)))

        for user in USERS:
            tasks.append(asyncio.create_task(user_ws(user, room)))

    await asyncio.gather(*tasks)


# ─────────────────────────────────────
# MENU
# ─────────────────────────────────────

MENU = """
1 login all users
2 create 3 rooms
3 authenticate devices
4 connect all websockets
0 exit
"""


def run():

    while True:

        print(MENU)
        c = input("> ")

        if c == "1":
            login_all_users()

        elif c == "2":
            create_rooms()

        elif c == "3":
            authenticate_devices()

        elif c == "4":
            asyncio.run(connect_all())

        elif c == "0":
            break


if __name__ == "__main__":
    run()