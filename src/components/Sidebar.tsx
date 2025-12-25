import React from "react";
import { NavLink } from "react-router-dom";
import { MenuNode } from "./menu/types";

import { getAdminMenu } from "./menu/adminMenu";
import { useAuth } from "../store/auth";
import { Role } from "./menu/permissions";

import {
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  DropboxOutlined,
  TagsOutlined,
  QrcodeOutlined,
  FileDoneOutlined,
  ProfileOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  SettingOutlined,
} from "@ant-design/icons";

// ==========================
// MAP ICON THEO MENU KEY
// ==========================
const ICON_MAP: Record<string, React.ReactNode> = {
  "admin-users": <UserOutlined className="menu-icon" />,
  "admin-suppliers": <TeamOutlined className="menu-icon" />,
  "sup-farm": <EnvironmentOutlined className="menu-icon" />,
  "admin-supply-map": <AppstoreOutlined className="menu-icon" />,
  "admin-batchlist": <DropboxOutlined className="menu-icon" />,
  "admin-material": <TagsOutlined className="menu-icon" />,
  "admin-epcisevents": <QrcodeOutlined className="menu-icon" />,
  "admin-dpptemplates": <FileDoneOutlined className="menu-icon" />,
  "admin-dpp-list": <ProfileOutlined className="menu-icon" />,
  "admin-customportal": <AppstoreOutlined className="menu-icon" />,
  "admin-reports": <BarChartOutlined className="menu-icon" />,
  "admin-blockchainconfigs": <DatabaseOutlined className="menu-icon" />,
  "sup-systemconfigs": <SettingOutlined className="menu-icon" />,
};

type SidebarProps = {
  onNavigate?: () => void;
};

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const user = useAuth().user;

  // Role lấy từ user.role
  const role = (user?.role?.toLowerCase() as Role) || "supplier";

  // Menu phân quyền
  const dynamicMenu: MenuNode = getAdminMenu(role);

  // ============================
  // RENDER ITEM
  // ============================
  const renderMenu = (nodes: MenuNode[]) => (
    <ul className="space-y-1">
      {nodes.map((node) => {
        const iconNode = ICON_MAP[node.key];

        return (
          <li key={node.key}>
            {node.path ? (
              <NavLink
                to={node.path}
                onClick={onNavigate} // ⭐ QUAN TRỌNG: đóng sidebar mobile
                className={({ isActive }) =>
                  `
                  sidebar-item flex items-center gap-3 px-3 py-2 rounded-md 
                  transition-all duration-200 cursor-pointer
                  ${isActive ? "sidebar-active" : "text-gray-700 hover:bg-gray-50"}
                `
                }
              >
                {iconNode && (
                  <span className="text-lg flex items-center justify-center">
                    {iconNode}
                  </span>
                )}
                <span className="text-sm font-medium">{node.label}</span>
              </NavLink>
            ) : (
              <>
                <p className="mt-4 mb-2 text-xs font-semibold uppercase text-gray-500 px-1">
                  {node.label}
                </p>
                {node.children && renderMenu(node.children)}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className="
        w-64 border-r bg-white px-4 pt-6 pb-4
        sidebar-scroll select-none
      "
    >
      <h2 className="text-xs font-semibold text-gray-400 uppercase px-2 mb-3">
        {dynamicMenu.label}
      </h2>

      {renderMenu(dynamicMenu.children ?? [])}
    </aside>
  );
};

export default Sidebar;
