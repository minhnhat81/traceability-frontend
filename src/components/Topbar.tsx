import React from "react";
import { Button } from "antd";
import { UserOutlined, LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, clearAuth, authInitialized } = useAuth();
  const navigate = useNavigate();

  if (!authInitialized) return null;

  const username = user?.username || user?.name || "User";
  const role = user?.role || "guest";

  const handleLogout = () => {
    clearAuth();

    // ✅ SPA redirect (KHÔNG reload page)
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-white shadow px-6 py-3 flex justify-between items-center">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="md:hidden p-2 rounded hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <MenuOutlined style={{ fontSize: 20 }} />
        </button>

        <h1 className="text-lg font-semibold">Traceability Portal</h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 flex items-center gap-2">
          <UserOutlined style={{ color: "#5b3cc4" }} />
          {username} ({role})
        </span>

        <Button
          type="link"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
