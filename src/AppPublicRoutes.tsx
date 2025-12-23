// src/AppPublicRoutes.tsx
import { Routes, Route } from "react-router-dom";
import PublicConsumerDppPage from "./pages/PublicConsumerDppPage";
import PublicQRRedirect from "./pages/PublicQRRedirect";
import QRScanPage from "./pages/customer/QRScanPage";

export default function AppPublicRoutes() {
  return (
    <Routes>
      <Route path="/dpp/:refId" element={<PublicConsumerDppPage />} />
      <Route path="/qr/:refId" element={<PublicQRRedirect />} />
      <Route path="/consumer/scan" element={<QRScanPage />} />
    </Routes>
  );
}
