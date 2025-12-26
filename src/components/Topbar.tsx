import { Button } from "antd";
import { UserOutlined, LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { useAuth } from "../store/auth";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, clearAuth, authInitialized } = useAuth();
  console.log("🔥 TOPBAR NEW RENDERED");

  if (!authInitialized) return null;

  const username = user?.username || user?.name || "User";
  const role = user?.role || "guest";

  return (
    <header className="bg-white shadow px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {/* ☰ MOBILE MENU */}
        <button
          type="button"
          className="md:hidden p-2 rounded hover:bg-gray-100"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <MenuOutlined style={{ fontSize: 20 }} />
        </button>

        <h1 className="text-lg font-semibold">Traceability Portal</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 flex items-center gap-2">
          <UserOutlined style={{ color: "#5b3cc4" }} />
          {username} ({role})
        </span>

        <Button
          type="link"
          danger
          icon={<LogoutOutlined />}
          onClick={() => {
            clearAuth();
            window.location.href = "/#/login"; // HashRouter
          }}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
