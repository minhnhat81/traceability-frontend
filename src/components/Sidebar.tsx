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

const ICON_MAP: Record<string, React.ReactNode> = {
  "admin-users": <UserOutlined />,
  "admin-suppliers": <TeamOutlined />,
  "sup-farm": <EnvironmentOutlined />,
  "admin-supply-map": <AppstoreOutlined />,
  "admin-batchlist": <DropboxOutlined />,
  "admin-material": <TagsOutlined />,
  "admin-epcisevents": <QrcodeOutlined />,
  "admin-dpptemplates": <FileDoneOutlined />,
  "admin-dpp-list": <ProfileOutlined />,
  "admin-customportal": <AppstoreOutlined />,
  "admin-reports": <BarChartOutlined />,
  "admin-blockchainconfigs": <DatabaseOutlined />,
  "sup-systemconfigs": <SettingOutlined />,
};

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

const Sidebar = ({ className = "", onNavigate }: SidebarProps) => {
  const user = useAuth().user;
  const role = (user?.role?.toLowerCase() as Role) || "supplier";
  const dynamicMenu: MenuNode = getAdminMenu(role);

  const renderMenu = (nodes: MenuNode[]) => (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.key}>
          {node.path ? (
            <NavLink
              to={node.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md
                 ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`
              }
            >
              {ICON_MAP[node.key]}
              <span>{node.label}</span>
            </NavLink>
          ) : (
            <>
              <p className="mt-4 mb-2 text-xs font-semibold uppercase text-gray-400">
                {node.label}
              </p>
              {node.children && renderMenu(node.children)}
            </>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`
        fixed md:static
        top-0 left-0
        h-full w-64
        bg-white border-r
        px-4 pt-6 pb-4
        z-50
        transform transition-transform duration-300
        ${className}
      `}
    >
      <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">
        {dynamicMenu.label}
      </h2>

      {renderMenu(dynamicMenu.children ?? [])}
    </aside>
  );
};

export default Sidebar;
