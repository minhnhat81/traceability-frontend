import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Space,
  message,
  Table,
  Steps,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Divider,
  Collapse,
} from "antd";
import { api } from "../../api";

const { Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

type Proof = {
  batch_code: string;
  tx_hash?: string;
  block_number?: number;
  network?: string;
  published_at?: string;
  status?: "NONE" | "PENDING" | "CONFIRMED" | "FAILED";
  root_hash?: string;
};

type Event = {
  id: number;
  event_id?: string;
  event_type?: string;
  action?: string;
  product_code?: string;
  biz_step?: string;
  disposition?: string;
  doc_bundle_id?: string;
  event_time?: string;
};

export default function BlockchainTab({ batchCode }: { batchCode?: string }) {
  const [proof, setProof] = useState<Proof | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Modal config
  const [showCfg, setShowCfg] = useState(false);
  const [cfgLoading, setCfgLoading] = useState(false);
  const [form] = Form.useForm();

  function log(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  }

  // =========================
  // Load blockchain proof
  // =========================
  async function load() {
    if (!batchCode) return;
    setLoading(true);

    try {
      log(`🔍 Fetching blockchain proof for batch ${batchCode}...`);

      const r = await api().get("/api/blockchain/proof", {
        params: { batch_code: batchCode },
      });

      const p = r.data;

      if (!p || !p.batch_code) {
        setProof({ batch_code: batchCode, status: "NONE" });
        log("⚠️ No blockchain proof found");
        return;
      }

      // Map đúng với response backend /api/blockchain/proof
      setProof({
        batch_code: p.batch_code,                 // chuỗi batch
        tx_hash: p.tx_hash || undefined,          // hash tx
        block_number: p.block_number ?? undefined,
        network: p.network || "-",
        status: (p.status as any) || "PENDING",
        root_hash: p.root_hash || undefined,      // merkle root
        published_at: p.published_at || undefined,
      });

      log("✅ Blockchain proof loaded successfully.");
    } catch (e: any) {
      setProof({ batch_code: batchCode, status: "NONE" });
      log("⚠️ No blockchain proof found");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // Load EPCIS events
  // =========================
  async function loadEvents() {
    if (!batchCode) return;
    try {
      log("📦 Loading EPCIS events...");
      const r = await api().get("/api/epcis/events", {
        params: { batch_code: batchCode },
      });
      const data = r.data;
      let items: any[] = [];
      if (Array.isArray(data?.items)) items = data.items;
      else if (Array.isArray(data)) items = data;
      else if (Array.isArray(data?.data)) items = data.data;

      const normalized = items.map((e) => ({
        ...e,
        event_id: e.event_id || e.eventId || "-",
        biz_step: e.bizStep || e.biz_step || "-",
        doc_bundle_id: e.doc_bundle_id || e.docBundleId || "-",
      }));

      setEvents(normalized);
      log(`✅ Loaded ${normalized.length} EPCIS events.`);
    } catch {
      setEvents([]);
      log("❌ Failed to load EPCIS events.");
    }
  }

  // gọi khi batchCode thay đổi
  useEffect(() => {
    load();
    loadEvents();
  }, [batchCode]);

  // =========================
  // Open config modal
  // =========================
  async function openConfig() {
    setCfgLoading(true);
    try {
      const r = await api().get("/api/epcis/publish-config");
      const { polygon, fabric } = r.data || {};
      form.setFieldsValue({
        polygon_chain_name: polygon?.chain_name ?? "Polygon",
        polygon_rpc_url: polygon?.rpc_url ?? "https://rpc-amoy.polygon.technology",
        polygon_chain_id: polygon?.chain_id ?? 80002,
        polygon_private_key: polygon?.private_key ?? "",
        polygon_contract_address: polygon?.contract_address ?? "",
        polygon_gas_limit: polygon?.gas_limit ?? 8_000_000,
        polygon_max_fee_gwei: polygon?.max_fee_gwei ?? 120,
        polygon_priority_fee_gwei: polygon?.priority_fee_gwei ?? 40,

        fabric_chain_name: fabric?.chain_name ?? "Fabric",
        fabric_gateway_url: fabric?.gateway_url ?? "grpc://localhost:7051",
        fabric_channel: fabric?.channel ?? "mychannel",
        fabric_chaincode: fabric?.chaincode ?? "proof_cc",
        fabric_endorsement_policy:
          fabric?.endorsement_policy ?? "AND('Org1.member')",
      });
      setShowCfg(true);
    } catch (e: any) {
      message.error(e?.message || "Load config failed");
    } finally {
      setCfgLoading(false);
    }
  }

  // =========================
  // Confirm publish (override config)
  // =========================
  async function confirmPublish() {
    if (!batchCode) return;
    const v = await form.validateFields();
    const polygon_override = {
      chain_name: v.polygon_chain_name,
      rpc_url: v.polygon_rpc_url,
      chain_id: Number(v.polygon_chain_id),
      private_key: v.polygon_private_key,
      contract_address: v.polygon_contract_address,
      gas_limit: Number(v.polygon_gas_limit),
      max_fee_gwei: Number(v.polygon_max_fee_gwei),
      priority_fee_gwei: Number(v.polygon_priority_fee_gwei),
    };

    setPublishing(true);
    setShowCfg(false);
    log(`🚀 Publishing batch ${batchCode} with custom config...`);

    try {
      const r = await api().post("/api/epcis/publish-to-blockchain", {
        batch_code: batchCode,
        polygon_override,
      });
      const data = r.data;
      if (data?.ok) {
        message.success("✅ Published to Polygon successfully!");
        log(`✅ Tx Hash: ${data.tx_hash || "null"}`);
        log(`🌐 Network: ${data.network}`);
        log(`🧩 Root Hash: ${data.root_hash}`);
      } else {
        message.error("Publish failed");
        log("❌ Publish failed");
      }
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || "Publish failed";
      message.error(msg);
      log(`❌ Publish failed: ${msg}`);
    } finally {
      setPublishing(false);
    }
  }

  // =========================
  // Verify proof off-chain
  // =========================
  async function verify() {
    if (!batchCode) return;
    setVerifying(true);
    log(`🔎 Verifying proof for ${batchCode}...`);
    try {
      const r = await api().post("/api/blockchain/verify", {
        batch_code: batchCode,
      });
      message.success("Proof verified");
      log(`✅ Verified status: ${r.data?.status || "CONFIRMED"}`);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || "Verify failed";
      message.error(msg);
      log(`❌ Verify failed: ${msg}`);
    } finally {
      setVerifying(false);
    }
  }

  // =========================
  // Check on-chain status
  // =========================
  async function checkOnChain() {
    if (!batchCode) return;
    setChecking(true);
    log(`🌐 Checking on-chain status for ${batchCode}...`);
    try {
      const r = await api().post("/api/blockchain/verify", {
        batch_code: batchCode,
      });
      const status = r.data?.status;
      if (status === "CONFIRMED") {
        message.success("✅ Confirmed on-chain");
        log("✅ Transaction confirmed on blockchain.");
      } else if (status === "PENDING") {
        message.warning("⚠️ Transaction pending confirmation...");
        log("⚠️ Transaction still pending.");
      } else {
        message.error("❌ Transaction failed or not found.");
        log("❌ Transaction failed or not found.");
      }
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || "On-chain check failed";
      message.error(msg);
      log(`❌ On-chain check failed: ${msg}`);
    } finally {
      setChecking(false);
    }
  }

  const currentStep =
    proof?.status === "CONFIRMED"
      ? 3
      : proof?.status === "PENDING"
      ? 2
      : Array.isArray(events) && events.length > 0
      ? 1
      : 0;

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Event ID", dataIndex: "event_id", key: "event_id" },
    { title: "Type", dataIndex: "event_type", key: "event_type" },
    { title: "Action", dataIndex: "action", key: "action" },
    { title: "Product", dataIndex: "product_code", key: "product_code" },
    { title: "Biz Step", dataIndex: "biz_step", key: "biz_step" },
    { title: "Disposition", dataIndex: "disposition", key: "disposition" },
    { title: "Doc Bundle ID", dataIndex: "doc_bundle_id", key: "doc_bundle_id" },
    { title: "Event Time", dataIndex: "event_time", key: "event_time" },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Card size="small" style={{ background: "#fafafa" }}>
        <Steps size="small" current={currentStep} responsive>
          <Step title="Docs & VC" description="Verified credentials" />
          <Step
            title="EPCIS Events"
            description={
              Array.isArray(events) && events.length
                ? `${events.length} events`
                : "No data"
            }
          />
          <Step
            title="Blockchain Published"
            description={proof?.status || "NONE"}
          />
          <Step
            title="On-chain Verified"
            description={proof?.status === "CONFIRMED" ? "Confirmed" : "-"}
          />
        </Steps>
      </Card>

      <Space>
        <Button
          type="primary"
          disabled={!batchCode}
          loading={cfgLoading || publishing}
          onClick={openConfig}
        >
          Publish to Blockchain
        </Button>
        <Button disabled={!batchCode} loading={verifying} onClick={verify}>
          Verify Proof
        </Button>
        <Button
          disabled={!proof?.tx_hash}
          loading={checking}
          onClick={checkOnChain}
        >
          🔍 Check On-chain Status
        </Button>
      </Space>

      <Card loading={loading} title="Blockchain Proof" bordered>
        {proof ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Batch">
              {proof.batch_code}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {proof.status === "CONFIRMED" ? (
                <Tag color="green">CONFIRMED ✅</Tag>
              ) : proof.status === "FAILED" ? (
                <Tag color="red">FAILED ❌</Tag>
              ) : proof.status === "PENDING" ? (
                <Tag color="blue">PENDING</Tag>
              ) : (
                <Tag>{proof.status || "NONE"}</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Network">
              {proof.network || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Tx Hash">
              {proof.tx_hash ? (
                <a
                  href={`https://amoy.polygonscan.com/tx/${proof.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {proof.tx_hash}
                </a>
              ) : (
                "-"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Block">
              {proof.block_number ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Root Hash">
              <Text copyable style={{ fontFamily: "monospace" }}>
                {proof.root_hash || "-"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Published At">
              {proof.published_at || "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          "No data"
        )}
      </Card>

      <Card title="EPCIS Events" size="small" bordered>
        {!Array.isArray(events) || events.length === 0 ? (
          <Text type="secondary">No EPCIS events available for this batch.</Text>
        ) : (
          <Table
            size="small"
            columns={columns as any}
            dataSource={Array.isArray(events) ? events : []}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        )}
      </Card>

      <Card
        size="small"
        title="Transaction Log"
        style={{ background: "#111", color: "#0f0" }}
      >
        <pre
          style={{
            color: "#0f0",
            fontSize: 12,
            margin: 0,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {logs.length ? logs.join("\n") : "No logs yet..."}
        </pre>
      </Card>

      {/* Modal Config */}
      <Modal
        title="Publish Configuration"
        open={showCfg}
        onCancel={() => setShowCfg(false)}
        onOk={confirmPublish}
        okText="Publish"
        confirmLoading={publishing}
        width={800}
      >
        <Form layout="vertical" form={form}>
          <Collapse defaultActiveKey={["polygon", "fabric"]}>
            <Panel header="Polygon (Amoy / Mainnet)" key="polygon">
              <Form.Item label="Chain Name" name="polygon_chain_name">
                <Input />
              </Form.Item>
              <Form.Item
                label="RPC URL"
                name="polygon_rpc_url"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Chain ID"
                name="polygon_chain_id"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="Private Key"
                name="polygon_private_key"
                rules={[{ required: true }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label="Contract Address"
                name="polygon_contract_address"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Divider />
              <Form.Item
                label="Gas Limit"
                name="polygon_gas_limit"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="Max Fee (Gwei)"
                name="polygon_max_fee_gwei"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="Priority Fee (Gwei)"
                name="polygon_priority_fee_gwei"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Panel>

            <Panel header="Fabric (placeholder)" key="fabric">
              <Form.Item label="Chain Name" name="fabric_chain_name">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Gateway URL" name="fabric_gateway_url">
                <Input />
              </Form.Item>
              <Form.Item label="Channel" name="fabric_channel">
                <Input />
              </Form.Item>
              <Form.Item label="Chaincode" name="fabric_chaincode">
                <Input />
              </Form.Item>
              <Form.Item
                label="Endorsement Policy"
                name="fabric_endorsement_policy"
              >
                <Input />
              </Form.Item>
            </Panel>
          </Collapse>
        </Form>
      </Modal>
    </Space>
  );
}
