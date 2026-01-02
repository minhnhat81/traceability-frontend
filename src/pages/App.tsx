import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import AppLayout from "../components/layout/AppLayout";

// Pages
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Batches from "../pages/Batches";
import EPCISEvents from "../pages/EPCISEvents";
import EPCISCapture from "../pages/EPCISCapture";
import DocumentsVC from "../pages/DocumentsVC";
import Observer from "../pages/Observer";
import Configs from "../pages/Configs";
import BatchDetail from "../pages/BatchDetail";
import BlockchainSettings from "../pages/BlockchainSettings";
import Farms from "../pages/suppliers/farms/Farms";
import Users from "../pages/Users";
import Suppliers from "../pages/Suppliers";
import DPPTemplates from "../pages/DPPTemplates";
import MaterialPage from "../pages/Materials";
import DppListPage from "../pages/DppListPage";

// Public
import QRScanPage from "./customer/QRScanPage";
import ProductInfoPage from "./customer/ProductInfoPage";
import MapViewPage from "./customer/MapViewPage";
import CertificationsPage from "./customer/CertificationsPage";
import RepairRecyclePage from "./customer/RepairRecyclePage";
import BlockchainProofPage from "./customer/BlockchainProofPage";
import PublicQRRedirect from "../pages/PublicQRRedirect";
import PublicConsumerDppPage from "../pages/PublicConsumerDppPage";

export default function App() {
  const { token, user, authInitialized, initAuth } = useAuth();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!authInitialized) {
    return <div className="p-4 text-center text-gray-500">Initializing…</div>;
  }

  const isAdmin =
    user?.role === "admin" || user?.role === "superadmin";

  return (
    <Routes>
      {/* ===== PUBLIC ===== */}
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route path="/dpp/:refId" element={<PublicConsumerDppPage />} />
      <Route path="/qr/:refId" element={<PublicQRRedirect />} />

      <Route path="/consumer/scan" element={<QRScanPage />} />
      <Route path="/consumer/product" element={<ProductInfoPage />} />
      <Route path="/consumer/map" element={<MapViewPage />} />
      <Route path="/consumer/certifications" element={<CertificationsPage />} />
      <Route path="/consumer/repair" element={<RepairRecyclePage />} />
      <Route
        path="/consumer/blockchain-proof"
        element={<BlockchainProofPage />}
      />

      {/* ===== ADMIN (AppLayout) ===== */}
      <Route
        path="/"
        element={token ? <AppLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="batches" element={<Batches />} />
        <Route path="epcis-events" element={<EPCISEvents />} />
        <Route path="epcis/capture" element={<EPCISCapture />} />
        <Route path="documents" element={<DocumentsVC />} />
        <Route path="observer" element={<Observer />} />
        <Route path="configs" element={<Configs />} />
        <Route path="batch" element={<BatchDetail />} />
        <Route path="configs_blockchain" element={<BlockchainSettings />} />
        <Route path="supplier/farms" element={<Farms />} />
        <Route path="users" element={<Users />} />
        <Route path="suppliers" element={<Suppliers />} />

        {/* 🔐 DPP Templates — chỉ admin & superadmin */}
        <Route
          path="dpp_templates"
          element={
            isAdmin ? <DPPTemplates /> : <Navigate to="/" replace />
          }
        />

        <Route path="material" element={<MaterialPage />} />
        <Route path="dpp_list" element={<DppListPage />} />
      </Route>
    </Routes>
  );
}
