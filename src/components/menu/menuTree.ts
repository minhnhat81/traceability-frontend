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

import type { MenuNode } from "./types";

export const MENU_TREE: MenuNode[] = [
  {
    key: "users",
    label: "Users",
    path: "/users",
    icon: UserOutlined,
  },
  {
    key: "suppliers",
    label: "Suppliers",
    path: "/suppliers",
    icon: TeamOutlined,
  },
  {
    key: "farm",
    label: "Farm Management",
    path: "/supplier/farms",
    icon: EnvironmentOutlined,
  },
  {
    key: "supply-map",
    label: "Supply Map",
    path: "/map",
    icon: AppstoreOutlined,
  },
  {
    key: "batches",
    label: "Batches",
    path: "/batches",
    icon: DropboxOutlined,
  },
  {
    key: "material",
    label: "Material",
    path: "/material",
    icon: TagsOutlined,
  },
  {
    key: "epcis-events",
    label: "EPCIS Events",
    path: "/epcis-events",
    icon: QrcodeOutlined,
  },
  {
    key: "dpp-templates",
    label: "DPP Templates",
    path: "/dpp_templates",
    icon: FileDoneOutlined,
  },
  {
    key: "dpp-registry",
    label: "DPP Registry",
    path: "/dpp_list",
    icon: ProfileOutlined,
  },
  {
    key: "custom-portal",
    label: "Custom Portal",
    path: "/customportal",
    icon: AppstoreOutlined,
  },
  {
    key: "reports",
    label: "Reports & Dashboard",
    path: "/admin-dashboard",
    icon: BarChartOutlined,
  },
  {
    key: "blockchain-config",
    label: "Blockchain Configs",
    path: "/configs_blockchain",
    icon: DatabaseOutlined,
  },
  {
    key: "system",
    label: "System Configuration",
    path: "/systemconfigs",
    icon: SettingOutlined,
  },
];
