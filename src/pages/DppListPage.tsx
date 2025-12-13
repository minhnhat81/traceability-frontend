// src/pages/DppListPage.tsx
import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Input } from "antd";
import QRCode from "react-qr-code";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function DppListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const navigate = useNavigate(); // ✅ Thêm navigation

  const safe = (v?: any) => (v ?? "").toString().toLowerCase();

  // 🔍 Search logic mới
  const filtered = items.filter((i) => {
    const q = search.toLowerCase();

    return (
      safe(i.ref).includes(q) ||
      safe(i.batch_code).includes(q) ||
      safe(i.product_name).includes(q) ||
      safe(i.product_brand).includes(q)
    );
  });

  async function loadData() {
    const res = await api().get("/api/public/dpp-list");
    setItems(res.data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    {
      title: "Batch Code",
      dataIndex: "ref",
      render: (v: string) => <b>{v}</b>,
    },
    {
      title: "Product",
      dataIndex: "product_name",
      render: (v: string) => v || "-",
    },
    {
      title: "Root Hash",
      dataIndex: "root_hash",
      render: (v: string) => (v ? `${v.slice(0, 8)}…${v.slice(-8)}` : "-"),
    },
    {
      title: "Tx Hash",
      dataIndex: "tx_hash",
      render: (v: string) =>
        v ? (
          <a
            href={`https://amoy.polygonscan.com/tx/${v}`}
            target="_blank"
            rel="noreferrer"
          >
            {v.slice(0, 8)}…{v.slice(-8)}
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Block",
      dataIndex: "block_number",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v: string) => (
        <Tag color={v === "CONFIRMED" ? "green" : "red"}>{v}</Tag>
      ),
    },
    {
      title: "IPFS",
      dataIndex: "ipfs_cid",
      render: (v: string) =>
        v ? (
          <a href={`https://ipfs.io/ipfs/${v}`} target="_blank">
            {v.slice(0, 8)}…{v.slice(-8)}
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "QR",
      dataIndex: "ref",
      width: 120,
      render: (ref: string) => (
        <QRCode value={`${window.location.origin}/dpp/${ref}`} size={60} />
      ),
    },
    {
      title: "Actions",
      width: 150,
      render: (row: any) => (
        <Button type="primary" onClick={() => navigate(`/dpp/${row.ref}`)}>
          View DPP
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card
        title="Digital Product Passport – Blockchain Registry"
        extra={
          <Input.Search
            placeholder="Search batch..."
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
          />
        }
      >
        <Table
          rowKey="ref"
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
