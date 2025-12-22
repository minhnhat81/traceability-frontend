import React, { useMemo } from "react";
import { Card, Row, Col, Tag, Typography, Space, Divider } from "antd";
import { DppResponse, EventItem } from "../types/dpp";
import DppSection from "../components/dpp/DppSection";

const { Title, Text } = Typography;

const safeDate = (v?: string | null) => (v ? new Date(v).toLocaleString() : "-");

function shortHash(v?: string | null) {
  if (!v) return "-";
  const s = String(v);
  return s.length > 18 ? `${s.slice(0, 10)}…${s.slice(-8)}` : s;
}

function summarizeEvents(events: EventItem[]) {
  // Tóm tắt đơn giản theo owner_role (nếu có)
  const tiers = { FARM: 0, SUPPLIER: 0, MANUFACTURER: 0, BRAND: 0, OTHER: 0 };

  events.forEach((e: any) => {
    const role = String(e.owner_role || e.event_owner_role || e.batch_owner_role || "").toUpperCase();
    if (role.includes("FARM")) tiers.FARM++;
    else if (role.includes("SUPPLIER")) tiers.SUPPLIER++;
    else if (role.includes("MANUFACTURER")) tiers.MANUFACTURER++;
    else if (role.includes("BRAND")) tiers.BRAND++;
    else tiers.OTHER++;
  });

  return tiers;
}

export default function DppLandingPage({
  data,
  allEvents,
}: {
  data: DppResponse;
  allEvents: EventItem[];
}) {
  const productName = data.batch.product?.name || "Product";
  const brand = data.batch.product?.brand || "-";
  const gtin = data.batch.product?.gtin || "-";
  const country = data.batch.country || "-";
  const mfgDate = safeDate(data.batch.mfg_date);
  const quantity =
    data.batch.quantity != null ? `${data.batch.quantity} ${data.batch.unit || ""}` : "-";

  const tiers = useMemo(() => summarizeEvents(allEvents), [allEvents]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 12 }}>
      {/* HERO */}
      <Card style={{ borderRadius: 14 }}>
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>
            {productName}
          </Title>
          <Text type="secondary">Brand: {brand}</Text>

          <Space wrap>
            <Tag color={data.blockchain.status === "CONFIRMED" ? "green" : "orange"}>
              {data.blockchain.status === "CONFIRMED" ? "Verified" : "Unverified"}
            </Tag>
            <Tag>Made in {country}</Tag>
          </Space>

          <Divider style={{ margin: "12px 0" }} />

          {/* QUICK FACTS: responsive */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Text type="secondary">Product Code</Text>
              <div style={{ fontWeight: 600 }}>{data.batch.product_code || "-"}</div>
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

      {/* SUPPLY CHAIN SUMMARY */}
      <Card title="Supply chain overview" style={{ borderRadius: 14 }}>
        <Row gutter={[10, 10]}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <div style={{ fontSize: 18 }}>🌱</div>
              <div style={{ fontWeight: 700 }}>Farm</div>
              <Text type="secondary">{tiers.FARM} events</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <div style={{ fontSize: 18 }}>🚚</div>
              <div style={{ fontWeight: 700 }}>Supplier</div>
              <Text type="secondary">{tiers.SUPPLIER} events</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <div style={{ fontSize: 18 }}>🏭</div>
              <div style={{ fontWeight: 700 }}>Manufacturer</div>
              <Text type="secondary">{tiers.MANUFACTURER} events</Text>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <div style={{ fontSize: 18 }}>🏷️</div>
              <div style={{ fontWeight: 700 }}>Brand</div>
              <Text type="secondary">{tiers.BRAND} events</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      <div style={{ height: 12 }} />

      {/* DROPDOWN: Blockchain */}
      <DppSection
        title={
          <Space>
            <span>⛓ Blockchain proof</span>
            <Tag color={data.blockchain.status === "CONFIRMED" ? "green" : "orange"}>
              {data.blockchain.status || "UNKNOWN"}
            </Tag>
          </Space>
        }
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <div>
            <Text type="secondary">Network</Text>
            <div style={{ fontWeight: 600 }}>{data.blockchain.network || "-"}</div>
          </div>

          <div>
            <Text type="secondary">Tx hash</Text>
            <div style={{ fontWeight: 600, wordBreak: "break-all" }}>
              {data.blockchain.tx_hash ? (
                <a
                  href={`https://amoy.polygonscan.com/tx/${data.blockchain.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {data.blockchain.tx_hash}
                </a>
              ) : (
                "-"
              )}
            </div>
          </div>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Text type="secondary">Block</Text>
              <div style={{ fontWeight: 600 }}>{data.blockchain.block_number ?? "-"}</div>
            </Col>
            <Col xs={24} sm={12}>
              <Text type="secondary">Anchored at</Text>
              <div style={{ fontWeight: 600 }}>{safeDate(data.blockchain.created_at)}</div>
            </Col>
          </Row>

          <div>
            <Text type="secondary">Root hash</Text>
            <div style={{ fontWeight: 600 }}>{shortHash(data.blockchain.root_hash)}</div>
          </div>
        </Space>
      </DppSection>

      {/* DROPDOWN: Technical */}
      <DppSection
        title={<span>🛠 Technical details (for auditors)</span>}
        defaultOpen={false}
      >
        <Text type="secondary">
          This section contains EPCIS tables, Merkle tree, DID and full traceability.
          If you are a customer, you usually don’t need this.
        </Text>
      </DppSection>
    </div>
  );
}
