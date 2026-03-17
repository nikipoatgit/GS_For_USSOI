import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import DevicePage from "./pages/Device/DevicePage.jsx";
import AdminPage from "./pages/Admin/AdminPage.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/Device/:DeviceId" element={<DevicePage />} />
                <Route path="/admin" element={<AdminPage />} />

                {/* default */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}