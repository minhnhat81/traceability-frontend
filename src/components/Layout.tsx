// src/components/Layout.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
const { Header, Sider, Content } = Layout;

// ===== HẠ TẦNG ROUTE =====
type Item = Required<MenuProps>['items'][number];

type Node = {
  key: string;         // duy nhất
  label: string;       // hiển thị
  path?: string;       // hash path (/#/xxx)
  children?: Node[];   // nhóm con
};

// ánh xạ đường dẫn (ưu tiên trỏ vào page bạn đã có)
const MENU_TREE: Node[] = [
  { key: 'home', label: 'Trang chủ', path: '/' },

  {
    key: 'portal-admin',
    label: '[1] Cổng quản trị (Admin Portal)',
    children: [
      { key: 'admin-iam',      label: 'Quản lý tài khoản & phân quyền',      path: '/#/roles' },          // RoleManager
      { key: 'admin-users',    label: 'Người dùng (Users/RBAC)',              path: '/#/users' },          // Users
      { key: 'admin-standards',label: 'Cấu hình tiêu chuẩn & thị trường',     path: '/#/admin' },          // AdminPortal (placeholder)
      { key: 'admin-suppliers',label: 'Danh sách nhà cung cấp',               path: '/#/supplier' },       // Supplier
      { key: 'admin-supply-map',label:'Giám sát chuỗi cung ứng (Supply Map)', path: '/#/map' },            // Map
      { key: 'admin-ledger',   label: 'Nhật ký blockchain (Ledger Viewer)',   path: '/#/polygon' },        // PolygonConsole ~ ledger
      { key: 'admin-reports',  label: 'Báo cáo & Dashboard',                  path: '/#/admin-dashboard' } // AdminDashboard
    ],
  },

  {
    key: 'portal-supplier',
    label: '[2] Cổng nhà cung cấp (Supplier Portal)',
    children: [
      { key: 'sup-profile',    label: 'Hồ sơ nhà máy (Factory Profile)',      path: '/#/supplier' },
      { key: 'sup-process',    label: 'Đăng ký công đoạn (Spin/Weave/Dye/Sew)', path: '/#/supplier' },     // tạm trỏ Supplier
      { key: 'sup-epcis',      label: 'Ghi nhận sự kiện EPCIS',               path: '/#/events' },
      { key: 'sup-upload',     label: 'Tải lên chứng từ (CO/Invoice/GRS/GOTS)', path: '/#/documents' },
      { key: 'sup-vc',         label: 'Ký số & phát hành chứng nhận (VC)',    path: '/#/vc-verify' },
      { key: 'sup-compliance', label: 'Kiểm tra tuân thủ (FTA/UFLPA/DPP)',    path: '/#/customs' },        // Customs Portal gần nghĩa
    ],
  },

  {
    key: 'portal-brand',
    label: '[3] Cổng thương hiệu / nhà nhập khẩu (Brand Portal)',
    children: [
      { key: 'brand-overview', label: 'Tổng quan chuỗi cung ứng theo sản phẩm', path: '/#/brand' },        // Brand
      { key: 'brand-fta',      label: 'Kiểm tra hồ sơ xuất xứ (FTA)',           path: '/#/customs' },      // gần nghĩa
      { key: 'brand-uflpa',    label: 'Kiểm tra hồ sơ lao động & bông (UFLPA)', path: '/#/blockchain-settings' }, // tạm
      { key: 'brand-batch',    label: 'Truy xuất theo lô hàng (Batch Viewer)',  path: '/#/batches' },
      { key: 'brand-export',   label: 'Sinh bộ hồ sơ hải quan (Export Pack)',   path: '/#/customs' },      // tạm
      { key: 'brand-risk',     label: 'Dashboard rủi ro chuỗi cung ứng',        path: '/#/brand' },        // tạm
    ],
  },

  {
    key: 'portal-consumer',
    label: '[4] Cổng công khai (Consumer Portal / DPP)',
    children: [
      { key: 'dpp-scan',       label: 'Trang truy xuất qua QR (Scan QR)',      path: '/#/consumer' },      // Consumer
      { key: 'dpp-product',    label: 'Thông tin sản phẩm / chỉ số bền vững',  path: '/#/brand' },         // tạm
      { key: 'dpp-map',        label: 'Lộ trình chuỗi cung ứng (Map view)',    path: '/#/map' },
      { key: 'dpp-cert',       label: 'Chứng nhận & kiểm định (GRS/GOTS/UFLPA)', path: '/#/vc-verify' },
      { key: 'dpp-repair',     label: 'Hướng dẫn tái chế / sửa chữa',          path: '/#/consumer' },      // tạm
      { key: 'dpp-proof',      label: 'Chứng thực blockchain (Proof)',         path: '/#/observer' },      // Observer
    ],
  },

  {
    key: 'portal-backend',
    label: '[5] API & Hệ thống nền (Backend Services)',
    children: [
      { key: 'api-epcis',      label: 'API EPCIS 2.0 Capture / Query',         path: '/#/epcis-capture' },
      { key: 'api-chain',      label: 'Blockchain Layer (Smart Contract + Registry)', path: '/#/polygon' },
      { key: 'api-vc',         label: 'Verifiable Credential Service (W3C DID/VC)',   path: '/#/vc-verify' },
      { key: 'api-storage',    label: 'Storage (Off-chain/IPFS/Cloud)',        path: '/#/documents' },
      { key: 'api-rules',      label: 'Rule Engine (FTA + UFLPA + DPP)',       path: '/#/configs' },
      { key: 'api-integration',label: 'Integration (ERP/WMS/MES/Customs)',     path: '/#/observer' },
    ],
  },

  // nhóm lối tắt quen thuộc từ menu cũ (đặt cuối)
  {
    key: 'shortcuts',
    label: '— Lối tắt quen thuộc —',
    children: [
      { key: 'sc-polysubs',    label: 'Polygon Subs',          path: '/#/polysubs' },
      { key: 'sc-settings',    label: 'Blockchain Settings',   path: '/#/settings' },
      { key: 'sc-audit',       label: 'Audit Viewer',          path: '/#/audit' },
      { key: 'sc-customers',   label: 'Customers',             path: '/#/customers' },
      { key: 'sc-dppdesigner', label: 'DPP Designer',          path: '/#/dpp-designer' },
      { key: 'sc-vcverify',    label: 'VC Verify',             path: '/#/vc-verify' },
      { key: 'sc-dashboard',   label: 'Dashboard (Legacy)',    path: '/' },
    ],
  },
];

