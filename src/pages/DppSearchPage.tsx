import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Input,
  Button,
  Space,
  Tabs,
  Descriptions,
  Timeline,
  Tag,
  Table,
  Typography,
  message,
} from "antd";
import { api } from "../api";

const { Text } = Typography;

type BlockchainInfo = {
  network?: string;
  tx_hash?: string;
  block_number?: number;
  root_hash?: string;
  status?: string;
  created_at?: string;
};

type DppResponse = {
  query: string;
  dpp_id: string;
  batch: any;
  blockchain?: BlockchainInfo | null;
  epcis_events: any[];
  documents: any[];
  dpp_json: any;
};

export default function DppSearchPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams.get("query") || "");
  const [data, setData] = useState<DppResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q?: string) => {
    const val = (q ?? query).trim();
    if (!val) return;
    setLoading(true);
    try {
      const r = await api().get("/api/dpp/search", { params: { query: val } });
      setData(r.data);
    } catch (e: any) {
      setData(null);
      message.error(e?.response?.data?.detail || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) doSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blockchain = data?.blockchain;

  const explorerUrl =
    blockchain?.tx_hash && blockchain?.network?.toLowerCase().includes("polygon")
      ? `https://amoy.polygonscan.com/tx/${blockchain.tx_hash}`
      : undefined;

  const events = data?.epcis_events || [];

  const eventColumns = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "Type", dataIndex: "event_type" },
    { title: "Action", dataIndex: "action" },
    { title: "Biz Step", dataIndex: "biz_step" },
    { title: "Disposition", dataIndex: "disposition" },
    { title: "Location", dataIndex: "biz_location" },
    { title: "Time", dataIndex: "event_time" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            style={{ width: 400 }}
            placeholder="Enter Batch / Tx Hash / GTIN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={() => doSearch()}
          />
          <Button type="primary" loading={loading} onClick={() => doSearch()}>
            Search DPP
          </Button>
        </Space>
      </Card>

      {data && (
        <Tabs
          defaultActiveKey="product"
          type="card"
          items={[
            {
              key: "product",
              label: "Product Info",
              children: (
                <Card>
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="DPP ID">
                      {data.dpp_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Batch Code">
                      {data.batch.batch_code}
                    </Descriptions.Item>
                    <Descriptions.Item label="Product Name">
                      {data.batch.product?.name || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Brand">
                      {data.batch.product?.brand || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="GTIN">
                      {data.batch.product?.gtin || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Product Code">
                      {data.batch.product_code}
                    </Descriptions.Item>
                    <Descriptions.Item label="Country of Origin">
                      {data.batch.country || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mfg Date">
                      {data.batch.mfg_date || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quantity">
                      {data.batch.quantity
                        ? `${data.batch.quantity} ${data.batch.unit}`
                        : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Batch Status">
                      <Tag>{data.batch.status}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ),
            },
            {
              key: "supplychain",
              label: "EPCIS Timeline",
              children: (
                <Card>
                  {events.length === 0 ? (
                    <Text type="secondary">No EPCIS events.</Text>
                  ) : (
                    <Timeline mode="left" style={{ marginTop: 16 }}>
                      {events.map((e) => (
                        <Timeline.Item key={e.id}>
                          <div>
                            <b>{e.event_type || "Event"}</b> – {e.action} –{" "}
                            {e.biz_step}
                          </div>
                          <div>
                            Time: {e.event_time || "-"} | Location:{" "}
                            {e.biz_location || e.read_point || "-"}
                          </div>
                          <div>Disposition: {e.disposition || "-"}</div>
                          <div>Doc Bundle: {e.doc_bundle_id || "-"}</div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  )}
                </Card>
              ),
            },
            {
              key: "events",
              label: "EPCIS Events Table",
              children: (
                <Card>
                  <Table
                    size="small"
                    rowKey="id"
                    dataSource={events}
                    columns={eventColumns as any}
                    pagination={{ pageSize: 5 }}
                  />
                </Card>
              ),
            },
            {
              key: "blockchain",
              label: "Blockchain Proof",
              children: (
                <Card>
                  {blockchain ? (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Network">
                        {blockchain.network || "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        {blockchain.status === "CONFIRMED" ? (
                          <Tag color="green">CONFIRMED</Tag>
                        ) : blockchain.status === "FAILED" ? (
                          <Tag color="red">FAILED</Tag>
                        ) : (
                          <Tag>{blockchain.status || "PENDING"}</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tx Hash">
                        {blockchain.tx_hash ? (
                          explorerUrl ? (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {blockchain.tx_hash}
                            </a>
                          ) : (
                            blockchain.tx_hash
                          )
                        ) : (
                          "-"
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Block">
                        {blockchain.block_number ?? "-"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Root Hash">
                        <Text copyable style={{ fontFamily: "monospace" }}>
                          {blockchain.root_hash || blockchain["batch_hash"] || "-"}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Anchored At">
                        {blockchain.created_at || "-"}
                      </Descriptions.Item>
                    </Descriptions>
                  ) : (
                    <Text type="secondary">No blockchain anchor found.</Text>
                  )}
                </Card>
              ),
            },
            {
              key: "docs",
              label: "Documents & VC",
              children: (
                <Card>
                  {data.documents.length === 0 ? (
                    <Text type="secondary">No attached documents.</Text>
                  ) : (
                    <Table
                      size="small"
                      rowKey="id"
                      dataSource={data.documents}
                      columns={[
                        { title: "ID", dataIndex: "id", width: 60 },
                        { title: "File Name", dataIndex: "file_name" },
                        { title: "Bundle", dataIndex: "doc_bundle_id" },
                        {
                          title: "VC Status",
                          dataIndex: "vc_status",
                          render: (v: string) =>
                            v === "verified" ? (
                              <Tag color="green">verified</Tag>
                            ) : v ? (
                              <Tag>{v}</Tag>
                            ) : (
                              "-"
                            ),
                        },
                      ]}
                    />
                  )}
                </Card>
              ),
            },
            {
              key: "json",
              label: "DPP JSON",
              children: (
                <Card>
                  <pre
                    style={{
                      maxHeight: 400,
                      overflow: "auto",
                      background: "#111",
                      color: "#0f0",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    {JSON.stringify(data.dpp_json, null, 2)}
                  </pre>
                </Card>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
