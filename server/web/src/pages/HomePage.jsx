import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

let _toastId = 0;

function AddRoomModal({ onConfirm, onCancel, adding }) {
    const [roomName, setRoomName]         = useState("");
    const [roomId, setRoomId]             = useState("");
    const [roomPassword, setRoomPassword] = useState("");
    const [error, setError]               = useState("");
    const firstRef = useRef(null);

    useEffect(() => { firstRef.current?.focus(); }, []);

    const handleSubmit = () => {
        if (!roomName.trim()) { setError("Room name is required."); return; }
        if (!roomId.trim())   { setError("Room ID is required."); return; }
        setError("");
        onConfirm({ roomName: roomName.trim(), roomId: roomId.trim(), roomPassword });
    };

    return (
        <div className="modal-overlay" onKeyDown={e => e.key === "Escape" && onCancel()}>
            <div className="modal" role="dialog" aria-modal="true">
                <h3>Add Room</h3>
                <p className="modal-sub">Connect a new room</p>
                <div className="modal-divider" />

                <div className="form-grid">
                    <div className="form-group">
                        <label>Room Name</label>
                        <input
                            ref={firstRef}
                            placeholder="e.g. Living Room"
                            value={roomName}
                            onChange={e => setRoomName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Room ID</label>
                        <input
                            placeholder="e.g. room-001"
                            value={roomId}
                            onChange={e => setRoomId(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password <span style={{ textTransform:"none", fontWeight:400, letterSpacing:0 }}>(optional)</span></label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={roomPassword}
                            onChange={e => setRoomPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        />
                    </div>
                </div>

                {error && <p className="modal-error">{error}</p>}

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onCancel}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={adding}>
                        {adding ? <span className="spinner" /> : "Add Room"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function HomePage() {
    const [rooms, setRooms]           = useState([]);
    const [devices, setDevices]       = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [adding, setAdding]         = useState(false);
    const [toasts, setToasts]         = useState([]);
    const navigate = useNavigate();

    const pushToast = useCallback((message, type = "info") => {
        const id = ++_toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const loadDevices = useCallback(async () => {
        try {
            const res = await fetch("/api/user/devices", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reqId: Date.now(), intent: "getDevices" })
            });
            if (!res.ok) { pushToast(`Load failed (${res.status})`, "error"); return; }
            const data = await res.json();
            setDevices(data);
            setRooms(data.map(r => ({ roomId: r.roomId, roomName: r.roomName })));
        } catch { pushToast("Network error", "error"); }
    }, [pushToast]);

    useEffect(() => { loadDevices(); }, [loadDevices]);

    const handleAddRoom = async ({ roomName, roomId, roomPassword }) => {
        setAdding(true);
        try {
            const res = await fetch("/api/user/rooms", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "room", reqId: Date.now(), intent: "addRoom", roomId, roomName, roomPassword })
            });
            if (!res.ok) { pushToast(`Failed (${res.status})`, "error"); return; }
            const data = await res.json();
            if (data.status === "ACK") {
                pushToast(`"${roomName}" added`, "success");
                setShowAddModal(false);
                loadDevices();
            } else {
                pushToast(data.message || "Server rejected request", "error");
            }
        } catch { pushToast("Network error", "error"); }
        finally { setAdding(false); }
    };

    const removeRoom = async (roomId, roomName) => {
        try {
            const res = await fetch("/api/user/rooms", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "room", reqId: Date.now(), intent: "removeRoom", roomId })
            });
            if (res.ok) {
                pushToast(`"${roomName}" removed`, "info");
                setSelectedRoom(null);
                loadDevices();
            } else {
                pushToast("Could not remove room", "error");
            }
        } catch { pushToast("Network error", "error"); }
    };

    const logout = async () => {
        try { await fetch("/logout", { method: "POST", credentials: "include" }); } catch {}
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
    };

    const filteredDevices = devices
        .filter(room => !selectedRoom || room.roomId === selectedRoom)
        .flatMap(room => room.devices.map(device => ({ ...device, roomName: room.roomName })));

    const selectedRoomName = rooms.find(r => r.roomId === selectedRoom)?.roomName;
    const totalDevices  = devices.reduce((s, r) => s + (r.devices?.length || 0), 0);
    const totalRooms    = rooms.length;

    return (
        <div className="home-container">

            {/* Top bar */}
            <div className="top-bar">
                <div className="topbar-logo">
                    <div className="topbar-logo-mark">
                        <svg viewBox="0 0 14 14" fill="none" width="13" height="13"
                             stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
                            <rect x="2" y="2" width="10" height="10" rx="2"/>
                            <path d="M5 7h4M7 5v4"/>
                        </svg>
                    </div>
                    <span className="topbar-name">USSOI</span>
                    <span className="topbar-sub">Dashboard</span>
                </div>
                <div className="topbar-actions">
                    <button className="btn-topbar" onClick={loadDevices}>↻ Refresh</button>
                    <button className="btn-topbar" onClick={logout}>Sign out</button>
                </div>
            </div>

            <div className="main">

                {/* Sidebar */}
                <div className="sidebar">
                    <p className="sidebar-label">Rooms</p>

                    <div className="room-list">
                        {rooms.length === 0 && (
                            <p className="no-rooms-msg">No rooms yet</p>
                        )}
                        {rooms.map(room => (
                            <div
                                key={room.roomId}
                                className={`room-item ${selectedRoom === room.roomId ? "active" : ""}`}
                                onClick={() => setSelectedRoom(prev => prev === room.roomId ? null : room.roomId)}
                            >
                                <span className="room-item-name">{room.roomName}</span>
                                <button
                                    className="room-remove-btn"
                                    title="Remove room"
                                    onClick={e => { e.stopPropagation(); removeRoom(room.roomId, room.roomName); }}
                                >×</button>
                            </div>
                        ))}
                    </div>

                    <div className="sidebar-footer">
                        <button className="add-room-btn" onClick={() => setShowAddModal(true)}>
                            <svg viewBox="0 0 12 12" fill="none" width="11" height="11"
                                 stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                <path d="M6 2v8M2 6h8"/>
                            </svg>
                            Add Room
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="content">
                    <div className="content-header">
                        <div>
                            <h2 className="content-title">
                                {selectedRoomName || "All Devices"}
                            </h2>
                            {selectedRoomName && (
                                <div className="content-breadcrumb">
                                    <span>Dashboard</span>
                                    <span className="crumb-sep">›</span>
                                    <span className="crumb-active">{selectedRoomName}</span>
                                </div>
                            )}
                        </div>
                        <div className="content-header-right">
                            <span className="section-meta">
                                Devices
                                <span className="device-count-badge">{filteredDevices.length}</span>
                            </span>
                        </div>
                    </div>

                    <div className="content-body">

                        {/* Stats (only on all-devices view) */}
                        {!selectedRoom && totalRooms > 0 && (
                            <div className="stats-row">
                                {[
                                    { label: "Rooms",   value: totalRooms },
                                    { label: "Devices", value: totalDevices },
                                    { label: "Online",  value: totalDevices, accent: true },
                                ].map(s => (
                                    <div key={s.label} className="stat-card">
                                        <div className="stat-label">{s.label}</div>
                                        <div className={`stat-value ${s.accent ? "accent" : ""}`}>{s.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Device grid */}
                        {filteredDevices.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <svg viewBox="0 0 20 20" fill="none" width="20" height="20"
                                         stroke="#bbb" strokeWidth="1.3" strokeLinecap="round">
                                        <rect x="3" y="3" width="14" height="14" rx="3"/>
                                        <path d="M7 10h6M10 7v6"/>
                                    </svg>
                                </div>
                                <p>{selectedRoom ? "No devices in this room" : "No devices found"}</p>
                            </div>
                        ) : (
                            <div className="device-grid">
                                {filteredDevices.map(device => (
                                    <div
                                        key={device.d_Id}
                                        className="device-card"
                                        onClick={() => window.open(`/Device/${device.d_Id}`)}
                                        title={`${device.d_Name || device.d_Id} · ${device.d_Id}`}
                                    >
                                        <p className="device-card-room">{device.roomName}</p>

                                        <p className="device-card-name">
                                            {device.d_Name || device.d_Id}
                                        </p>

                                        <p className="device-card-id">{device.d_Id}</p>

                                        <div className="device-card-status">
                                            <span className={`dot ${device.d_Stat ? "dot-green" : "dot-gray"}`} />
                                            <span className="status-lbl">
                                                {device.d_Stat ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>

            </div>

            {/* Modal */}
            {showAddModal && (
                <AddRoomModal
                    onConfirm={handleAddRoom}
                    onCancel={() => setShowAddModal(false)}
                    adding={adding}
                />
            )}

            {/* Toasts */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "· "}
                        {t.message}
                    </div>
                ))}
            </div>

        </div>
    );
}
