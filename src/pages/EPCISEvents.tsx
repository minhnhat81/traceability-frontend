import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Drawer,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Tabs,
  Progress,
  Divider,
  Collapse,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  LinkOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";

// ❌ Sai: import { api } from "@/api"
// ✅ Đúng:
import { api } from "../api";

// Lấy user để biết role
import { useAuth } from "../store/auth";

import DocumentsTab from "./tabs/DocumentsTab";
import EPCISTab from "./tabs/epcis/EPCISTab";
import BlockchainTab from "./tabs/BlockchainTab";

const { Title, Text } = Typography;
const { Panel } = Collapse;

// ====== QUY ĐỊNH CẤP ĐỘ 4 TẦNG ======
const LEVELS = ["farm", "supplier", "manufacturer", "brand"] as const;
type Level = (typeof LEVELS)[number];

const TITLE_BY_LEVEL: Record<Level, string> = {
  farm: "Farm Batches",
  supplier: "Supplier Batches",
  manufacturer: "Manufacturer Batches",
  brand: "Brand Batches",
};

export default function EPCISEvents() {
  return (
    <div className="space-y-4">
      <Tabs
        defaultActiveKey="farm"
        items={[
          ...LEVELS.map((lv) => ({
            key: lv,
            label: TITLE_BY_LEVEL[lv],
            children: <EPCISTabByLevel level={lv} />,
          })),
          {
            key: "links",
            label: (
              <span>
                <LinkOutlined /> Links
              </span>
            ),
            children: <LinksTab />,
          },
        ]}
      />
    </div>
  );
}

function EPCISTabByLevel({ level }: { level: Level }) {
  const { user } = useAuth();
  const userRole = (user?.role || "").toLowerCase();

  // === 🔥 Logic disable Blockchain Proof ===
  const DISABLE_CHAIN = ["farm", "supplier", "manufacturer", "brand"].includes(
    userRole
  );

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [open, setOpen] = useState(false);
  const [batchMeta, setBatchMeta] = useState<any>(null);

  async function loadBatches() {
    setLoading(true);
    try {
      const r = await api().get("/api/batches/", { params: { level } });
      const items: Batch[] =
        r.data?.items?.map((x: any) => ({
          id: x.id,
          code: x.code,
          product_code: x.product || x.product_code,
          mfg_date: x.mfg_date,
          country: x.country,
          status: x.status || "active",
          quantity: x.quantity,
          remaining_quantity: x.remaining_quantity,
          used_quantity: x.used_quantity,
          unit: x.unit,
        })) || [];
      setBatches(items);
    } catch (e: any) {
      message.error(
        e?.response?.data?.detail || `Failed to load ${level} batches`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, [level]);

  async function loadBatchMeta(batchCode: string) {
    try {
      const res = await api().get("/api/epcis/events", {
        params: { batch_code: batchCode },
      });
      setBatchMeta(res.data.meta);
    } catch (e: any) {
      console.warn("Failed to load batch meta:", e);
      setBatchMeta(null);
    }
  }

  // ======= TABLE COLUMNS =======
  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    { title: "Product", dataIndex: "product_code" },
    { title: "Mfg Date", dataIndex: "mfg_date" },
    { title: "Country", dataIndex: "country" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <Tag color={status === "OPEN" || status === "active" ? "green" : "red"}>
          {status === "OPEN"
            ? "Open"
            : status === "CLOSED"
            ? "Closed"
            : "Active"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Batch) => (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedBatch(record);
            setOpen(true);
            setBatchMeta(null);
            setTimeout(() => loadBatchMeta(record.code), 300);
          }}
        >
          Create EPCIS events
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex justify-between items-center mb-2">
        <Title level={4} style={{ margin: 0 }}>
          {TITLE_BY_LEVEL[level]}
        </Title>
        <Button icon={<ReloadOutlined />} onClick={loadBatches} loading={loading}>
          Refresh
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={batches}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        width="95%"
        open={open}
        destroyOnClose
        onClose={() => {
          setOpen(false);
          setSelectedBatch(null);
        }}
        title={
          selectedBatch ? (
            <Space size="small">
              <Text strong>{selectedBatch.code}</Text>
              <Tag color="blue">{selectedBatch.product_code}</Tag>
              <Tag>{selectedBatch.country || "N/A"}</Tag>
            </Space>
          ) : (
            "Batch Workspace"
          )
        }
      >
        {selectedBatch && (
          <>
            <Divider />

            <Tabs
              defaultActiveKey="epcis"
              destroyInactiveTabPane
              items={[
                {
                  key: "docs",
                  label: "Documents & VC",
                  children: (
                    <DocumentsTab batchCode={selectedBatch.code} />
                  ),
                },
                {
                  key: "epcis",
                  label: "EPCIS Capture",
                  children: (
                    <EPCISTab
                      batchCode={selectedBatch.code}
                      batchStatus={selectedBatch.status || "active"}
                    />
                  ),
                },
                {
                  key: "chain",
                  label: (
                    <span
                      style={{
                        opacity: DISABLE_CHAIN ? 0.4 : 1,
                        cursor: DISABLE_CHAIN ? "not-allowed" : "pointer",
                      }}
                    >
                      Blockchain Proof
                    </span>
                  ),
                  disabled: DISABLE_CHAIN,
                  children: DISABLE_CHAIN ? (
                    <div className="p-6 text-gray-400">
                      🚫 Your role is not allowed to access Blockchain Proof.
                    </div>
                  ) : (
                    <BlockchainTab batchCode={selectedBatch.code} />
                  ),
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </Card>
  );
}

function LinksTab() {
  return (
    <div className="p-6">
      <Card>
        <Title level={5}>
          🔗 Links — View relationships between batches (coming soon)
        </Title>
        <p>Batch relationships will be shown here.</p>
      </Card>
    </div>
  );
}

// ===== TYPES =====
type Batch = {
  id: number;
  code: string;
  product_code: string;
  mfg_date?: string;
  country?: string;
  status?: string;
  quantity?: number;
  used_quantity?: number;
  remaining_quantity?: number;
  unit?: string;
};
