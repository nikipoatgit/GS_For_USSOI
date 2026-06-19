import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/user/login", { method: "POST", credentials: "include" });
                if (res.ok) navigate("/home");
            } catch {}
        };
        checkSession();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const data = new FormData(e.target);
        try {
            const res = await fetch("/api/user/login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId:   data.get("userId"),
                    userPass: data.get("userPassword"),
                }),
            });
            if (res.ok) {
                navigate("/home");
            } else if (res.status === 401) {
                setError("Invalid credentials");
            } else if (res.status === 403) {
                setError("Access denied");
            } else {
                setError(`Server error (${res.status})`);
            }
        } catch {
            setError("Could not reach server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">

            {/* Top bar */}
            <div className="topbar">
                <div className="topbar-logo">
                    <div className="topbar-logo-mark">
                        <svg viewBox="0 0 14 14" fill="none" width="14" height="14"
                             stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
                            <rect x="2" y="2" width="10" height="10" rx="2"/>
                            <path d="M5 7h4M7 5v4"/>
                        </svg>
                    </div>
                    <span className="topbar-name">USSOI</span>
                    <span className="topbar-sub">System Access</span>
                </div>
            </div>

            {/* Card */}
            <div className="page-body">
                <div className="login-card">
                    <h2 className="login-card-title">Sign In</h2>
                    <p className="login-card-sub">Admin &amp; Configuration</p>
                    <div className="divider" />

                    <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false">
                        <div className="field-group">
                            <div className="field">
                                <label>User ID</label>
                                <input name="userId" placeholder="Enter user ID" required />
                            </div>
                            <div className="field">
                                <label>Password</label>
                                <input name="userPassword" type="password" placeholder="••••••••" required />
                            </div>
                        </div>

                        <button className="submit-btn" type="submit" disabled={loading}>
                            {loading ? "Authenticating…" : "Authenticate"}
                        </button>

                        {error && (
                            <div className="error-row">
                                <span className="error-dot" />
                                <span className="error-text">{error}</span>
                            </div>
                        )}
                    </form>
                </div>

                <p className="login-footer">Secure session · TLS encrypted</p>
            </div>

        </div>
    );
}
