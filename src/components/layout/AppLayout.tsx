import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* TOP BAR */}
      <Topbar onMenuClick={() => setOpenSidebar(true)} />

      <div className="flex flex-1 relative">
        {/* ===== SIDEBAR DESKTOP ===== */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* ===== SIDEBAR MOBILE (DRAWER) ===== */}
        {openSidebar && (
  <div className="fixed inset-0 z-40 md:hidden">
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setOpenSidebar(false)}
    />
    <Sidebar onNavigate={() => setOpenSidebar(false)} />
  </div>
)}


        {/* ===== MAIN CONTENT ===== */}
        <main className="main-content flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
