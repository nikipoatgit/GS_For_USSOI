import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 2800);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            {type === "success" ? "✓ " : "✕ "}{message}
        </div>
    );
}
