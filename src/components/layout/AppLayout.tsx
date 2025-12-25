import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { MenuOutlined } from "@ant-design/icons";
import Topbar from "../../components/Topbar";
import Sidebar from "../../components/Sidebar";

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* TOP BAR */}
      <div className="relative">
        <Topbar />
        {/* MOBILE MENU BUTTON – FORCE */}
        <button
          className="md:hidden absolute left-4 top-4 z-50 p-2 rounded hover:bg-gray-100"
          onClick={() => {
            console.log("🔥 FORCE OPEN SIDEBAR");
            setOpenSidebar(true);
          }}
        >
          <MenuOutlined style={{ fontSize: 20 }} />
        </button>
      </div>

      <div className="flex flex-1 relative">
        {/* DESKTOP */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* MOBILE */}
        {openSidebar && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="flex-1 bg-black bg-opacity-30"
              onClick={() => setOpenSidebar(false)}
            />
            <div className="w-64 bg-white p-4">
              <Sidebar />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
