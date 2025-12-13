// src/components/menu/adminMenu.ts
import { MenuNode } from "./types";
import { PERMISSIONS, Role } from "./permissions";

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

// đơn giản: module cứ để string, không cần type phức tạp
const canShow = (role: Role, module: string) => {
  const p = (PERMISSIONS as any)[role]?.[module];
  return p === "show" || p === "limited";
};

export const getAdminMenu = (role: Role): MenuNode => {
  const children: MenuNode[] = [];

  if (canShow(role, "users")) {
    children.push({
      key: "admin-users",
      label: "Users",
      path: "/users",
      icon: UserOutlined,
    });
  }

  if (canShow(role, "suppliers")) {
    children.push({
      key: "admin-suppliers",
      label: "Suppliers",
      path: "/suppliers",
      icon: TeamOutlined,
    });
  }

  if (canShow(role, "farmmgmt")) {
    children.push({
      key: "sup-farm",
      label: "Farm Management",
      path: "/supplier/farms",
      icon: EnvironmentOutlined,
    });
  }

  // Supply Map luôn show
  children.push({
    key: "admin-supply-map",
    label: "Supply Map",
    path: "/map",
    icon: AppstoreOutlined,
  });

  if (canShow(role, "batches")) {
    children.push({
      key: "admin-batchlist",
      label: "Batches",
      path: "/batches",
      icon: DropboxOutlined,
    });
  }

  if (canShow(role, "material")) {
    children.push({
      key: "admin-material",
      label: "Material",
      path: "/material",
      icon: TagsOutlined,
    });
  }

  if (canShow(role, "epcis")) {
    children.push({
      key: "admin-epcisevents",
      label: "EPCIS Events",
      path: "/epcis-events",
      icon: QrcodeOutlined,
      limited: PERMISSIONS[role].epcis === "limited",
    });
  }

  if (canShow(role, "dpptemplates")) {
    children.push({
      key: "admin-dpptemplates",
      label: "DPP Templates",
      path: "/dpp_templates",
      icon: FileDoneOutlined,
    });
  }

  if (canShow(role, "dppregistry")) {
    children.push({
      key: "admin-dpp-list",
      label: "DPP Registry",
      path: "/dpp_list",
      icon: ProfileOutlined,
    });
  }

  // Custom Portal luôn show
  children.push({
    key: "admin-customportal",
    label: "Custom Portal",
    path: "/customportal",
    icon: AppstoreOutlined,
  });

  // Reports & Dashboard luôn show
  children.push({
    key: "admin-reports",
    label: "Reports & Dashboard",
    path: "/admin-dashboard",
    icon: BarChartOutlined,
  });

  if (canShow(role, "blockchainconfigs")) {
    children.push({
      key: "admin-blockchainconfigs",
      label: "Blockchain Configs",
      path: "/configs_blockchain",
      icon: DatabaseOutlined,
    });
  }

  if (canShow(role, "systemconfig")) {
    children.push({
      key: "sup-systemconfigs",
      label: "System Configuration",
      path: "/systemconfigs",
      icon: SettingOutlined,
    });
  }

  return {
    key: "portal-admin",
    label: "Admin Portal",
    children,
  };
};
