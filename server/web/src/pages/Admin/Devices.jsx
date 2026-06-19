import { useState, useEffect, useCallback } from "react";
import { adminPost } from "./api";
import Toast from "./Toast";

export default function Devices() {
    const [rooms, setRooms]     = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [toast, setToast]     = useState(null);

    const fetchDevices = useCallback(async () => {
        setLoading(true);
        setError("");
        const { ok, status, data } = await adminPost({ type: "device", cmd: "get" });
        setLoading(false);
        if (!ok) {
            setError(status === 401 ? "Not authenticated — please log in first." : `Error ${status}`);
            return;
        }
        // response is an array of rooms
        const arr = Array.isArray(data) ? data : [];
        setRooms(arr);
    }, []);

    useEffect(() => { fetchDevices(); }, [fetchDevices]);

    const totalDevices  = rooms.reduce((s, r) => s + (r.devices?.length || 0), 0);
    const onlineDevices = rooms.reduce((s, r) =>
        s + (r.devices?.filter(d => d.d_Stat === true).length || 0), 0);

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <div className="section-header">
                <h2 className="section-title">Devices</h2>
                <button className="btn btn-ghost" onClick={fetchDevices} disabled={loading}>
                    {loading ? <span className="spinner" /> : "↻"} Refresh
                </button>
            </div>

            {/* ── Stats row ── */}
            {!error && rooms.length > 0 && (
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    {[
                        { label: "Rooms",   value: rooms.length },
                        { label: "Devices", value: totalDevices },
                        { label: "Online",  value: onlineDevices, accent: true },
                        { label: "Offline", value: totalDevices - onlineDevices },
                    ].map(s => (
                        <div key={s.label} className="card" style={{ flex: 1, padding: "14px 18px", marginBottom: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#999", marginBottom: 4 }}>
                                {s.label}
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: s.accent ? "#3db87a" : "#1a1a2e" }}>
                                {s.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Room/device list ── */}
            {error ? (
                <div className="state-box error">⚠ {error}</div>
            ) : loading && rooms.length === 0 ? (
                <div className="state-box"><span className="spinner" /> Loading devices…</div>
            ) : rooms.length === 0 ? (
                <div className="state-box">No rooms found.</div>
            ) : (
                rooms.map(room => (
                    <div key={room.roomId} className="room-block">
                        <div className="room-label">
                            📂 {room.roomName}
                            <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 8, color: "#999" }}>
                                {room.devices?.length || 0} device{room.devices?.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {(!room.devices || room.devices.length === 0) ? (
                            <div className="state-box" style={{ padding: 14, justifyContent: "flex-start" }}>
                                No devices in this room.
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Device ID</th>
                                            <th>Assigned ID</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {room.devices.map((d, i) => (
                                            <tr key={i}>
                                                <td style={{ fontFamily: "monospace", fontSize: 12, color: "#555", wordBreak: "break-all", maxWidth: 280 }}>
                                                    {d.d_Name || d.dname || "—"}
                                                </td>
                                                <td style={{ color: "#aaa", fontStyle: "italic", fontSize: 12 }}>
                                                    {d.d_Id ?? d.did ?? "—"}
                                                </td>
                                                <td>
                                                    {d.d_Stat === true
                                                        ? <span className="badge badge-online"><span className="dot dot-green" style={{ marginRight: 4 }} />Online</span>
                                                        : <span className="badge badge-offline"><span className="dot dot-red" style={{ marginRight: 4 }} />Offline</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
