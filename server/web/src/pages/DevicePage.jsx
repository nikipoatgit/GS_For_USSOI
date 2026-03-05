import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

export default function DevicePage() {

    const { DeviceId } = useParams();
    const wsRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    useEffect(() => {

        const protocol =
            window.location.protocol === "https:" ? "wss" : "ws";

        const ws = new WebSocket(
            `${protocol}://${window.location.host}/ws/user?deviceId=${DeviceId}`
        );

        ws.binaryType = "arraybuffer";

        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {

            let msg;

            if (event.data instanceof ArrayBuffer) {

                const decoder = new TextDecoder();
                msg = decoder.decode(event.data);

            } else {

                msg = event.data;

            }

            setMessages(prev => [...prev, msg]);

        };

        ws.onerror = (err) => {
            console.error("WebSocket error", err);
        };

        ws.onclose = () => {
            console.log("WebSocket closed");
        };

        return () => ws.close();

    }, [DeviceId]);



    const sendJsonBinary = () => {

        if (!wsRef.current) return;

        if (wsRef.current.readyState !== WebSocket.OPEN) return;

        try {

            const jsonObj = JSON.parse(input);

            const jsonString = JSON.stringify(jsonObj);

            const encoder = new TextEncoder();

            const binary = encoder.encode(jsonString);

            wsRef.current.send(binary);

            setMessages(prev => [
                ...prev,
                "Sent → " + jsonString
            ]);

            setInput("");

        } catch (err) {

            alert("Invalid JSON");

        }
    };



    return (
        <div style={{
            padding: "30px",
            background: "#07090e",
            minHeight: "100vh",
            color: "white",
            fontFamily: "Arial"
        }}>

            <h2>Device {DeviceId}</h2>

            <div style={{ marginBottom: "20px" }}>

                <textarea
                    placeholder='Enter JSON message'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    style={{
                        width: "100%",
                        height: "120px",
                        background: "#1a1f29",
                        color: "white",
                        border: "1px solid #333",
                        padding: "10px"
                    }}
                />

                <button
                    onClick={sendJsonBinary}
                    style={{
                        marginTop: "10px",
                        padding: "8px 15px",
                        background: "#2d6cdf",
                        border: "none",
                        color: "white",
                        cursor: "pointer"
                    }}
                >
                    Send JSON (Binary)
                </button>

            </div>

            <div>

                <h3>Messages</h3>

                <div style={{
                    background: "#1a1f29",
                    padding: "15px",
                    borderRadius: "6px",
                    maxHeight: "400px",
                    overflowY: "auto"
                }}>

                    {messages.map((msg, i) => (
                        <div key={i} style={{ marginBottom: "8px" }}>
                            {msg}
                        </div>
                    ))}

                </div>

            </div>

        </div>
    );
}