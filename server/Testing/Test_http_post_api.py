import requests
import json
import time

# ─── Global Configuration ────────────────────────────────────────────────────

HOST = "http://localhost:8000"
COOKIES = {'session': 'T6ifKMIG8-ag54IxXiwJvSxMtiIy64gcZk8QLaP1Oco'}

# ─── Request Helpers ─────────────────────────────────────────────────────────

def post(endpoint: str, payload: dict) -> requests.Response:
    url = f"{HOST}{endpoint}"
    print(f"\n→ POST {url}")
    print(f"  Payload: {json.dumps(payload, indent=2)}")
    try:
        response = requests.post(url, json=payload, cookies=COOKIES, timeout=10)
        print(f"  Status : {response.status_code}")
        print(f"  Response: {json.dumps(response.json(), indent=2)}")
        return response
    except requests.exceptions.ConnectionError:
        print(f"  [ERROR] Could not connect to {url}")
    except requests.exceptions.Timeout:
        print(f"  [ERROR] Request timed out")
    except Exception as e:
        print(f"  [ERROR] {e}")
    return None

# ─── API Calls ────────────────────────────────────────────────────────────────

def add_room():
    payload = {
        "type": "room",
        "reqId": 4516,
        "intent": "addRoom",
        "roomId": "s1",
        "roomName": "Test Room",
        "roomPassword": "123"
    }
    return post("/api/user/rooms", payload)
    


def remove_room():
    payload = {
        "type": "room",
        "reqId": 4516,
        "intent": "removeRoom",
        "roomId": "r1"
    }
    return post("/api/user/rooms", payload)


def get_rooms():
    payload = {
        "type": "room",
        "reqId": 1772304986270,
        "intent": "getRoom"
    }
    return post("/api/user/rooms", payload)


def get_devices():
    payload = {
        "reqId": 1772307138238,
        "intent": "getDevices"
    }
    return post("/api/user/devices", payload)


def user_login():
    payload = {
        "userId": "123",
        "userPass": "123"
    }
    response = post("/api/user/login", payload)
    # Store cookies from login response for subsequent requests
    if response is not None:
        COOKIES.update(response.cookies.get_dict())
        print(f"  Cookies saved: {COOKIES}")
    return response


def device_authenticate():
    payload = {
        "roomId": "s1",
        "roomPwd": "123"
    }
    return post("/api/device/authenticate", payload)

# ─── Menu ─────────────────────────────────────────────────────────────────────

MENU = """
╔══════════════════════════════════════╗
║         API Client — Select Request  ║
╠══════════════════════════════════════╣
║  1  Add Room                         ║
║  2  Remove Room                      ║
║  3  Get Rooms                        ║
║  4  Get Devices                      ║
║  5  User Login                       ║
║  6  Device Authenticate              ║
╠══════════════════════════════════════╣
║  7  Change Host URL                  ║
║  8  Set Cookie                       ║
║  0  Exit                             ║
╚══════════════════════════════════════╝
"""

def change_host():
    global HOST
    new_host = input(f"  Current host: {HOST}\n  New host: ").strip()
    if new_host:
        HOST = new_host
        print(f"  Host updated → {HOST}")

def set_cookie():
    key = input("  Cookie key  : ").strip()
    value = input("  Cookie value: ").strip()
    if key:
        COOKIES[key] = value
        print(f"  Cookie saved → {key}={value}")

def run():
    print(f"API Client started — Host: {HOST}")
    while True:
        print(MENU)
        choice = input("Select option: ").strip()

        match choice:
            case "1": add_room()
            case "2": remove_room()
            case "3": get_rooms()
            case "4": get_devices()
            case "5": user_login()
            case "6": device_authenticate()
            case "7": change_host()
            case "8": set_cookie()
            case "0":
                print("Bye!")
                break
            case _:
                print("  Invalid option, try again.")

if __name__ == "__main__":
    run()