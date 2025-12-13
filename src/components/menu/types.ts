// src/components/menu/types.ts
import type { ComponentType } from "react";

export type MenuNode = {
  key: string;
  label: string;
  path?: string;
  children?: MenuNode[];

  // icon là 1 React component, VD: UserOutlined
  icon?: ComponentType<{ className?: string }>;

  limited?: boolean;
};
