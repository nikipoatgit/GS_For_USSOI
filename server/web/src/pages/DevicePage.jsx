import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

/* ─── Inline styles (no external CSS file needed for this page) ─── */
const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --bg:           #f4f5f7;
    --surface:      #ffffff;
    --surface-alt:  #fafafe;
    --border:       #e0e1ea;
    --border-light: #eef0f8;
    --topbar:       #1a1a2e;
    --text-primary: #1a1a2e;
    --text-secondary:#555;
    --text-muted:   #999;
    --accent:       #5b6af0;
    --accent-dim:   rgba(91,106,240,0.08);
    --danger:       #e05252;
    --success:      #3db87a;
    --font:         'Segoe UI', system-ui, sans-serif;
    --mono:         'Consolas', 'Courier New', monospace;
}

body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
}

/* ── Shell ── */
.dp-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg);
}

/* ── Top bar ── */
.dp-topbar {
    height: 56px;
    background: var(--topbar);
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 12px;
    flex-shrink: 0;
}

.dp-back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #ccc;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.13s, color 0.13s;
}
.dp-back-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

.dp-topbar-sep {
    color: #333355;
    font-size: 18px;
}

.dp-id-badge {
    font-family: var(--mono);
    font-size: 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 5px;
    padding: 4px 10px;
    color: #ddd;
    letter-spacing: 0.04em;
}

.dp-status {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-left: auto;
}

.dot {
    display: inline-block;
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
}
.dot-green { background: var(--success); }
.dot-gray  { background: #555577; }

.dp-status-lbl {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: #8888aa;
}
.dp-status-lbl.live { color: var(--success); }

/* ── Body split ── */
.dp-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    overflow: hidden;
}

@media (max-width: 680px) {
    .dp-body { grid-template-columns: 1fr; }
}

.dp-panel {
    display: flex;
    flex-direction: column;
    padding: 22px 24px;
    overflow: hidden;
    border-right: 1px solid var(--border);
    background: var(--bg);
}

.dp-panel:last-child { border-right: none; }

/* ── Panel header ── */
.dp-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-shrink: 0;
}

.dp-panel-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
}

.dp-msg-count {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    background: var(--border-light);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2px 9px;
}

/* ── Message log ── */
.dp-log {
    flex: 1;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: var(--mono);
    font-size: 12.5px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
}

.dp-empty {
    margin: auto;
    color: var(--text-muted);
    font-size: 12px;
}

.dp-entry {
    display: flex;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid transparent;
    line-height: 1.5;
}

.dp-entry.sent {
    background: rgba(91,106,240,0.05);
    border-color: rgba(91,106,240,0.14);
}

.dp-entry.received {
    background: rgba(61,184,122,0.05);
    border-color: rgba(61,184,122,0.13);
}

.dp-tag {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 3px;
    flex-shrink: 0;
    align-self: flex-start;
    margin-top: 1px;
}

.dp-entry.sent     .dp-tag { background: rgba(91,106,240,0.12); color: var(--accent); }
.dp-entry.received .dp-tag { background: rgba(61,184,122,0.12); color: var(--success); }

.dp-entry-text {
    color: var(--text-primary);
    word-break: break-all;
    white-space: pre-wrap;
    line-height: 1.55;
}

/* ── Composer ── */
.dp-composer-textarea {
    flex: 1;
    resize: none;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--text-primary);
    font-family: var(--mono);
    font-size: 13px;
    padding: 12px 14px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    line-height: 1.6;
    min-height: 0;
}

.dp-composer-textarea::placeholder { color: #bbbbd0; }

.dp-composer-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(91,106,240,0.1);
}

.dp-composer-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    flex-shrink: 0;
}

.dp-composer-hint {
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.2px;
}

