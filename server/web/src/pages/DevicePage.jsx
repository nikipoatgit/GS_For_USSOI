import { useParams } from "react-router-dom";

export default function DevicePage() {
    const { clientId } = useParams();

    return (
        <div>
            <h2>Client {clientId}</h2>
            {/* WebSocket + stream logic later */}
        </div>
    );
}