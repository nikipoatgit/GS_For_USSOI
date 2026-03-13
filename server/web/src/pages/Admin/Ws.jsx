import { useState, useEffect, useCallback } from "react";
import { adminPost } from "./api";
import Toast from "./Toast";

function UserPills({ users }) {
    if (!users || users.length === 0)
        return <span style={{ color: "#bbb", fontSize: 12 }}>—</span>;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {users.map(u => (
                <span key={u.uid} className="user-pill">
                    <span className="dot dot-blue" />
                    {u.uname}
                    <span style={{ color: "#aaa", fontSize: 10 }}>#{u.uid}</span>
                </span>
            ))}
        </div>
    );
}

function DeviceWsCard({ device }) {
    const ctrl   = device.control  || {};
    const stream = device.stream   || {};
    const data   = device.data     || [];

    return (
        <div className="device-card">
            <div className="device-card-header">
                <div>
                    <div className="device-name" style={{ fontSize: 12, fontFamily: "monospace" }}>
                        {device.d_id || device.device_id || "Unknown device"}
                    </div>
                    {(device.d_name || device.device_name) && (
                        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                            {device.d_name || device.device_name}
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <span className={`badge ${stream.device ? "badge-connected" : "badge-offline"}`}>
                        Stream: {stream.device ? "device ✓" : "device ✗"}
                    </span>
                    <span className={`badge ${ctrl.device ? "badge-connected" : "badge-offline"}`}>
                        Control: {ctrl.device ? "device ✓" : "device ✗"}
                    </span>
                </div>
            </div>

            <div className="ws-grid">
                {/* Control */}
                <div>
                    <div className="ws-col-label">Control</div>
                    <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: "#999", marginRight: 4 }}>Admins</span>
                        <UserPills users={ctrl.admins} />
                    </div>
                    <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: "#999", marginRight: 4 }}>Operators</span>
                        <UserPills users={ctrl.operators} />
                    </div>
                    <div>
                        <span style={{ fontSize: 10, color: "#999", marginRight: 4 }}>Viewers</span>
                        <UserPills users={ctrl.viewers} />
                    </div>
                </div>

                {/* Stream */}
                <div>
                    <div className="ws-col-label">Stream users</div>
                    <UserPills users={stream.users} />
                </div>

                {/* Data */}
                <div>
                    <div className="ws-col-label">Data subscribers</div>
                    <UserPills users={data} />
                </div>
            </div>
        </div>
    );
}

export default function Ws() {
    const [rooms, setRooms]     = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [toast, setToast]     = useState(null);

    const fetchWs = useCallback(async () => {
        setLoading(true);
        setError("");
        const { ok, status, data } = await adminPost({ type: "ws", cmd: "get" });
        setLoading(false);
        if (!ok) {
            setError(status === 401 ? "Not authenticated — please log in first." : `Error ${status}`);
            return;
        }
        const arr = Array.isArray(data) ? data : (data.rooms || []);
        setRooms(arr);
    }, []);

    useEffect(() => { fetchWs(); }, [fetchWs]);

    const totalUsers = rooms.reduce((s, r) =>
        s + (r.devices || []).reduce((ds, d) =>
            ds + (d.stream?.users?.length || 0), 0), 0);

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <div className="section-header">
                <h2 className="section-title">WebSocket Status</h2>
                <button className="btn btn-ghost" onClick={fetchWs} disabled={loading}>
                    {loading ? <span className="spinner" /> : "↻"} Refresh
                </button>
            </div>

            {/* Summary */}
            {!error && rooms.length > 0 && (
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    {[
                        { label: "Rooms",   value: rooms.length },
                        { label: "Devices", value: rooms.reduce((s, r) => s + (r.devices?.length || 0), 0) },
                        { label: "Stream users", value: totalUsers, accent: true },
                    ].map(s => (
                        <div key={s.label} className="card" style={{ flex: 1, padding: "14px 18px", marginBottom: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#999", marginBottom: 4 }}>
                                {s.label}
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: s.accent ? "#5b6af0" : "#1a1a2e" }}>
                                {s.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error ? (
                <div className="state-box error">⚠ {error}</div>
            ) : loading && rooms.length === 0 ? (
                <div className="state-box"><span className="spinner" /> Loading WS status…</div>
            ) : rooms.length === 0 ? (
                <div className="state-box">No rooms found.</div>
            ) : (
                rooms.map(room => (
                    <div key={room.r_id || room.room_id} className="room-block">
                        <div className="room-label">
                            🔌 {room.r_name || room.room_name}
                        </div>
                        {(!room.devices || room.devices.length === 0) ? (
                            <div className="state-box" style={{ padding: 14 }}>No devices.</div>
                        ) : (
                            room.devices.map((d, i) => (
                                <DeviceWsCard key={d.d_id || d.device_id || i} device={d} />
                            ))
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
