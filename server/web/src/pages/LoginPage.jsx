import { useState,useEffect  } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
    const [error, setError] = useState("");
    const navigate = useNavigate()

    // Page Load Check for Auth.
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/user/login", {
                    method: "POST",   // your merged endpoint
                    credentials: "include"
                });

                if (res.ok) {
                    navigate("/home");
                }
            } catch (err) {
                // ignore network error here
            }
        };

        checkSession();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(e.target);

        try {
            const res = await fetch("/api/user/login", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({
                    userId: data.get("userId"),
                    userPass: data.get("userPassword"),
                }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                setError("");
                navigate("/home");
            } else if (res.status === 401) {
                setError("Invalid credentials");
            } else if (res.status === 403) {
                setError("Access denied");
            } else {
                setError(`Server error (${res.status})`);
            }
        } catch (err) {
            setError("Could not reach server");
        }

    };

    return (
        <div className="page">
            <form
                className="form"
                onSubmit={handleSubmit}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
            >
                <div className="card">
                    <h2 className="title">System Access</h2>
                    <p className="subtitle">Admin & Configuration</p>

                    {/* LOGIN */}
                    <div className="section">
                        <label className="label">User Credentials</label>

                        <input
                            name="userId"
                            placeholder="User Id"
                            required
                        />

                        <input
                            name="userPassword"
                            type="password"
                            placeholder="Password"
                            required
                        />
                    </div>

                    <button className="button" type="submit">
                        Authenticate
                    </button>

                    {error && <p className="error">{error}</p>}
                </div>

            </form>
        </div>
    );
}