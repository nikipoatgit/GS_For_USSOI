#!/usr/bin/env python3
import argparse
import base64
import json
import random
import signal
import ssl
import struct
import threading
import time
import urllib.request
from urllib.parse import urljoin

import websocket
from websocket import ABNF
from websocket import WebSocketTimeoutException

# Defaults match the current server/web telemetry expectations:
#   { "type":"telem", "cmd":"t", "d":"<116 hex chars>" }
DEFAULT_TELEMETRY_CMD = "t"
DEFAULT_TELEMETRY_KEY = "d"
DEFAULT_ROOM_ID = "100"
DEFAULT_ROOM_NAME = "nina"
DEFAULT_ROOM_PASSWORD = "100"


def make_headers(session_key: str | None, cookie: str | None):
    headers = []
    if session_key:
        headers.append(f"Authorization: Bearer {session_key}")
    if cookie:
        headers.append(f"Cookie: {cookie}")
    return headers


def pack_telemetry_hex(state: dict) -> str:
    # Android TelemetryPacketBuilder layout:
    # <hBfBhhBBiii5f  => 46 bytes
    packet = struct.pack(
        "<hBfBhhBBiii5f",
        int(state["current_ma"]),
        int(state["battery_level"]) & 0xFF,
        float(state["battery_temp_c"]),
        int(state["thermal_status"]) & 0xFF,
        int(state["cell_dbm"]),
        int(state["wifi_dbm"]),
        int(state["network_type"]) & 0xFF,
        int(state["data_network_type"]) & 0xFF,
        int(state["upload_kbps"] * 100),
        int(state["download_kbps"] * 100),
        int(state["session_mb"] * 100),
        float(state["lat"]),
        float(state["lon"]),
        float(state["accuracy"]),
        float(state["speed_mps"]),
        float(state["altitude_m"]),
    )

    status_bits = 0
    if state["tunnel_active"]:
        status_bits |= 1
    if state["streaming"]:
        status_bits |= 1 << 1
    if state["recording"]:
        status_bits |= 1 << 2

    return packet.hex().upper() + format(status_bits & 0xF, "X")


def response(cmd: str, cmd_id: str, data=None):
    obj = {
        "type": "response",
        "cmd": cmd,
        "cmdId": cmd_id,
        "status": "ok",
    }
    if data is not None:
        obj["data"] = data
    return obj


def error(cmd: str, cmd_id: str, message: str):
    return {
        "type": "error",
        "cmd": cmd,
        "cmdId": cmd_id,
        "error": message,
    }


def parse_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        return None


def _http_json(url: str, payload: dict | None = None, headers: dict | None = None):
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers or {}, method="POST" if payload is not None else "GET")
    if payload is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, context=ssl._create_unverified_context()) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _import_rsa_public_key(pem_or_der_b64: str):
    try:
        from cryptography.hazmat.primitives import serialization
        return serialization.load_der_public_key(base64.b64decode(pem_or_der_b64))
    except Exception:
        try:
            from cryptography.hazmat.primitives import serialization
            return serialization.load_pem_public_key(pem_or_der_b64.encode("utf-8"))
        except Exception:
            return None


