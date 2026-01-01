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

import json
import os
import time
import uuid

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt, csrf_protect


SESSION_STORE = {}
FAILED_ATTEMPTS = {}

MAX_ATTEMPTS = 10
LOCK_TIME = 60


try:
    CONFIG_PATH = os.path.join(settings.EXTERNAL_DIR, "gs_config.json")
except AttributeError:
    CONFIG_PATH = os.path.join(settings.BASE_DIR.parent, "gs_config.json")


def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            pass

    return {
        "adminUsername": make_password("admin"),
        "adminPassword": make_password("admin"),
        "roomId": "123",
        "roomPwd": "123",
    }


def save_config(data):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=4)


@csrf_exempt
def authentication(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        body = json.loads(request.body.decode())
        room_id = body.get("roomId")
        room_pwd = body.get("roomPwd")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    config = load_config()

    if room_id != config["roomId"] or room_pwd != config["roomPwd"]:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    session_key = uuid.uuid4().hex
    SESSION_STORE[session_key] = {"roomId": room_id}

    return JsonResponse({"sessionKey": session_key})


@csrf_protect
def login_and_config(request):
    ip = request.META.get("REMOTE_ADDR")
    config = load_config()

    if request.session.get("is_admin"):
        return redirect("/control")

    count, last = FAILED_ATTEMPTS.get(ip, (0, 0))
    if count >= MAX_ATTEMPTS and time.time() - last < LOCK_TIME:
        return HttpResponseForbidden("Too many attempts")

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        room_id = request.POST.get("roomId")
        room_pwd = request.POST.get("roomPwd")

        reset_admin = request.POST.get("reset_admin") == "on"
        new_admin_user = request.POST.get("new_admin_user")
        new_admin_pass = request.POST.get("new_admin_pass")

        if (
            check_password(username, config["adminUsername"])
            and check_password(password, config["adminPassword"])
        ):
            if reset_admin:
                config["adminUsername"] = make_password(new_admin_user)
                config["adminPassword"] = make_password(new_admin_pass)

            config["roomId"] = room_id
            config["roomPwd"] = room_pwd

            save_config(config)

            request.session["is_admin"] = True
            FAILED_ATTEMPTS.pop(ip, None)

            return redirect("/control")

        FAILED_ATTEMPTS[ip] = (count + 1, time.time())
        return render(request, "login.html", {"error": "Invalid credentials | Default Roronoa : Zoro"})

    return render(request, "login.html")


def control(request):
    if not request.session.get("is_admin"):
        return redirect("/")
    return render(request, "control.html")


def logout_view(request):
    request.session.flush()
    return redirect("/")