// build Antd Menu items
function buildItems(nodes: Node[]): Item[] {
  return nodes.map((n) => {
    if (n.children?.length) {
      return {
        key: n.key,
        label: n.label,
        children: buildItems(n.children),
        type: 'group' as const,
      };
    }
    return {
      key: n.key,
      label: <a href={n.path || '#'}>{n.label}</a>,
    };
  });
}

function allLeaves(nodes: Node[]): Node[] {
  return nodes.flatMap((n) => (n.children ? allLeaves(n.children) : [n]));
}
function parentMap(nodes: Node[], map = new Map<string, string | null>(), parent: string | null = null) {
  nodes.forEach(n => {
    map.set(n.key, parent);
    if (n.children) parentMap(n.children, map, n.key);
  });
  return map;
}
function keyByPath(nodes: Node[]) {
  const m = new Map<string, string>();
  allLeaves(nodes).forEach(n => { if (n.path) m.set(n.path, n.key); });
  return m;
}

// lấy key đang chọn từ hash
function useSelection(nodes: Node[]) {
  const mapPathToKey = useMemo(() => keyByPath(nodes), [nodes]);
  const pmap = useMemo(() => parentMap(nodes), [nodes]);

  const getKeyFromHash = () => {
    const h = window.location.hash || '';
    const path = h ? `/${h}` : '/';
    // ví dụ hash = #/map  => path = /#/map
    // ưu tiên khớp chính xác path
    let k = mapPathToKey.get(path);
    if (!k && path === '/') k = 'home';
    return k || 'home';
  };
  const [selected, setSelected] = useState<string>(getKeyFromHash());
  const [open, setOpen] = useState<string[]>(
    (() => {
      const list: string[] = [];
      let p = pmap.get(getKeyFromHash());
      while (p) { list.push(p); p = pmap.get(p) || null; }
      return list;
    })()
  );

  useEffect(() => {
    const onHash = () => {
      const k = getKeyFromHash();
      setSelected(k);
      const opened: string[] = [];
      let p = pmap.get(k);
      while (p) { opened.push(p); p = pmap.get(p) || null; }
      setOpen(opened);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [pmap]);

  return { selected, open, setOpen };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = useMemo(() => buildItems(MENU_TREE), []);
  const { selected, open, setOpen } = useSelection(MENU_TREE);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ color: '#fff', textAlign: 'center', padding: 12 }}>Traceability</div>
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={[selected]}
          openKeys={open}
          onOpenChange={(keys) => setOpen(keys as string[])}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
          <b>Traceability Unified</b>
          <span style={{ color: '#999' }}>— Multi-Portal Navigation</span>
        </Header>
        <Content style={{ margin: 16 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
