from django.shortcuts import render, redirect
from django.http import HttpResponseForbidden
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.hashers import check_password
import time

# -----------------------------
# ADMIN AUTH (hashed password)
# -----------------------------
ADMIN_USERNAME = "nikipo"
ADMIN_PASSWORD_HASH = (
    "pbkdf2_sha256$870000$JXsObonOc0GRxprPLYCQ9t$D8kE0wciAWzdgijExhFyM5K8+sGdm/oFUZX6U0/bZG0="
)

# -----------------------------
# ROOM CONFIG (in-memory)
# -----------------------------
ROOM_CONFIG = {
    "roomId": "123",
    "roomPwd": "123"
}

# -----------------------------
# RATE LIMITING
# -----------------------------
FAILED_ATTEMPTS = {}   
MAX_ATTEMPTS = 5
LOCK_TIME = 60         

# -----------------------------
# LOGIN + CONFIG VIEW
# -----------------------------
@csrf_protect
def login_and_config(request):
    ip = request.META.get("REMOTE_ADDR")

    # if ip != "127.0.0.1":
    #     return HttpResponseForbidden("Forbidden")

    if request.session.get("is_admin"):
        return redirect("/control")

    # Rate limiting
    count, last = FAILED_ATTEMPTS.get(ip, (0, 0))
    if count >= MAX_ATTEMPTS and time.time() - last < LOCK_TIME:
        return HttpResponseForbidden("Too many attempts")

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        room_id = request.POST.get("roomId")
        room_pwd = request.POST.get("roomPwd")

        if (
            username == ADMIN_USERNAME
            and check_password(password, ADMIN_PASSWORD_HASH)
        ):
            ROOM_CONFIG["roomId"] = room_id
            ROOM_CONFIG["roomPwd"] = room_pwd

            request.session["is_admin"] = True

            FAILED_ATTEMPTS.pop(ip, None)
            return redirect("/control")

        FAILED_ATTEMPTS[ip] = (count + 1, time.time())
        return render(request, "login.html", {
            "error": "Invalid credentials"
        })

    return render(request, "login.html")


# -----------------------------
# CONTROL PAGE (protected)
# -----------------------------
def control(request):
    if not request.session.get("is_admin"):
        return redirect("/")

    return render(request, "control.html")

# -----------------------------
# Logout section
# -----------------------------
def logout_view(request):
    request.session.flush()   # deletes session + cookie
    return redirect("/")