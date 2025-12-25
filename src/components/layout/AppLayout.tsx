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

        {/* ===== SIDEBAR MOBILE ===== */}
        {openSidebar && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            {/* backdrop */}
            <div
              className="flex-1 bg-black bg-opacity-30"
              onClick={() => setOpenSidebar(false)}
            />

            {/* sidebar */}
            <div className="w-64 bg-white border-r p-4 sidebar-scroll">
              <Sidebar onNavigate={() => setOpenSidebar(false)} />
            </div>
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