def rsa_oaep_sha256_encrypt(public_key_b64: str, plaintext: str) -> str:
    key = _import_rsa_public_key(public_key_b64)
    if key is None:
        raise RuntimeError("cryptography package not available or invalid public key")

    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding

    ciphertext = key.encrypt(
        plaintext.encode("utf-8"),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return base64.b64encode(ciphertext).decode("utf-8")


class DummyDevice:
    def __init__(self, args):
        self.args = args
        self.stop_event = threading.Event()

        self.state = {
            "stream_mode": "HFH264" if args.high_fps else "H264",
            "streaming": False,
            "recording": False,
            "tunnel_active": False,
            "current_ma": -380,
            "battery_level": 76,
            "battery_temp_c": 36.4,
            "thermal_status": 1,
            "cell_dbm": -88,
            "wifi_dbm": -52,
            "network_type": 13,       # LTE
            "data_network_type": 20,  # NR
            "upload_kbps": 120.0,
            "download_kbps": 680.0,
            "session_mb": 12.5,
            "lat": 28.6139,
            "lon": 77.2090,
            "accuracy": 9.5,
            "speed_mps": 0.8,
            "altitude_m": 212.0,
        }

        self.control_ws = None
        self.stream_ws = None
        self.control_lock = threading.Lock()
        self.stream_source = None
        self.device_id = None
        self.device_token = None

    def build_control_url(self):
        return f"{self.args.base.rstrip('/')}{self.args.control_path}"

    def build_stream_url(self):
        return f"{self.args.base.rstrip('/')}{self.args.stream_path}"

    def build_api_url(self, path: str):
        return urljoin(self.args.http_base.rstrip("/") + "/", path.lstrip("/"))

    def bootstrap_device_session(self):
        if self.args.skip_device_auth:
            self.device_id = self.args.device_id
            self.device_token = self.args.device_token
            print("[auth] skipped; using provided device session values")
            return

        key_resp = _http_json(self.build_api_url("/api/device/authenticate"), {"type": "getKey"})
        public_key = key_resp.get("publicKey")
        device_id = key_resp.get("deviceId")
        challenge = key_resp.get("challenge")
        if not public_key or not device_id or not challenge:
            raise RuntimeError("device auth getKey response missing publicKey/deviceId/challenge")

        login_payload = {
            "roomId": self.args.room_id,
            "roomPwd": self.args.room_password,
            "challenge": challenge,
            "timestamp": int(time.time() * 1000),
        }
        encrypted = rsa_oaep_sha256_encrypt(public_key, json.dumps(login_payload))

        login_resp = _http_json(
            self.build_api_url("/api/device/authenticate"),
            {
                "type": "login",
                "deviceId": device_id,
                "deviceName": self.args.device_name,
                "data": encrypted,
            },
        )

        device_token = login_resp.get("deviceToken")
        if not device_token:
            raise RuntimeError("device login did not return deviceToken")

        self.device_id = login_resp.get("deviceId", device_id)
        self.device_token = device_token
        print(f"[auth] device session ready: deviceId={self.device_id}")

    def connect_control(self):
        url = self.build_control_url()
        print(f"[control] connecting -> {url}")
        self.control_ws = websocket.create_connection(
            url,
            header=make_headers(self.device_token, self.args.cookie),
            timeout=10,
        )
        print("[control] connected")

    def connect_stream(self):
        if not self.args.open_stream:
            return
        url = self.build_stream_url()
        print(f"[stream] connecting -> {url}")
        self.stream_ws = websocket.create_connection(
            url,
            header=make_headers(self.device_token, self.args.cookie),
            timeout=10,
        )
        print("[stream] connected")

        if self.args.stream_file:
            self.stream_source = open(self.args.stream_file, "rb")
        else:
            self.stream_source = None
            print("[stream] no --stream-file provided; stream socket will stay idle")

    def close(self):
        self.stop_event.set()
        for ws in (self.control_ws, self.stream_ws):
            try:
                if ws:
                    ws.close()
            except Exception:
                pass
        try:
            if self.stream_source:
                self.stream_source.close()
        except Exception:
            pass

    def send_control(self, obj):
        with self.control_lock:
            if not self.control_ws:
                return
            self.control_ws.send(json.dumps(obj))

    def handle_command(self, msg: dict):
        cmd = msg.get("cmd", "")
        cmd_id = msg.get("cmdId", "")
        param = msg.get("param") or msg.get("params") or {}

        if cmd in ("get_params",):
            data = {
                "HFSupport": bool(self.args.high_fps),
                "Stream_mode": self.state["stream_mode"],
                "params_set": True,
            }
            self.send_control(response(cmd, cmd_id, data))
            return

        if cmd in ("get_res",):
            data = {
                "cameras": [
                    {
                        "cameraId": "0",
                        "normal": [
                            {"width": 1280, "height": 720, "fpsRanges": [{"max": 30}, {"max": 60}]},
                            {"width": 1920, "height": 1080, "fpsRanges": [{"max": 30}]},
                        ],
                    }
                ]
            }
            self.send_control(response(cmd, cmd_id, data))
            return

        if cmd in ("get_tunnels",):
            self.send_control(response(cmd, cmd_id, {"tunnels": ["bt", "usb"]}))
            return

        if cmd in ("set_params",):
            mode = str(param.get("Stream_mode", self.state["stream_mode"])).upper()
            if mode not in ("WEBRTC", "H264", "HFH264", "NONE"):
                self.send_control(error(cmd, cmd_id, "Invalid Stream Mode"))
                return
            if mode == "HFH264" and not self.args.high_fps:
                self.send_control(error(cmd, cmd_id, "High FPS not supported"))
                return

            self.state["stream_mode"] = mode
            self.send_control(response(cmd, cmd_id, None))
            self.send_control(response("get_params", cmd_id, {
                "HFSupport": bool(self.args.high_fps),
                "Stream_mode": self.state["stream_mode"],
                "params_set": True,
            }))
            return

        if cmd == "start_stream":
            self.state["streaming"] = True
            self.send_control(response(cmd, cmd_id, None))
            return

        if cmd == "stop_stream":
            self.state["streaming"] = False
            self.send_control(response(cmd, cmd_id, None))
            return

        if cmd == "start_recording":
            self.state["recording"] = True
            self.send_control(response(cmd, cmd_id, None))
            return

        if cmd == "stop_recording":
            self.state["recording"] = False
            self.send_control(response(cmd, cmd_id, None))
            return

        if cmd == "start_tunnel":
            self.state["tunnel_active"] = True
            self.send_control(response(cmd, cmd_id, None))
            return

        if cmd == "stop_tunnel":
            self.state["tunnel_active"] = False
            self.send_control(response(cmd, cmd_id, None))
            return

        if cmd in ("switch", "set_stream_res", "set_record_res", "play", "pause", "mute", "flip", "rotate", "webrtc_offer", "webrtc_ice"):
            self.send_control(response(cmd, cmd_id, None))
            return

        self.send_control(error(cmd, cmd_id, f"Unknown command: {cmd}"))

    def control_loop(self):
        while not self.stop_event.is_set():
            try:
                self.connect_control()

                telemetry_thread = threading.Thread(target=self.telemetry_loop, daemon=True)
                telemetry_thread.start()

                while not self.stop_event.is_set():
                    try:
                        raw = self.control_ws.recv()
                    except WebSocketTimeoutException:
                        continue

                    if raw is None or isinstance(raw, bytes):
                        continue

                    msg = parse_json(raw)
                    if not isinstance(msg, dict):
                        continue

                    self.handle_command(msg)

            except Exception as e:
                if not self.stop_event.is_set():
                    print(f"[control] disconnected: {e}")
                    time.sleep(1.0)
            finally:
                try:
                    if self.control_ws:
                        self.control_ws.close()
                except Exception:
                    pass
                self.control_ws = None

    def telemetry_loop(self):
        # Send telemetry every 3 seconds like the Android client
        while not self.stop_event.is_set() and self.control_ws is not None:
            try:
                # small drift so the UI looks alive
                self.state["current_ma"] = max(-900, min(400, self.state["current_ma"] + random.randint(-20, 20)))
                self.state["battery_level"] = max(0, min(100, self.state["battery_level"] + random.choice([0, 0, -1])))
                self.state["battery_temp_c"] = round(self.state["battery_temp_c"] + random.uniform(-0.1, 0.1), 1)
                self.state["upload_kbps"] = max(0.0, self.state["upload_kbps"] + random.uniform(-10, 10))
                self.state["download_kbps"] = max(0.0, self.state["download_kbps"] + random.uniform(-20, 20))
                self.state["session_mb"] += (self.state["upload_kbps"] + self.state["download_kbps"]) / 1024.0 / 8.0
                self.state["speed_mps"] = max(0.0, self.state["speed_mps"] + random.uniform(-0.05, 0.05))

                payload = {
                    "type": "telem",
                    "cmd": self.args.telemetry_cmd,
                    self.args.telemetry_key: pack_telemetry_hex(self.state),
                    "hex": pack_telemetry_hex(self.state),
                }
                self.send_control(payload)
            except Exception as e:
                if not self.stop_event.is_set():
                    print(f"[telemetry] send failed: {e}")
                    break

            for _ in range(30):
                if self.stop_event.is_set():
                    return
                time.sleep(0.1)

    def stream_loop(self):
        if not self.args.open_stream:
            return

        while not self.stop_event.is_set():
            try:
                self.connect_stream()
                while not self.stop_event.is_set():
                    try:
                        if self.state["streaming"] and self.stream_source:
                            chunk = self.stream_source.read(self.args.stream_chunk_size)
                            if not chunk:
                                self.stream_source.seek(0)
                                continue
                            # Send the file contents verbatim so you can point this at
                            # a real fMP4 sample when validating the MSE playback path.
                            self.stream_ws.send(chunk, opcode=ABNF.OPCODE_BINARY)
                        time.sleep(1 / max(1, self.args.stream_fps))
                    except WebSocketTimeoutException:
                        continue
            except Exception as e:
                if not self.stop_event.is_set():
                    print(f"[stream] disconnected: {e}")
                    time.sleep(1.0)
            finally:
                try:
                    if self.stream_ws:
                        self.stream_ws.close()
                except Exception:
                    pass
                self.stream_ws = None
                try:
                    if self.stream_source:
                        self.stream_source.close()
                except Exception:
                    pass
                self.stream_source = None


def main():
    parser = argparse.ArgumentParser(description="Dummy USSOI device for websocket testing")
    parser.add_argument("--http-base", default="http://127.0.0.1:8000", help="Base HTTP URL used for device auth")
    parser.add_argument("--base", default="ws://127.0.0.1:8000", help="Base WS URL, e.g. ws://127.0.0.1:8000")
    parser.add_argument("--cookie", default=None, help="Optional Cookie header")
    parser.add_argument("--control-path", default="/ws/device/control")
    parser.add_argument("--stream-path", default="/ws/device/stream")
    parser.add_argument("--open-stream", action="store_true", help="Also open the stream websocket")
    parser.add_argument("--stream-fps", type=int, default=30, help="Binary frame send rate for stream ws")
    parser.add_argument("--stream-file", default=None, help="Optional binary file to send over the stream websocket")
    parser.add_argument("--stream-chunk-size", type=int, default=2048, help="Bytes sent per stream frame")
    parser.add_argument("--high-fps", action="store_true", help="Advertise HFH264 support in get_params")
    parser.add_argument("--telemetry-cmd", default=DEFAULT_TELEMETRY_CMD, help='Telemetry cmd field, default "t"')
    parser.add_argument("--telemetry-key", default=DEFAULT_TELEMETRY_KEY, help='Telemetry hex key, default "d"')
    parser.add_argument("--room-id", default=DEFAULT_ROOM_ID, help='Default room id used for device auth, default "100"')
    parser.add_argument("--room-name", default=DEFAULT_ROOM_NAME, help='Default room name used for device auth, default "nina"')
    parser.add_argument("--room-password", default=DEFAULT_ROOM_PASSWORD, help='Default room password used for device auth, default "100"')
    parser.add_argument("--device-name", default="dummy-device", help="Device name sent during device auth")
    parser.add_argument("--device-id", default=None, help="Optional pre-created device id")
    parser.add_argument("--device-token", default=None, help="Optional pre-created device token")
    parser.add_argument("--skip-device-auth", action="store_true", help="Skip HTTP auth bootstrap and use provided device token")
    args = parser.parse_args()

    dev = DummyDevice(args)
    dev.bootstrap_device_session()

    def shutdown(*_):
        print("\n[main] shutting down")
        dev.close()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    threads = [
        threading.Thread(target=dev.control_loop, daemon=True),
    ]
    if args.open_stream:
        threads.append(threading.Thread(target=dev.stream_loop, daemon=True))

    for t in threads:
        t.start()

    try:
        while not dev.stop_event.is_set():
            time.sleep(0.5)
    finally:
        dev.close()


if __name__ == "__main__":
    main()
