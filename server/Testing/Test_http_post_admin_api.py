import requests
import json

HOST = "http://localhost:8000"
COOKIES = {}

TIMEOUT = 5


# ─────────────────────────────────────
# HTTP helper
# ─────────────────────────────────────

def post(endpoint, payload):

    url = f"{HOST}{endpoint}"

    print("\n→ POST", url)
    print("Payload:", json.dumps(payload, indent=2))

    try:

        r = requests.post(
            url,
            json=payload,
            cookies=COOKIES,
            timeout=TIMEOUT
        )

        print("Status :", r.status_code)

        try:
            body = r.json()
            print("Response:", json.dumps(body, indent=2))
        except json.JSONDecodeError:
            print("Response (non-json):", r.text)

        return r

    except requests.exceptions.ConnectTimeout:
        print("[ERROR] connection timeout")

    except requests.exceptions.ReadTimeout:
        print("[ERROR] server did not respond in time")

    except requests.exceptions.ConnectionError:
        print("[ERROR] cannot connect to server")

    except requests.exceptions.HTTPError as e:
        print("[HTTP ERROR]", e)

    except Exception as e:
        print("[UNKNOWN ERROR]", str(e))

    return None


# ─────────────────────────────────────
# LOGIN
# ─────────────────────────────────────

def login():

    payload = {
        "userId": "100",
        "userPass": "100"
    }

    r = post("/api/user/login", payload)

    if r is not None:
        COOKIES.update(r.cookies.get_dict())
        print("Session cookie:", COOKIES)


# ─────────────────────────────────────
# ADMIN APIs
# ─────────────────────────────────────

def get_users():

    payload = {
        "type": "user",
        "cmd": "get"
    }

    post("/api/admin", payload)


def add_user():

    user_id = int(input("Enter user_id: ").strip())
    username = input("Enter username: ").strip()
    password = input("Enter password: ").strip()

    role_options = ["admin", "operator", "viewer"]
    print("Available roles:", role_options)
    role = input("Enter role: ").strip().lower()

    if role not in role_options:
        raise ValueError("Invalid role")

    payload = {
        "type": "user",
        "cmd": "add",
        "user_id": user_id,
        "username": username,
        "password": password,
        "role": role
    }

    post("/api/admin", payload)


def delete_user():

    payload = {
        "type": "user",
        "cmd": "delete",
        "user_id": 201
    }

    post("/api/admin", payload)


def get_ws():

    payload = {
        "type": "ws",
        "cmd": "get"
    }

    post("/api/admin", payload)


def get_devices():

    payload = {
        "type": "device",
        "cmd": "get"
    }

    post("/api/admin", payload)


# ─────────────────────────────────────
# MENU
# ─────────────────────────────────────

MENU = """
1  Login
2  Get Users
3  Add User
4  Delete User
5  Get WS Status
6  Get Devices
0  Exit
"""


def run():

    while True:

        print(MENU)
        choice = input("Select: ").strip()

        if choice == "1":
            login()

        elif choice == "2":
            get_users()

        elif choice == "3":
            add_user()

        elif choice == "4":
            delete_user()

        elif choice == "5":
            get_ws()

        elif choice == "6":
            get_devices()

        elif choice == "0":
            break

        else:
            print("Invalid option")


if __name__ == "__main__":
    run()