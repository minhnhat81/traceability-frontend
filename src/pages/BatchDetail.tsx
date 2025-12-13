import { useEffect, useMemo, useState } from "react";
import { Card, Select, Space, Tag, Typography, message, Tabs } from "antd";
import { api } from "../api";
import DocumentsTab from "./tabs/DocumentsTab";
import EPCISTab from "./tabs/EPCISTab";
import BlockchainTab from "./tabs/BlockchainTab";

const { Title, Text } = Typography;

type Batch = {
  id: number;
  code: string;
  product_code: string;
  mfg_date?: string;
  country?: string;
  status?: "OPEN" | "CLOSED";
};

export default function BatchDetail() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selected, setSelected] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const current = useMemo(
    () => batches.find((b) => b.code === selected),
    [batches, selected]
  );

  async function loadBatches() {
    setLoading(true);
    try {
      const r = await api().get("/api/batches");
      const items: Batch[] =
        r.data?.items?.map((x: any) => ({
          id: x.id,
          code: x.code,
          product_code: x.product || x.product_code,
          mfg_date: x.mfg_date,
          country: x.country,
          status: x.status || "OPEN",
        })) || [];
      setBatches(items);
    } catch (e: any) {
      message.error(e?.response?.data?.detail || "Load batches failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  return (
    <Space direction="vertical" size={12} style={{ display: "block" }}>
      <Card>
        <Title level={4} style={{ marginBottom: 8 }}>
          Batch Workspace
        </Title>

        <Space size="large" wrap>
          <div>
            <Text strong>Batch (Lot): </Text>
            <Select
              loading={loading}
              style={{ minWidth: 320 }}
              placeholder="Select batch"
              value={selected}
              onChange={setSelected}
              options={batches.map((b) => ({
                value: b.code,
                label: `${b.code} — ${b.product_code ?? "undefined"}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </div>

          {current && (
            <Space size="small">
              <Tag color="blue">{current.product_code}</Tag>
              <Tag>{current.country || "N/A"}</Tag>
              <Tag color={current.status === "OPEN" ? "green" : "red"}>
                {current.status || "OPEN"}
              </Tag>
              {current.mfg_date && (
                <Tag>
                  Mfg: <Text code>{current.mfg_date}</Text>
                </Tag>
              )}
            </Space>
          )}
        </Space>
      </Card>

      {/* ✅ Chỉ hiển thị Tabs sau khi đã chọn batch */}
      {selected && (
        <Card>
          <Tabs
            defaultActiveKey="docs"
            items={[
              {
                key: "docs",
                label: "Documents & VC",
                children: <DocumentsTab batchCode={selected} />,
              },
              {
                key: "epcis",
                label: "EPCIS Capture",
                children: (
                  <EPCISTab
                    batchCode={selected}
                    batchStatus={current?.status || "OPEN"}
                  />
                ),
              },
              {
                key: "chain",
                label: "Blockchain Proof",
                children: <BlockchainTab batchCode={selected} />,
              },
            ]}
          />
        </Card>
      )}
    </Space>
  );
}
