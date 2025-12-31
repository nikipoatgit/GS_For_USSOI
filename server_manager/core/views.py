from django.shortcuts import render

# Create your views here.
import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from server_manager.views import ROOM_CONFIG

# In-memory store (replace with Redis / DB in production)
SESSION_STORE = {}

@csrf_exempt
def authentication(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        body = json.loads(request.body.decode())
        room_id = body.get("roomId")
        room_pwd = body.get("roomPwd")
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # Compare against admin-configured values
    if (room_id != ROOM_CONFIG["roomId"]
            or room_pwd != ROOM_CONFIG["roomPwd"]):
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    session_key = uuid.uuid4().hex
    SESSION_STORE[session_key] = {"roomId": room_id}

    return JsonResponse({"sessionKey": session_key})
