export type Role =
  | "farm"
  | "supplier"
  | "manufacturer"
  | "brand"
  | "admin"
  | "superadmin";

export type Permission = "show" | "hide" | "limited";

/**
 * Bảng phân quyền theo module
 * Áp dụng cho menu và cả hạn chế chức năng (EPCIS Proof)
 */
export const PERMISSIONS: Record<Role, Record<string, Permission>> = {
  // ===============================================================
  // FARM
  // ===============================================================
  farm: {
    users: "hide",
    suppliers: "hide",
    batches: "show",
    material: "hide",
    epcis: "limited",          // Show nhưng không được xem Blockchain Proof
    dpptemplates: "hide",
    dppregistry: "show",
    blockchainconfigs: "hide",
    systemconfig: "hide",
    farmmgmt: "show",
  },

  // ===============================================================
  // SUPPLIER
  // ===============================================================
  supplier: {
    users: "hide",
    suppliers: "hide",
    batches: "show",
    material: "show",
    epcis: "limited",
    dpptemplates: "hide",
    dppregistry: "show",
    blockchainconfigs: "hide",
    systemconfig: "hide",
    farmmgmt: "show",
  },

  // ===============================================================
  // MANUFACTURER
  // ===============================================================
  manufacturer: {
    users: "hide",
    suppliers: "show",
    batches: "show",
    material: "show",
    epcis: "limited",
    dpptemplates: "hide",
    dppregistry: "show",
    blockchainconfigs: "hide",
    systemconfig: "hide",
    farmmgmt: "show",
  },

  // ===============================================================
  // BRAND
  // ===============================================================
  brand: {
    users: "hide",
    suppliers: "hide",
    batches: "show",
    material: "show",
    epcis: "limited",
    dpptemplates: "hide",
    dppregistry: "show",
    blockchainconfigs: "hide",
    systemconfig: "hide",
    farmmgmt: "show",
  },

  // ===============================================================
  // ADMIN
  // ===============================================================
  admin: {
    users: "show",            // Không được tạo admin/superadmin → xử lý tại màn Users
    suppliers: "show",
    batches: "show",
    material: "show",
    epcis: "show",
    dpptemplates: "show",
    dppregistry: "show",
    blockchainconfigs: "show",
    systemconfig: "show",
    farmmgmt: "show",
  },

  // ===============================================================
  // SUPER ADMIN
  // ===============================================================
  superadmin: {
    users: "show",
    suppliers: "show",
    batches: "show",
    material: "show",
    epcis: "show",
    dpptemplates: "show",
    dppregistry: "show",
    blockchainconfigs: "show",
    systemconfig: "show",
    farmmgmt: "show",
  },
};
