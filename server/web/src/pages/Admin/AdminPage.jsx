import { useState } from "react";
import "./AdminPage.css";

import Users from "./Users"
import Devices from "./Devices"
import Logs from "./Logs"
import Ws from "./Ws.jsx"
import Backup from "./Backup"


export default function AdminPage() {

    const [section, setSection] = useState("users");

    const renderSection = () => {
        switch(section){
            case "users": return <Users />;
            case "devices": return <Devices />;
            case "WS": return <Ws />;
            case "logs": return <Logs />;
            case "backup": return <Backup />;
            default: return null;
        }
    };

    return (
        <div className="admin-container">

            <div className="top-bar">
                USSOI
            </div>

            <div className="main">

                <div className="sidebar">
                    <button onClick={()=>setSection("users")}>Users</button>
                    <button onClick={()=>setSection("devices")}>Devices</button>
                    <button onClick={()=>setSection("ws")}>Ws</button>
                    <button onClick={()=>setSection("logs")}>Logs</button>
                    <button onClick={()=>setSection("backup")}>Backup</button>
                </div>

                <div className="content">
                    {renderSection()}
                </div>

            </div>

        </div>
    );
}