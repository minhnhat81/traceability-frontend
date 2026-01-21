import React, { useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Space,
  Divider,
  Collapse,
  Table,
  Button,
  message,
} from "antd";
import { DppResponse, EventItem, DocumentItem } from "../types/dpp";
import EPCISGraph from "../components/EPCISGraph";
import MerkleViewer from "../components/MerkleViewer";
import DIDViewer from "../components/DIDViewer";
import ConsumerEventTimeline from "../components/dpp/ConsumerEventTimeline";
import { exportAndDownloadDppPdf } from "../i18n/exportDppPdf";

const { Title, Text } = Typography;
const { Panel } = Collapse;

/* ======================
   Helpers
========================= */
const safeDate = (v?: string | null) => (v ? new Date(v).toLocaleString() : "-");

function shortHash(v?: string | null) {
  if (!v) return "-";
  const s = String(v);
  return s.length > 18 ? `${s.slice(0, 10)}…${s.slice(-8)}` : s;
}

/* ======================
   Supply chain summary
========================= */

/**
 * ✅ FIX: Đừng ưu tiên batch_owner_role vì thường là "role hiện tại của batch"
 * và sẽ khiến mọi event đều bị đếm về FARM.
 *
 * Ưu tiên:
 *  - role theo event: owner_role / event_owner_role / owner / event_owner ...
 *  - rồi mới fallback batch_owner_role
 */
function summarizeEvents(events: EventItem[]) {
  const tiers = {
    FARM: 0,
    SUPPLIER: 0,
    MANUFACTURER: 0,
    BRAND: 0,
    OTHER: 0,
  };

  const pickRole = (e: any) => {
    const candidates = [
      e.owner,
      e.owner_role,
      e.event_owner_role,
      e.eventOwnerRole,
      e.event_owner,
      e.eventOwner,
      e.batch_owner_role, // fallback cuối
    ];

    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) {
        return c.trim().toUpperCase();
      }
    }
    return "";
  };

  events.forEach((e: any) => {
    const role = pickRole(e);

    if (role.includes("FARM")) tiers.FARM++;
    else if (role.includes("SUPPLIER")) tiers.SUPPLIER++;
    else if (role.includes("MANUFACTURER")) tiers.MANUFACTURER++;
    else if (role.includes("BRAND")) tiers.BRAND++;
    else tiers.OTHER++;
  });

  return tiers;
}


  const classify = (role: string) => {
    // ✅ ưu tiên match chính xác / bắt đầu bằng
    // (tránh includes gây false-positive kiểu "FARMER" cũng match FARM)
    const r = role;

    if (r === "FARM" || r.startsWith("FARM ")) return "FARM";
    if (r === "SUPPLIER" || r.startsWith("SUPPLIER ")) return "SUPPLIER";
    if (r === "MANUFACTURER" || r.startsWith("MANUFACTURER ")) return "MANUFACTURER";
    if (r === "BRAND" || r.startsWith("BRAND ")) return "BRAND";

    // fallback mềm nếu data có format lạ
    if (r.includes("MANUFACTURER")) return "MANUFACTURER";
    if (r.includes("SUPPLIER")) return "SUPPLIER";
    if (r.includes("BRAND")) return "BRAND";
    if (r.includes("FARM")) return "FARM";

    return "OTHER";
  };

  events.forEach((e: any) => {
    const role = pickRole(e);
    const bucket = classify(role);
    (tiers as any)[bucket] = ((tiers as any)[bucket] || 0) + 1;
  });

  return tiers;
}

