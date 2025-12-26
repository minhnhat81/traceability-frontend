import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "../Topbar";
import Sidebar from "../Sidebar";

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* TOP BAR */}
      <Topbar
  onMenuClick={() => {
    console.log("MENU CLICKED"); // 👈 BẮT BUỘC LOG RA
    setOpenSidebar(true);
  }}
/>


      <div className="flex flex-1 relative">
        {/* ===== SIDEBAR DESKTOP ===== */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* ===== SIDEBAR MOBILE (DRAWER) ===== */}
        {openSidebar && (
  <div className="fixed inset-0 z-50 md:hidden">
    {/* BACKDROP */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setOpenSidebar(false)}
    />

    {/* SIDEBAR */}
    <Sidebar
      className="
        mobile-sidebar
        fixed top-0 left-0 h-full
        w-64 bg-white
        transform translate-x-0
      "
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
