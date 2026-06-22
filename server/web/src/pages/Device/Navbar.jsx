// features/overlays/Navbar.jsx

import { useState } from "react";
import { C, FONT } from "../../shared/theme.js";

export function Navbar({ onClientDetails, onTunnels }) {
    return (
        <nav
            style={{
                background: C.surface,
                borderBottom: `1px solid ${C.line}`,
                borderBottomLeftRadius: 18,
                borderBottomRightRadius: 18,
                height: 54,
                padding: "0 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                zIndex: 50,
                backdropFilter: "blur(10px)",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                fontFamily: FONT,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span
                    style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: C.t0,
                        letterSpacing: 0.4,
                        userSelect: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <span>USSOI</span>

                    <span
                        style={{
                            width: 5,
                            height: 5,
                            borderRadius: 999,
                            background: C.blue,
                            boxShadow: `0 0 10px ${C.blue}`,
                        }}
                    />

                    <span style={{ opacity: 0.9 }}>GCS</span>
                </span>

                <GhLink />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <NavBtn onClick={onClientDetails}>Client Details</NavBtn>
                <NavBtn onClick={onTunnels}>Tunnels</NavBtn>
                <NavBtn>Logout</NavBtn>
            </div>
        </nav>
    );
}

function GhLink() {
    const [hov, setHov] = useState(false);

    return (

        <a
            href="https://github.com/nikipoatgit"
            target="_blank"
            rel="noopener noreferrer"
            style={{
                fontSize: 12,
                fontWeight: 500,
                color: hov ? C.t1 : C.t3,
                textDecoration: "none",
                transition: "all 0.18s ease",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 8,
                opacity: hov ? 1 : 0.8,
                transform: hov ? "translateY(-1px)" : "translateY(0)",
            }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
        >
            <img
                src="/git_profile_square.png" // Correct path format for files sitting inside your public folder
                alt="GitHub nikipo at git logo"
                style={{
                    width: 16,            // Increased size slightly so the picture inside is legible
                    height: 16,
                    padding: "2px",       // Balanced padding for a cleaner circle border ring
                    background: hov ? `${C.line}66` : `${C.line}22`,
                    borderRadius: "50%",  // This makes the square image cut into a perfect circle
                    display: "block",
                    objectFit: "cover",   // CRITICAL: Prevents your image from squishing or warping inside the circle
                    transition: "all 0.18s ease",
                    // Completely removed the 'filter' layout line so your actual image details display properly!
                }}
            />
            <span>github/nikipoatgit</span>
        </a>


    );
}

function NavBtn({ children, onClick }) {
    const [hov, setHov] = useState(false);

    return (
        <button
            onClick={onClick}
            style={{
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 500,
                border: `1px solid ${hov ? C.lineMd : C.line}`,
                borderRadius: 12,
                background: hov ? C.raised : "transparent",
                color: hov ? C.t0 : C.t1,
                cursor: "pointer",
                fontFamily: FONT,
                transition: "all 0.18s ease",
                letterSpacing: 0.2,
                backdropFilter: "blur(6px)",
                transform: hov ? "translateY(-1px)" : "translateY(0)",
            }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
        >
            {children}
        </button>
    );
}