/* ======================
   Component
========================= */
export default function DppLandingPage({
  data,
  allEvents,
}: {
  data: DppResponse;
  allEvents: EventItem[];
}) {
  // ✅ MUST be inside component
  const [msgApi, contextHolder] = message.useMessage();

  async function onExportPdf() {
    try {
      msgApi.loading({ content: "Generating EU DPP PDF…", key: "pdf" });

      await exportAndDownloadDppPdf(data, allEvents, {
        fileName: `DPP_${data.batch.batch_code}.pdf`,
      });

      msgApi.success({ content: "PDF exported!", key: "pdf" });
    } catch (e) {
      console.error(e);
      msgApi.error({ content: "Export failed", key: "pdf" });
    }
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const productName = data.batch.product?.name || "Product";
  const brand = data.batch.product?.brand || "-";
  const gtin = data.batch.product?.gtin || "-";
  const country = data.batch.country || "-";
  const mfgDate = safeDate(data.batch.mfg_date);
  const quantity =
    data.batch.quantity != null
      ? `${data.batch.quantity} ${data.batch.unit || ""}`
      : "-";

  console.log("🔥🔥🔥 DppLandingPage RENDERED 🔥🔥🔥");

  const tiers = useMemo(() => summarizeEvents(allEvents), [allEvents]);

  /* ======================
     Documents columns
  ========================= */
  const docsColumns = [
    {
      title: "File",
      dataIndex: "file_name",
      key: "file_name",
    },
    {
      title: "Hash",
      dataIndex: "file_hash",
      key: "file_hash",
      render: (v: string) =>
        v ? (
          <Text code>
            {v.slice(0, 8)}…{v.slice(-8)}
          </Text>
        ) : (
          "-"
        ),
    },
    {
      title: "Status",
      dataIndex: "vc_status",
      key: "vc_status",
      render: (v: string) =>
        v ? (
          <Tag color={v === "verified" ? "green" : "orange"}>{v}</Tag>
        ) : (
          "-"
        ),
    },
  ];

  /* ======================
     Render
  ========================= */
  return (
    <>
      {/* ✅ MUST render this or message() won’t show */}
      {contextHolder}

      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: isMobile ? 12 : 24,
          border: "5px solid red", // 👈 giữ nguyên theo code bạn
          background: "#fffbe6", // 👈 giữ nguyên theo code bạn
        }}
      >
        {/* ================= HERO ================= */}
        <Card style={{ borderRadius: 14 }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>
              {productName}
            </Title>

            <Text type="secondary">Brand: {brand}</Text>

            <Space wrap>
              <Tag
                color={
                  data.blockchain.status === "CONFIRMED" ? "green" : "orange"
                }
              >
                {data.blockchain.status === "CONFIRMED"
                  ? "Verified on blockchain"
                  : "Not verified"}
              </Tag>
              <Tag>Made in {country}</Tag>
            </Space>

            <Divider style={{ margin: "12px 0" }} />

            {/* ✅ EXPORT PDF BUTTON */}
            <Space wrap>
              <Button type="primary" onClick={onExportPdf}>
                📄 Export EU DPP PDF
              </Button>
            </Space>

            {/* ===== QUICK FACTS ===== */}
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Text type="secondary">Product code</Text>
                <div style={{ fontWeight: 600 }}>
                  {data.batch.product_code || "-"}
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <Text type="secondary">GTIN</Text>
                <div style={{ fontWeight: 600 }}>{gtin}</div>
              </Col>

              <Col xs={24} sm={12}>
                <Text type="secondary">Manufactured</Text>
                <div style={{ fontWeight: 600 }}>{mfgDate}</div>
              </Col>

              <Col xs={24} sm={12}>
                <Text type="secondary">Quantity</Text>
                <div style={{ fontWeight: 600 }}>{quantity}</div>
              </Col>

              <Col xs={24}>
                <Text type="secondary">Batch</Text>
                <div style={{ fontWeight: 600, wordBreak: "break-word" }}>
                  {data.batch.batch_code}
                </div>
              </Col>
            </Row>
          </Space>
        </Card>

        <div style={{ height: 12 }} />

        {/* ================= SUPPLY CHAIN ================= */}
        <Card title="Supply chain overview" style={{ borderRadius: 14 }}>
          <Row gutter={[10, 10]}>
            <Col xs={12} sm={6}>
              <Card size="small">
                🌱 <b>Farm</b>
                <div>
                  <Text type="secondary">{tiers.FARM} events</Text>
                </div>
              </Card>
            </Col>

            <Col xs={12} sm={6}>
              <Card size="small">
                🚚 <b>Supplier</b>
                <div>
                  <Text type="secondary">{tiers.SUPPLIER} events</Text>
                </div>
              </Card>
            </Col>

            <Col xs={12} sm={6}>
              <Card size="small">
                🏭 <b>Manufacturer</b>
                <div>
                  <Text type="secondary">{tiers.MANUFACTURER} events</Text>
                </div>
              </Card>
            </Col>

            <Col xs={12} sm={6}>
              <Card size="small">
                🏷️ <b>Brand</b>
                <div>
                  <Text type="secondary">{tiers.BRAND} events</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        <div style={{ height: 12 }} />

        {/* ================= COLLAPSE SECTIONS ================= */}
        <Collapse accordion defaultActiveKey={isMobile ? [] : ["blockchain"]}>
          {/* Blockchain */}
          <Panel
            header={
              <Space>
                ⛓ Blockchain proof
                <Tag
                  color={
                    data.blockchain.status === "CONFIRMED" ? "green" : "orange"
                  }
                >
                  {data.blockchain.status}
                </Tag>
              </Space>
            }
            key="blockchain"
          >
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <div>
                <Text type="secondary">Network</Text>
                <div style={{ fontWeight: 600 }}>
                  {data.blockchain.network || "-"}
                </div>
              </div>

              <div>
                <Text type="secondary">Tx hash</Text>
                <div style={{ fontWeight: 600 }}>
                  {shortHash(data.blockchain.tx_hash)}
                </div>
              </div>

              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Block</Text>
                  <div style={{ fontWeight: 600 }}>
                    {data.blockchain.block_number ?? "-"}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary">Anchored at</Text>
                  <div style={{ fontWeight: 600 }}>
                    {safeDate(data.blockchain.created_at)}
                  </div>
                </Col>
              </Row>

              <div>
                <Text type="secondary">Root hash</Text>
                <div style={{ fontWeight: 600 }}>
                  {shortHash(data.blockchain.root_hash)}
                </div>
              </div>
            </Space>
          </Panel>

          {/* EPCIS Summary */}
          <Panel header={`📦 Product journey (${allEvents.length} events)`} key="journey">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <ConsumerEventTimeline events={allEvents} />
            </Space>
          </Panel>

          {/* EPCIS Graph */}
          <Panel header="📈 Traceability graph" key="graph">
            <EPCISGraph
              events={allEvents.map((e) => ({
                event_id: e.event_id || "",
                biz_step: e.biz_step || "",
                event_time: e.event_time || "",
              }))}
            />
          </Panel>

          {/* Merkle */}
          <Panel header="🌳 Data integrity (Merkle proof)" key="merkle">
            <MerkleViewer
              events={allEvents}
              documents={data.documents}
              rootHash={data.blockchain.root_hash}
            />
          </Panel>

          {/* Documents */}
          <Panel
            header={`📄 Certificates & documents (${data.documents.length})`}
            key="documents"
          >
            <Table<DocumentItem>
              rowKey="id"
              size="small"
              columns={docsColumns}
              dataSource={data.documents}
              pagination={{ pageSize: 5 }}
              scroll={isMobile ? { x: 600 } : undefined}
            />
          </Panel>

          {/* DID */}
          <Panel header="🆔 Digital Identity" key="did">
            <DIDViewer
              initialDid={(data.events?.[0]?.ilmd as any)?.dpp?.digital_identity?.did || null}
            />
          </Panel>
        </Collapse>
      </div>
    </>
  );
}
