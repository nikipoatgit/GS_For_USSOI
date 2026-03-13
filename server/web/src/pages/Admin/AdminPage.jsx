import { useState } from "react";
import "./AdminPage.css";
import Users   from "./Users";
import Devices from "./Devices";
import Logs    from "./Logs";
import Ws      from "./Ws";
import Backup  from "./Backup";

const NAV = [
    { key: "users",   label: "Users",   icon: "👤" },
    { key: "devices", label: "Devices", icon: "📡" },
    { key: "ws",      label: "WS",      icon: "🔌" },
    { key: "logs",    label: "Logs",    icon: "📋" },
    { key: "backup",  label: "Backup",  icon: "💾" },
];

function renderSection(section) {
    switch (section) {
        case "users":   return <Users />;
        case "devices": return <Devices />;
        case "ws":      return <Ws />;
        case "logs":    return <Logs />;
        case "backup":  return <Backup />;
        default:        return null;
    }
}

export default function AdminPage() {
    const [section, setSection] = useState("users");

    return (
        <div className="admin-container">
            <div className="top-bar">
                USSOI <span>Admin Panel</span>
            </div>
            <div className="main">
                <div className="sidebar">
                    {NAV.map(n => (
                        <button
                            key={n.key}
                            className={section === n.key ? "active" : ""}
                            onClick={() => setSection(n.key)}
                        >
                            <span className="sidebar-icon">{n.icon}</span>
                            {n.label}
                        </button>
                    ))}
                </div>
                <div className="content">
                    {renderSection(section)}
                </div>
            </div>
        </div>
    );
}