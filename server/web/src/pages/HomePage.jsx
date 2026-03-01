import { useEffect, useState } from "react";
import "./HomePage.css";

export default function HomePage() {
    const [rooms, setRooms] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);

    useEffect(() => {
        loadRooms();
        loadDevices();
    }, []);

    const loadRooms = async () => {
        try {
            const res = await fetch("/api/handleRooms", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "room",
                    reqId: Date.now(),
                    intent: "getRoom"
                })
            });

            if (!res.ok) {
                console.error("Failed to load rooms:", res.status);
                return;
            }

            const data = await res.json();
            setRooms(data);

        } catch (err) {
            console.error("Network error:", err);
        }
    };

    const loadDevices = async () => {
        try {
            const res = await fetch("/api/getDevices", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reqId: Date.now(),
                    intent: "getDevices"
                })
            });

            if (!res.ok) {
                console.error("Failed to load devices:", res.status);
                return;
            }

            const data = await res.json();
            setDevices(data);

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
            roomPassword,
        };

        await fetch("/api/handleRooms", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        loadRooms();
    };

    const removeRoom = async (roomId) => {
        const body = {
            type: "room",
            reqId: Date.now(),
            intent: "removeRoom",
            roomId,
        };

        await fetch("/api/handleRooms", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        loadRooms();
        setSelectedRoom(null);
    };

    const filteredDevices = selectedRoom
        ? devices.filter(d => d.roomId === selectedRoom)
        : devices;

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
                    <button
                        onClick={() =>
                            fetch("/logout", { method: "POST", credentials: "include" })
                        }
                    >
                        Logout
                    </button>
                </div>

                <div className="device-grid">
                    {filteredDevices.map((device, index) => (
                        <div key={index} className="device-card">
                            <p><strong>Room:</strong> {device.roomName}</p>
                            <p><strong>Device:</strong> {device.deviceId}</p>
                            <p className="small">Connected since ...</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}