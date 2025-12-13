export interface MenuNode {
  key: string;
  label: string;
  path?: string;
  children?: MenuNode[];
}

export const MENU_TREE: MenuNode[] = [];
