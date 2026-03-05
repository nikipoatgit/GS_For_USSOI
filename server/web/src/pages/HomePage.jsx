import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {

    const [rooms, setRooms] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {

            const res = await fetch("/api/user/devices", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reqId: Date.now(),
                    intent: "getDevices"
                })
            });

            if (!res.ok) {
                console.error("Device request failed", res.status);
                return;
            }

            const data = await res.json();

            setDevices(data);

            const extractedRooms = data.map(r => ({
                roomId: r.roomId,
                roomName: r.roomName
            }));

            setRooms(extractedRooms);

        } catch (err) {
            console.error("Network error:", err);
        }
    };

    const addRoom = async () => {

        const roomName = prompt("Room Name");
        const roomId = prompt("Room ID");
        const roomPassword = prompt("Password");

        if (!roomName || !roomId) return;

        const body = {
            type: "room",
            reqId: Date.now(),
            intent: "addRoom",
            roomId,
            roomName,
            roomPassword
        };

        const res = await fetch("/api/user/rooms", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "ACK") {
            loadDevices();
        }
    };

    const removeRoom = async (roomId) => {

        const body = {
            type: "room",
            reqId: Date.now(),
            intent: "removeRoom",
            roomId
        };

        const res = await fetch("/api/user/rooms", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            loadDevices();
            setSelectedRoom(null);
        }
    };

    const logout = async () => {

        try {
            await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch {}

        document.cookie =
            "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        window.location.href = "/login";
    };

    const filteredDevices = devices
        .filter(room => !selectedRoom || room.roomId === selectedRoom)
        .flatMap(room =>
            room.devices.map(device => ({
                ...device,
                roomName: room.roomName
            }))
        );

    return (
        <div className="home-container">

            <div className="sidebar">

                <h3>Rooms</h3>

                <div className="room-list">

                    {rooms.map(room => (
                        <div
                            key={room.roomId}
                            className={`room-item ${
                                selectedRoom === room.roomId ? "active" : ""
                            }`}
                            onClick={() => setSelectedRoom(room.roomId)}
                        >

                            <span>{room.roomName}</span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeRoom(room.roomId);
                                }}
                            >
                                ×
                            </button>

                        </div>
                    ))}

                </div>

                <button className="add-room-btn" onClick={addRoom}>
                    Add +
                </button>

            </div>

            <div className="main-content">

                <div className="top-bar">

                    <h2>USSOI</h2>

                    <button onClick={logout}>
                        Logout
                    </button>

                </div>

                <div className="device-grid">

                    {filteredDevices.map(device => (
                        <div
                            key={device.deviceId}
                            className="device-card"
                            onClick={() =>  window.open(`/Device/${device.deviceId}`)}
                        >

                            <p>
                                <strong>Room:</strong> {device.roomName}
                            </p>

                            <p>
                                <strong>Device:</strong> {device.deviceId}
                            </p>

                            <p className="small">
                                Connected since ...
                            </p>

                        </div>
                    ))}

                </div>

            </div>

        </div>
    );
}