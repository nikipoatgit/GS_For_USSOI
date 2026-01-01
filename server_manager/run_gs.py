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

import os
import sys
import json
import django
import secrets
import urllib.request
from pathlib import Path
from daphne.server import Server
from django.conf import settings as dj_settings
from django.core.management import call_command

CURRENT_VERSION = "2.0.0"
REPO_API_URL = "https://api.github.com/repos/nikipoatgit/GS_For_USSOI/releases/latest"

CONFIG_FILE = "gs_config.json"

if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_PATH = os.path.join(BASE_DIR, CONFIG_FILE)

def check_for_updates():
    try:
        req = urllib.request.Request(REPO_API_URL)
        req.add_header("User-Agent", "python-urllib")
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            latest_tag = data.get("tag_name", "0.0.0")
            if latest_tag.lstrip("v") > CURRENT_VERSION.lstrip("v"):
                print(f"   UPDATE AVAILABLE: {latest_tag}")
                print(f"   Download at: {data.get('html_url')}")
                try:
                    import ctypes
                    ctypes.windll.user32.MessageBoxW(
                        0,
                        f"New version {latest_tag} is available!",
                        "Update Alert",
                        0x40
                    )
                except:
                    pass
            else:
                print(f"[*] You are up to date ({CURRENT_VERSION}).\n")
    except:
        print("[!] Could not check for updates. Skipping.\n")

if not os.path.exists(CONFIG_PATH):
    config = {}
else:
    with open(CONFIG_PATH, "r") as f:
        config = json.load(f)

changed = False

defaults = {
    "host": "127.0.0.1",
    "port": 8000,
    "TCP_host": "127.0.0.1",
    "TCP_port": 8001,
    "debug": False,
   "roomId": "haki",
    "roomPwd": "haki",
    "adminUsername": "pbkdf2_sha256$870000$es1fV6a3ngHqHwXNAEqvRI$S5xmByoZ0T/zrys4Z5l4JKZgPAR0I02NZxPU+f6YAjE=",
    "adminPassword": "pbkdf2_sha256$870000$BF1iIyQNzsBWLaV3eJYEYS$gxJd+gAQcfUTf6616VAZjYV9h/gpPHz5TW6PoCH/5HI=",
    "allowed_hosts": ["*"],
    "session_cookie_secure": True,
    "csrf_cookie_secure": True,
    "csrf_trusted_origins": [],
    "secure_proxy_ssl_header": None,
    "use_x_forwarded_host": True
}

for k, v in defaults.items():
    if k not in config:
        config[k] = v
        changed = True

if "secret_key" not in config:
    config["secret_key"] = secrets.token_urlsafe(50)
    changed = True

if changed:
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=4)

HOST = config["host"]
PORT = config["port"]

print("\n========================================")
print("   USSOI GROUND SERVER")
print(f"[*] Web Server: http://{HOST}:{PORT}")

sys.path.append(BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "server_manager.settings")

dj_settings.ALLOWED_HOSTS = config["allowed_hosts"]
dj_settings.SESSION_COOKIE_SECURE = config["session_cookie_secure"]
dj_settings.CSRF_COOKIE_SECURE = config["csrf_cookie_secure"]
dj_settings.CSRF_TRUSTED_ORIGINS = config["csrf_trusted_origins"]
dj_settings.USE_X_FORWARDED_HOST = config["use_x_forwarded_host"]

if config["secure_proxy_ssl_header"]:
    dj_settings.SECURE_PROXY_SSL_HEADER = tuple(config["secure_proxy_ssl_header"])

django.setup()

def ensure_db_ready():
    db_name = dj_settings.DATABASES["default"]["NAME"]
    db_path = Path(db_name)
    if db_path.suffix != ".sqlite3":
        return
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if not db_path.exists():
        call_command("migrate", interactive=False, verbosity=0)

ensure_db_ready()


def run_daphne():
    print("[*] Server Started ~ Press Ctrl + C to exit")
    print("========================================\n")
    from server_manager.asgi import application
    endpoint = f"tcp:port={PORT}:interface={HOST}"
    Server(application=application, endpoints=[endpoint]).run()

if __name__ == "__main__":
    check_for_updates()
    run_daphne()
