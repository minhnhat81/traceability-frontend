import React from "react";
import { Button } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../store/auth";

export default function Toptabs() {
  const { user, clearAuth, authInitialized } = useAuth();

  if (!authInitialized) return null;

  const username = user?.username || user?.name || "User";
  const role = user?.role || "guest";

  return (
    <header className="bg-white shadow px-6 py-3 flex justify-between items-center">
      <h1 className="text-lg font-semibold">Traceability Portal</h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 flex items-center gap-2">
          <UserOutlined style={{ color: "#5b3cc4" }} /> {username} ({role})
        </span>
        <Button
          type="link"
          danger
          icon={<LogoutOutlined />}
          onClick={() => {
            clearAuth();
            window.location.href = "/#/login";
          }}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