/* ── Send button ── */
.dp-send-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    background: var(--accent);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.13s, transform 0.1s;
    letter-spacing: 0.2px;
}
.dp-send-btn:hover    { background: #4a58e0; }
.dp-send-btn:active   { transform: scale(0.98); }
.dp-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Error bar ── */
.dp-send-error {
    margin-top: 8px;
    font-size: 12px;
    color: var(--danger);
    padding: 7px 10px;
    background: rgba(224,82,82,0.06);
    border: 1px solid rgba(224,82,82,0.18);
    border-radius: 6px;
    flex-shrink: 0;
}
`;

export default function DevicePage() {
    const { DeviceId } = useParams();
    const wsRef    = useRef(null);
    const logRef   = useRef(null);
    const [messages, setMessages]   = useState([]);
    const [input, setInput]         = useState("");
    const [connected, setConnected] = useState(false);
    const [sendError, setSendError] = useState("");

    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const ws = new WebSocket(`${protocol}://${window.location.host}/ws/user?deviceId=${DeviceId}`);
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;
        ws.onopen  = () => setConnected(true);
        ws.onmessage = (event) => {
            const msg = event.data instanceof ArrayBuffer
                ? new TextDecoder().decode(event.data)
                : event.data;
            setMessages(prev => [...prev, { type: "received", text: msg }]);
        };
        ws.onerror = () => setConnected(false);
        ws.onclose = () => setConnected(false);
        return () => ws.close();
    }, [DeviceId]);

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [messages]);

    const sendJsonBinary = () => {
        setSendError("");
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setSendError("WebSocket is not connected."); return;
        }
        try {
            const jsonObj    = JSON.parse(input);
            const jsonString = JSON.stringify(jsonObj);
            wsRef.current.send(new TextEncoder().encode(jsonString));
            setMessages(prev => [...prev, { type: "sent", text: jsonString }]);
            setInput("");
        } catch {
            setSendError("Invalid JSON — please check your message.");
        }
    };

    return (
        <>
            <style>{css}</style>
            <div className="dp-page">

                {/* Top bar */}
                <div className="dp-topbar">
                    <button className="dp-back-btn" onClick={() => window.close()}>
                        <svg viewBox="0 0 12 12" fill="none" width="11" height="11"
                             stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                            <path d="M8 2L4 6l4 4"/>
                        </svg>
                        Back
                    </button>
                    <span className="dp-topbar-sep">/</span>
                    <span className="dp-id-badge">{DeviceId}</span>
                    <div className="dp-status">
                        <span className={`dot ${connected ? "dot-green" : "dot-gray"}`} />
                        <span className={`dp-status-lbl ${connected ? "live" : ""}`}>
                            {connected ? "Connected" : "Offline"}
                        </span>
                    </div>
                </div>

                {/* Split body */}
                <div className="dp-body">

                    {/* Left — Message log */}
                    <div className="dp-panel">
                        <div className="dp-panel-header">
                            <span className="dp-panel-title">Message Log</span>
                            <span className="dp-msg-count">{messages.length} entries</span>
                        </div>
                        <div className="dp-log" ref={logRef}>
                            {messages.length === 0 && (
                                <span className="dp-empty">No messages yet</span>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`dp-entry ${msg.type}`}>
                                    <span className="dp-tag">{msg.type === "sent" ? "TX" : "RX"}</span>
                                    <span className="dp-entry-text">{msg.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Composer */}
                    <div className="dp-panel">
                        <div className="dp-panel-header">
                            <span className="dp-panel-title">Send JSON Payload</span>
                        </div>
                        <textarea
                            className="dp-composer-textarea"
                            placeholder={'{\n  "command": "ping"\n}'}
                            value={input}
                            onChange={e => { setInput(e.target.value); setSendError(""); }}
                        />
                        {sendError && <p className="dp-send-error">{sendError}</p>}
                        <div className="dp-composer-footer">
                            <span className="dp-composer-hint">Transmitted as binary · UTF-8</span>
                            <button
                                className="dp-send-btn"
                                onClick={sendJsonBinary}
                                disabled={!connected || !input.trim()}
                            >
                                <svg viewBox="0 0 12 12" fill="none" width="11" height="11"
                                     stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 6h8M7 2l4 4-4 4"/>
                                </svg>
                                Send
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
