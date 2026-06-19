import { useState, useEffect, useCallback } from "react";
import { adminPost } from "./api";
import Toast from "./Toast";

const ROLES = ["admin", "operator", "viewer"];

function roleBadge(role) {
    const r = (role || "").toLowerCase();
    const cls = r === "admin" ? "badge-admin"
              : r === "operator" ? "badge-operator"
              : r === "viewer"   ? "badge-viewer"
              : "badge-unknown";
    return <span className={`badge ${cls}`}>{role}</span>;
}

export default function Users() {
    const [users, setUsers]       = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const [showAdd, setShowAdd]   = useState(false);
    const [toast, setToast]       = useState(null);
    const [deleting, setDeleting] = useState(null);   // user_id being deleted
    const [form, setForm]         = useState({ user_id: "", username: "", password: "", role: "operator" });
    const [formErr, setFormErr]   = useState("");
    const [adding, setAdding]     = useState(false);

    const notify = (message, type = "success") => setToast({ message, type });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        const { ok, status, data } = await adminPost({ type: "user", cmd: "get" });
        setLoading(false);
        if (!ok) {
            setError(status === 401 ? "Not authenticated — please log in first." : `Error ${status}`);
            return;
        }
        setUsers(data.users || []);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleAdd = async () => {
        setFormErr("");
        if (!form.user_id || !form.username || !form.password || !form.role) {
            setFormErr("All fields are required.");
            return;
        }
        setAdding(true);
        const { ok, status, data } = await adminPost({
            type: "user", cmd: "add",
            user_id: Number(form.user_id),
            username: form.username,
            password: form.password,
            role: form.role,
        });
        setAdding(false);
        if (!ok && status !== 200) { notify(`Request failed (${status})`, "error"); return; }
        if (data.status === "ACK") {
            notify(data.message || "User added");
            setShowAdd(false);
            setForm({ user_id: "", username: "", password: "", role: "operator" });
            fetchUsers();
        } else {
            notify(data.message || "Failed to add user", "error");
        }
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        const { ok, status, data } = await adminPost({ type: "user", cmd: "delete", user_id: Number(id) });
        setDeleting(null);
        if (!ok && status !== 200) { notify(`Request failed (${status})`, "error"); return; }
        if (data.status === "ACK") {
            notify(data.message || "User deleted");
            fetchUsers();
        } else {
            notify(data.message || "Failed to delete", "error");
        }
    };

    return (
        <div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <div className="section-header">
                <h2 className="section-title">Users</h2>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-ghost" onClick={fetchUsers} disabled={loading}>
                        {loading ? <span className="spinner" /> : "↻"} Refresh
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                        + Add User
                    </button>
                </div>
            </div>

            {/* ── User table ── */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {error ? (
                    <div className="state-box error">⚠ {error}</div>
                ) : loading && users.length === 0 ? (
                    <div className="state-box"><span className="spinner" /> Loading users…</div>
                ) : users.length === 0 ? (
                    <div className="state-box">No users found.</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Last Login</th>
                                <th>Active</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontFamily: "monospace", color: "#888" }}>{u.id}</td>
                                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                                    <td>{roleBadge(u.role)}</td>
                                    <td style={{ color: "#888", fontSize: 12 }}>{u.last_login || "—"}</td>
                                    <td>
                                        {u.active === true || u.active === "true"
                                            ? <><span className="dot dot-green" />Active</>
                                            : u.active === false || u.active === "false"
                                            ? <><span className="dot dot-red" />Inactive</>
                                            : <span style={{ color: "#bbb" }}>—</span>
                                        }
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: "5px 12px", fontSize: 12 }}
                                            onClick={() => handleDelete(u.id)}
                                            disabled={deleting === u.id}
                                        >
                                            {deleting === u.id ? <span className="spinner" /> : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Add User Modal ── */}
            {showAdd && (
                <div className="modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Add New User</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>User ID</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 201"
                                    value={form.user_id}
                                    onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    placeholder="e.g. rahul"
                                    value={form.username}
                                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                >
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        {formErr && <p style={{ color: "#e05252", fontSize: 13, marginTop: 10 }}>{formErr}</p>}
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
                                {adding ? <span className="spinner" /> : "Add User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
