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
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* backdrop */}
            <div
              className="flex-1 bg-black/40"
              onClick={() => setOpenSidebar(false)}
            />

            {/* SIDEBAR – KHÔNG BỌC THÊM DIV */}
            <Sidebar
              className="h-full"
              onNavigate={() => setOpenSidebar(false)}
            />
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
