import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import TraceabilityMenuShadcn from "./menu/TraceabilityMenuShadcn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Package,
  Layers,
  Activity,
  FileText,
  CloudUpload,
  Eye,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../store/auth";

/* ============================================================
 * ✅ Thanh top menu chính (dùng React Router)
 * ============================================================ */
const TopTabs = () => {
  const location = useLocation();

  const tabs = [
    { key: "dash", label: "Dashboard", to: "/", icon: LayoutDashboard },
    { key: "products", label: "Products", to: "/products", icon: Package },
    { key: "batches", label: "Batches", to: "/batches", icon: Layers },
    { key: "events", label: "EPCIS Events", to: "/epcis/events", icon: Activity },
    { key: "epcis", label: "EPCIS Capture", to: "/epcis/capture", icon: CloudUpload },
    { key: "docs", label: "Documents & VC", to: "/documents", icon: FileText },
    { key: "observer", label: "Observer", to: "/observer", icon: Eye },
    { key: "cfg", label: "Configs", to: "/configs", icon: Settings },
  ];

  const activePath = location.pathname === "/" ? "/" : location.pathname;

  return (
    <div className="border-t border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-center gap-4 px-4 py-2 text-sm font-medium">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activePath.startsWith(t.to);
          return (
            <Link
              key={t.key}
              to={t.to}
              className={`relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 transition-all
                ${
                  isActive
                    ? "text-blue-700 font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 shadow-sm"
                    : "text-gray-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50"
                }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================
 * ✅ Thanh user info + Logout (góc phải)
 * ============================================================ */
const UserStatus = () => {
  const { token, user, setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!token) {
    return (
      <div className="ml-auto text-sm text-gray-500 flex items-center gap-2">
        <User className="w-4 h-4" /> Not logged in
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1 text-gray-700">
        <User className="w-4 h-4 text-blue-500" />
        <span className="font-medium">{user?.username || "User"}</span>
        <span className="text-gray-400">({user?.role || "guest"})</span>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );
};

/* ============================================================
 * ✅ Layout chính của ứng dụng
 * ============================================================ */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [picked, setPicked] = useState<any>(null);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-muted/20">
      {/* ✅ Thanh topbar */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="text-lg font-semibold">
            Traceability{" "}
            <span className="text-gray-400 text-sm">— Multi-Portal</span>
          </div>
          {/* ✅ Thêm user info + logout */}
          <UserStatus />
        </div>

        {/* ✅ Thanh menu top */}
        <TopTabs />
      </div>

      {/* ✅ Bố cục lưới chính */}
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
        {/* Sidebar menu */}
        <div className="md:col-span-4 lg:col-span-3 h-[78vh] sticky top-28">
          <TraceabilityMenuShadcn onPick={setPicked} />
        </div>

        {/* Nội dung chính */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {picked?.label || "Welcome!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {picked ? (
                <div>
                  Đường dẫn: <code>{picked.path}</code>
                </div>
              ) : (
                <div></div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* ✅ Khu vực render page */}
          <div className="rounded-xl border bg-background p-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
