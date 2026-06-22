import { useState, useEffect, useCallback } from "react";
import { adminPost } from "./api";
import Toast from "./Toast";

// WS endpoint host used to build the copyable connection URLs below.
// Defaults to the page's own host/protocol (http->ws, https->wss).
// If your WS server actually lives on a different host or port, hardcode
// it here instead, e.g. const WS_HOST = "wss://example.com:8443";
const WS_HOST = (() => {
    if (typeof window === "undefined") return "ws://server:port";
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}`;
})();

function buildTunnelUrl({ deviceId, token, name, mode }) {
    const params = new URLSearchParams({
        tunneltoken: token || "",
        tunnelname: name || "",
        deviceid: deviceId || "",
        mode,
    });
    return `${WS_HOST}/ws/data?${params.toString()}`;
}

function UserPills({ users }) {
    if (!Array.isArray(users) || users.length === 0)
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

// Click-to-copy field for the generated WS URLs (and anything else string-y).
function CopyField({ label, value }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(value);
            } else {
                const ta = document.createElement("textarea");
                ta.value = value;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard not available — fail silently, URL is still selectable/visible.
        }
    };

    return (
        <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#999", marginBottom: 3 }}>{label}</div>
            <div
                onClick={handleCopy}
                title="Click to copy"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "#f6f7fb",
                    border: "1px solid #e3e5ee",
                    borderRadius: 6,
                    padding: "7px 10px",
                    cursor: "pointer",
                    userSelect: "none",
                }}
            >
                <span
                    style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#444",
                    }}
                >
                    {value}
                </span>
                <span
                    style={{
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        color: copied ? "#2e9e5b" : "#5b6af0",
                    }}
                >
                    {copied ? "Copied ✓" : "Copy"}
                </span>
            </div>
        </div>
    );
}

function TunnelRow({ deviceId, tunnel }) {
    const name = tunnel.t_name || "Unnamed tunnel";
    const token = tunnel.t_token || "";
    const shortToken = token.length > 14 ? `${token.slice(0, 14)}…` : token;

    return (
        <div
            style={{
                border: "1px solid #ececf4",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 10,
            }}
        >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
                <span style={{ fontSize: 10, color: "#aaa", fontFamily: "monospace" }}>#{shortToken}</span>
            </div>
            <CopyField
                label="Control URL"
                value={buildTunnelUrl({ deviceId, token, name, mode: "control" })}
            />
            <CopyField
                label="Listener URL"
                value={buildTunnelUrl({ deviceId, token, name, mode: "listener" })}
            />
        </div>
    );
}

function DeviceWsCard({ device }) {
    const deviceId = device.d_id || device.device_id || "";

    const ctrl = {
        admins: Array.isArray(device.control?.admins) ? device.control.admins : [],
        operators: Array.isArray(device.control?.operators) ? device.control.operators : [],
        viewers: Array.isArray(device.control?.viewers) ? device.control.viewers : [],
        device: device.control?.device || false,
    };

    const stream = {
        admins: Array.isArray(device.stream?.admins) ? device.stream.admins : [],
        operators: Array.isArray(device.stream?.operators) ? device.stream.operators : [],
        viewers: Array.isArray(device.stream?.viewers) ? device.stream.viewers : [],
        device: device.stream?.device || false,
    };

    const tunnels = Array.isArray(device.tunnel) ? device.tunnel : [];

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

            {/* Control + Stream side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 10 }}>
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

                <div>
                    <div className="ws-col-label">Stream</div>
                    <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: "#999", marginRight: 4 }}>Admins</span>
                        <UserPills users={stream.admins} />
                    </div>
                    <div style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: "#999", marginRight: 4 }}>Operators</span>
                        <UserPills users={stream.operators} />
                    </div>
                    <div>
                        <span style={{ fontSize: 10, color: "#999", marginRight: 4 }}>Viewers</span>
                        <UserPills users={stream.viewers} />
                    </div>
                </div>
            </div>

            {/* Tunnel details, full width */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #ececf4" }}>
                <div className="ws-col-label" style={{ marginBottom: 8 }}>
                    Tunnels {tunnels.length > 0 && <span style={{ color: "#bbb" }}>({tunnels.length})</span>}
                </div>
                {tunnels.length === 0 ? (
                    <span style={{ color: "#bbb", fontSize: 12 }}>No tunnels configured.</span>
                ) : (
                    tunnels.map((t, i) => (
                        <TunnelRow key={t.t_token || i} deviceId={deviceId} tunnel={t} />
                    ))
                )}
            </div>
        </div>
    );
}

export default function Ws() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

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
            ds + (d.stream?.admins?.length || 0) + (d.stream?.operators?.length || 0) + (d.stream?.viewers?.length || 0), 0), 0);

    const totalTunnels = rooms.reduce((s, r) =>
        s + (r.devices || []).reduce((ds, d) =>
            ds + (Array.isArray(d.tunnel) ? d.tunnel.length : 0), 0), 0);

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
                        { label: "Rooms", value: rooms.length },
                        { label: "Devices", value: rooms.reduce((s, r) => s + (r.devices?.length || 0), 0) },
                        { label: "Stream users", value: totalUsers, accent: true },
                        { label: "Tunnels", value: totalTunnels },
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