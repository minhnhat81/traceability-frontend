// src/pages/DppPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  Table,
} from "antd";
import QRCode from "react-qr-code";
import { useParams } from "react-router-dom";
import { api } from "../api";

// Components
import EPCISGraph, {
  EPCISEvent as EPCISGraphEvent,
} from "../components/EPCISGraph";
import MerkleViewer from "../components/MerkleViewer";
import DIDViewer from "../components/DIDViewer";

// Types
import { DppResponse, EventItem, DocumentItem } from "../types/dpp";

const { Title, Text } = Typography;

/* ======================
   Helpers
========================= */
const safeDate = (v?: string | null) =>
  v ? new Date(v).toLocaleString() : "-";

/**
 * Tier / tầng supply chain
 */
type TierKey = "FARM" | "SUPPLIER" | "MANUFACTURER" | "BRAND" | "UNKNOWN";

type TierGroup = {
  key: TierKey;
  label: string;
  color: string;
  events: EventItem[];
};

// Chuẩn hoá event từ nhiều nguồn khác nhau
const normalizeEvent = (raw: any): EventItem => {
  const ev: any = { ...(raw || {}) };

  // Chuẩn hoá field tên khác nhau về 1 format chung
  if (!ev.event_id && ev.id) ev.event_id = ev.id;
  if (!ev.event_type && ev.type) ev.event_type = ev.type;
  if (!ev.biz_step && ev.bizStep) ev.biz_step = ev.bizStep;
  if (!ev.event_time && ev.eventTime) ev.event_time = ev.eventTime;
  if (!ev.read_point && ev.readPoint) ev.read_point = ev.readPoint;
  if (!ev.biz_location && ev.bizLocation) ev.biz_location = ev.bizLocation;
  if (!ev.epc_list && ev.epcList) ev.epc_list = ev.epcList;

  // Map lại owner_role nếu backend trả event_owner_role / batch_owner_role
  if (!ev.owner_role && ev.event_owner_role) {
    ev.owner_role = ev.event_owner_role;
  }
  if (!ev.owner_role && ev.batch_owner_role) {
    ev.owner_role = ev.batch_owner_role;
  }

  // Chuẩn hoá DPP: có thể nằm ở nhiều chỗ khác nhau
  const directDpp = ev?.ilmd?.dpp || ev.dpp || ev?.extensions?.dpp || null;
  if (directDpp) {
    ev.ilmd = { ...(ev.ilmd || {}), dpp: directDpp };
  }

  return ev as EventItem;
};

/**
 * Lấy DPP gắn với 1 EPCIS event
 */
const getEventDpp = (ev: EventItem): any =>
  ((ev.ilmd as any)?.dpp ||
    (ev as any).dpp ||
    (ev.extensions as any)?.dpp ||
    null) || null;

/**
 * Xác định tầng (tier) của 1 EPCIS event
 * Ưu tiên theo owner_role từ backend.
 */
const getEventTier = (ev: EventItem): TierKey => {
  const rawRole =
    (ev as any).owner_role ||
    (ev as any).event_owner_role ||
    (ev as any).batch_owner_role ||
    "";

  const role = String(rawRole || "").toUpperCase();

  if (role.includes("FARM")) return "FARM";
  if (role.includes("SUPPLIER")) return "SUPPLIER";
  if (role.includes("MANUFACTURER")) return "MANUFACTURER";
  if (role.includes("BRAND")) return "BRAND";

  // fallback: đoán theo biz_step (nếu không có owner_role)
  const biz = String(ev.biz_step || "").toLowerCase();
  if (
    biz.includes("growing") ||
    biz.includes("planting") ||
    biz.includes("harvesting")
  ) {
    return "FARM";
  }
  if (
    biz.includes("receiving") ||
    biz.includes("shipping") ||
    biz.includes("packing")
  ) {
    return "SUPPLIER";
  }

  return "UNKNOWN";
};

/**
 * Gom events theo tầng: Farm / Supplier / Manufacturer / Brand
 */
const buildTierGroups = (events: EventItem[]): TierGroup[] => {
  const map = new Map<TierKey, TierGroup>();

  const ensureTier = (key: TierKey): TierGroup => {
    if (map.has(key)) return map.get(key)!;
    const labelMap: Record<TierKey, string> = {
      FARM: "Farm",
      SUPPLIER: "Supplier",
      MANUFACTURER: "Manufacturer",
      BRAND: "Brand",
      UNKNOWN: "Khác / Không xác định",
    };
    const colorMap: Record<TierKey, string> = {
      FARM: "green",
      SUPPLIER: "blue",
      MANUFACTURER: "orange",
      BRAND: "purple",
      UNKNOWN: "default",
    };
    const group: TierGroup = {
      key,
      label: labelMap[key],
      color: colorMap[key],
      events: [],
    };
    map.set(key, group);
    return group;
  };

  events.forEach((ev) => {
    const tier = getEventTier(ev);
    const group = ensureTier(tier);
    group.events.push(ev);
  });

  // Giữ thứ tự Farm → Supplier → Manufacturer → Brand → Unknown
  const order: TierKey[] = [
    "FARM",
    "SUPPLIER",
    "MANUFACTURER",
    "BRAND",
    "UNKNOWN",
  ];

  return order
    .map((k) => map.get(k))
    .filter((g): g is TierGroup => !!g && g.events.length > 0);
};

/**
 * Render DPP trong 1 cell của bảng (cùng dòng với EPCIS)
 * Tóm tắt theo 16 nhóm field của DPP EU.
 */
const renderDppCell = (ev: EventItem) => {
  const dpp: any = getEventDpp(ev);
  if (!dpp) return <Text type="secondary">-</Text>;

  const lines: React.ReactNode[] = [];

  // 1. Product description
  if (dpp.product_description) {
    lines.push(
      <div key="product">
        <b>Product:</b>{" "}
        {[dpp.product_description.name,
          dpp.product_description.model,
          dpp.product_description.gtin,
        ]
          .filter(Boolean)
          .join(" — ")}
      </div>
    );
  }

  // 2. Composition
  if (dpp.composition) {
    const mats =
      dpp.composition.materials?.join(", ") ||
      dpp.composition.materials_block
        ?.map((m: any) => `${m.name} ${m.percentage ?? ""}`.trim())
        .join(", ");
    if (mats) {
      lines.push(
        <div key="composition">
          <b>Composition:</b> {mats}
        </div>
      );
    }
  }

  // 3. Use phase
  if (dpp.use_phase?.instructions) {
    lines.push(
      <div key="use">
        <b>Use:</b> {dpp.use_phase.instructions}
      </div>
    );
  }

  // 4. Brand
  if (dpp.brand_info) {
    lines.push(
      <div key="brand">
        <b>Brand:</b> {dpp.brand_info.brand}{" "}
        {dpp.brand_info.contact && `(${dpp.brand_info.contact})`}
      </div>
    );
  }

  // 5. Social impact
  if (dpp.social_impact) {
    const certText = Array.isArray(dpp.social_impact.certifications)
      ? dpp.social_impact.certifications
          .map(
            (c: any) =>
              `${c.name || ""}${c.number ? ` (${c.number})` : ""}`.trim()
          )
          .filter(Boolean)
          .join(", ")
      : "";
    lines.push(
      <div key="social">
        <b>Social:</b> {dpp.social_impact.factory}
        {certText && ` — ${certText}`}
      </div>
    );
  }

  // 6. Animal welfare
  if (dpp.animal_welfare) {
    lines.push(
      <div key="animal">
        <b>Animal:</b> {dpp.animal_welfare.notes}{" "}
        {dpp.animal_welfare.standard && `(${dpp.animal_welfare.standard})`}
      </div>
    );
  }

  // 7. End of life
  if (dpp.end_of_life?.recycle_guideline) {
    lines.push(
      <div key="eol">
        <b>End-of-life:</b> {dpp.end_of_life.recycle_guideline}
      </div>
    );
  }

  // 8. Health & safety
  if (dpp.health_safety) {
    lines.push(
      <div key="health">
        <b>Health & Safety:</b> {dpp.health_safety.policy}{" "}
        {dpp.health_safety.certified_by &&
          `— ${dpp.health_safety.certified_by}`}
      </div>
    );
  }

  // 9. Digital identity
  if (dpp.digital_identity) {
    lines.push(
      <div key="did">
        <b>DID:</b> {dpp.digital_identity.did || "-"}{" "}
        {dpp.digital_identity.ipfs_cid &&
          `| CID: ${dpp.digital_identity.ipfs_cid}`}
      </div>
    );
  }

  // 10. Environmental impact
  if (dpp.environmental_impact) {
    const e = dpp.environmental_impact;
    lines.push(
      <div key="env">
        <b>Environment:</b>{" "}
        {["co2", "water", "energy"]
          .map((k) => (e[k] != null ? `${k.toUpperCase()}: ${e[k]}` : ""))
          .filter(Boolean)
          .join(" | ")}
      </div>
    );
  }

  // 11. Circularity
  if (dpp.circularity) {
    const c = dpp.circularity;
    lines.push(
      <div key="circularity">
        <b>Circularity:</b>{" "}
        {["recycled_content", "reusability", "waste_reduction"]
          .map((k) => (c[k] != null ? `${k.replace("_", " ")}: ${c[k]}` : ""))
          .filter(Boolean)
          .join(" | ")}
      </div>
    );
  }

  // 12. Quantity info
  if (dpp.quantity_info) {
    const q = dpp.quantity_info;
    lines.push(
      <div key="quantity">
        <b>Quantity:</b>{" "}
        {["batch", "weight"]
          .map((k) => (q[k] != null ? `${k}: ${q[k]}` : ""))
          .filter(Boolean)
          .join(" | ")}
      </div>
    );
  }

  // 13. Cost info
  if (dpp.cost_info) {
    const c = dpp.cost_info;
    lines.push(
      <div key="cost">
        <b>Cost:</b>{" "}
        {["labor_cost", "transport_cost"]
          .map((k) => (c[k] != null ? `${k}: ${c[k]}` : ""))
          .filter(Boolean)
          .join(" | ")}
      </div>
    );
  }

  // 14. Transport
  if (dpp.transport) {
    const t = dpp.transport;
    lines.push(
      <div key="transport">
        <b>Transport:</b>{" "}
        {["distance", "co2_per_km"]
          .map((k) => (t[k] != null ? `${k}: ${t[k]}` : ""))
          .filter(Boolean)
          .join(" | ")}
      </div>
    );
  }

  // 15. Documentation
  if (dpp.documentation) {
    const d = dpp.documentation;
    lines.push(
      <div key="docs">
        <b>Documentation:</b>{" "}
        {["file", "issued_by"]
          .map((k) => (d[k] != null ? `${k}: ${d[k]}` : ""))
          .filter(Boolean)
          .join(" | ")}
      </div>
    );
  }

  // 16. Supply chain
  if (dpp.supply_chain) {
    const s = dpp.supply_chain;
    lines.push(
      <div key="supply">
        <b>Supply chain:</b>{" "}
        {["tier", "supplier", "updated_at"]
          .map((k) => (s[k] != null ? `${k}: ${s[k]}` : ""))
          .filter(Boolean)
          .join(" | ")}
      </div>
    );
  }

  return (
    <div
      style={{
        fontSize: 11,
        lineHeight: 1.45,
        maxWidth: 380,
        wordBreak: "break-word",
        whiteSpace: "normal",
      }}
    >
      {lines}
    </div>
  );
};

export default function DppPage() {
  const [data, setData] = useState<DppResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Lấy ref từ URL param /dpp/:refId hoặc query ?ref
  const params = useParams<{ refId?: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const refFromQuery = searchParams.get("ref") || "";
  const ref = params.refId || refFromQuery || "";

  /* ======================
      Load data from API
  ========================= */
  useEffect(() => {
    async function load() {
      if (!ref) return;
      setLoading(true);
      setErr(null);

      try {
        const res = await api().get(
          `/api/public/dpp/${encodeURIComponent(ref)}`,
          { params: { mode: "full" } }
        );
        setData(res.data);
      } catch (e: any) {
        console.error(e);
        setErr(e?.response?.data?.detail || e?.message || "Failed to load DPP");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ref]);

  /* ======================
      GỘP TẤT CẢ EPCIS EVENTS
      - Mỗi event_id là 1 event duy nhất
      - Không merge fuzzy theo time/bizstep
  ========================= */
  const allEvents: EventItem[] = useMemo(() => {
    if (!data) return [];

    const rawList: EventItem[] = [];

    const pushSource = (src?: any[]) => {
      if (!Array.isArray(src)) return;
      src.forEach((r) => rawList.push(normalizeEvent(r)));
    };

    // (1) events chính từ API
    pushSource((data as any).events);

    // (2) events từ dpp_json.events (nếu backend có trả)
    pushSource((data as any)?.dpp_json?.events);

    // (3) events từ traceability trong dpp_json (ghi chuỗi EPCIS đầy đủ nếu có)
    const traceabilityRoot =
      (data as any)?.dpp_json?.dpp?.traceability ||
      (data as any)?.dpp_json?.traceability ||
      (data as any)?.traceability;
    const traceabilityEvents = traceabilityRoot?.events;
    pushSource(traceabilityEvents);

    // (4) events trong ilmd.dpp.traceability của từng event (nếu có)
    const ilmdTrace: any[] = [];
    (data as any)?.events?.forEach((ev: any) => {
      const t = ev?.ilmd?.dpp?.traceability?.events;
      if (Array.isArray(t)) ilmdTrace.push(...t);
    });
    pushSource(ilmdTrace);

    // ----- GỘP THEO event_id (chỉ theo ID, không fuzzy) -----
    const byId = new Map<string, EventItem>();
    const result: EventItem[] = [];

    rawList.forEach((ev) => {
      const id = ev.event_id || "";
      if (!id) {
        // không có event_id thì push riêng, không merge
        result.push(ev);
        return;
      }

      const existing = byId.get(id);
      if (!existing) {
        byId.set(id, ev);
        result.push(ev);
      } else {
        const merged: EventItem = {
          ...existing,
          ...ev,
          ilmd: { ...(existing.ilmd || {}), ...(ev.ilmd || {}) },
          extensions: {
            ...(existing.extensions || {}),
            ...(ev.extensions || {}),
          },
          epc_list: Array.from(
            new Set([...(existing.epc_list || []), ...(ev.epc_list || [])])
          ),
        };
        byId.set(id, merged);
        const idx = result.findIndex((x) => x.event_id === id);
        if (idx >= 0) result[idx] = merged;
      }
    });

    // Nếu traceability.events có field dpp riêng cho từng event, gắn vào ilmd.dpp
    if (Array.isArray(traceabilityEvents)) {
      traceabilityEvents.forEach((te: any) => {
        const id = te.event_id || te.id;
        if (!id || !te.dpp) return;
        const ev = byId.get(id);
        if (!ev) return;
        const ilmd: any = ev.ilmd || {};
        ilmd.dpp = { ...(ilmd.dpp || {}), ...(te.dpp || {}) };
        ev.ilmd = ilmd;
      });
    }

    // Sort theo thời gian
    result.sort(
      (a, b) =>
        new Date(a.event_time || 0).getTime() -
        new Date(b.event_time || 0).getTime()
    );

    return result;
  }, [data]);

  /* ======================
      NHÓM THEO TẦNG (Farm → Supplier → Manufacturer → Brand)
  ========================= */
  const tierGroups: TierGroup[] = useMemo(
    () => buildTierGroups(allEvents),
    [allEvents]
  );

  /* ======================
      EPCIS Table Columns (GS1 EPCIS 2.0 style)
  ========================= */
  const baseEventsColumns = [
    {
      title: "Time",
      dataIndex: "event_time",
      key: "event_time",
      width: 170,
      render: (v: string) => safeDate(v),
    },
    {
      title: "Event ID",
      dataIndex: "event_id",
      key: "event_id",
      width: 260,
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "event_type",
      key: "event_type",
      width: 110,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 90,
    },
    {
      title: "Biz Step",
      dataIndex: "biz_step",
      key: "biz_step",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Disposition",
      dataIndex: "disposition",
      key: "disposition",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Read Point",
      dataIndex: "read_point",
      key: "read_point",
      width: 240,
      ellipsis: true,
    },
    {
      title: "Biz Location",
      dataIndex: "biz_location",
      key: "biz_location",
      width: 220,
      ellipsis: true,
    },
    {
      title: "EPC List",
      dataIndex: "epc_list",
      key: "epc_list",
      width: 260,
      render: (list: string[] | undefined) =>
        list && list.length ? (
          <div
            style={{
              fontSize: 11,
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {list.map((epc, idx) => (
              <div key={idx}>{epc}</div>
            ))}
          </div>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "DPP",
      key: "dpp",
      width: 420,
      render: (_: any, ev: EventItem) => renderDppCell(ev),
    },
  ];

  const docsColumns = [
    { title: "File", dataIndex: "file_name", key: "file_name" },
    {
      title: "File Hash",
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
    { title: "Bundle", dataIndex: "doc_bundle_id", key: "doc_bundle_id" },
    {
      title: "VC Status",
      dataIndex: "vc_status",
      key: "vc_status",
      render: (v: string) =>
        v ? <Tag color={v === "verified" ? "green" : "orange"}>{v}</Tag> : "-",
    },
  ];

  /* ======================
      Events cho EPCIS Graph
  ========================= */
  const graphEvents: EPCISGraphEvent[] = useMemo(
    () =>
      allEvents.map((ev) => ({
        event_id: ev.event_id || "",
        biz_step: ev.biz_step || "",
        event_time: ev.event_time || "",
      })),
    [allEvents]
  );

  /* ======================
      No ref error
  ========================= */
  if (!ref) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="Missing DPP reference"
          description="URL must contain /dpp/:refId or ?ref=..."
          showIcon
        />
      </div>
    );
  }

  /* ======================
      Main UI Render
  ========================= */
  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>
              Digital Product Passport
            </Title>
            <Text type="secondary">
              Batch: <Text code>{ref}</Text>
            </Text>
          </Col>
          <Col>
            <Space direction="vertical" align="center">
              <QRCode value={window.location.href} size={84} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Scan QR to view DPP
              </Text>
            </Space>
          </Col>
        </Row>

        {err && <Alert type="error" message={err} />}

        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        )}

        {!loading && data && (
          <>
            {/* PRODUCT + BATCH */}
            <Card title="Product & Batch Information">
              <Descriptions bordered size="small" column={2}>
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
                  {data.batch.product_code || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Batch Code" span={2}>
                  <Text code>{data.batch.batch_code}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Mfg Date">
                  {safeDate(data.batch.mfg_date)}
                </Descriptions.Item>
                <Descriptions.Item label="Country">
                  {data.batch.country || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Quantity">
                  {data.batch.quantity != null
                    ? `${data.batch.quantity} ${data.batch.unit || ""}`
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* BLOCKCHAIN */}
            <Card title="Blockchain Proof" style={{ marginTop: 16 }}>
              <Space direction="vertical" size="small">
                <Space>
                  <Text>Network:</Text>
                  <Tag>{data.blockchain.network || "-"}</Tag>
                </Space>
                <Space>
                  <Text>Status:</Text>
                  <Tag
                    color={
                      data.blockchain.status === "CONFIRMED"
                        ? "green"
                        : data.blockchain.status === "PENDING"
                        ? "blue"
                        : "red"
                    }
                  >
                    {data.blockchain.status || "UNKNOWN"}
                  </Tag>
                </Space>
                <Space align="start">
                  <Text>Tx Hash:</Text>
                  {data.blockchain.tx_hash ? (
                    <a
                      href={`https://amoy.polygonscan.com/tx/${data.blockchain.tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ wordBreak: "break-all" }}
                    >
                      {data.blockchain.tx_hash}
                    </a>
                  ) : (
                    "-"
                  )}
                </Space>
                <Space>
                  <Text>Block:</Text>
                  <Text>{data.blockchain.block_number ?? "-"}</Text>
                </Space>
                <Space align="start">
                  <Text>Root Hash:</Text>
                  {data.blockchain.root_hash ? (
                    <Text code style={{ fontSize: 12 }}>
                      {data.blockchain.root_hash}
                    </Text>
                  ) : (
                    "-"
                  )}
                </Space>
                <Space align="start">
                  <Text>IPFS:</Text>
                  {data.blockchain.ipfs_cid ? (
                    <a
                      href={
                        data.blockchain.ipfs_gateway ||
                        `https://ipfs.io/ipfs/${data.blockchain.ipfs_cid}`
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {data.blockchain.ipfs_cid}
                    </a>
                  ) : (
                    <Text type="secondary">Not uploaded</Text>
                  )}
                </Space>
                <Space>
                  <Text>Anchored At:</Text>
                  <Text>{safeDate(data.blockchain.created_at)}</Text>
                </Space>
              </Space>
            </Card>

            {/* EPCIS Timeline + Table — MỖI TẦNG 1 BOX, EPCIS + DPP CÙNG DÒNG */}
            <Card
              title="EPCIS Event Timeline"
              style={{ marginTop: 16 }}
              extra={
                <Text type="secondary">
                  Total: {allEvents.length} events
                </Text>
              }
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                {tierGroups.map((tier) => (
                  <Card
                    key={tier.key}
                    size="small"
                    style={{ width: "100%" }}
                    bodyStyle={{ paddingTop: 8 }}
                    title={
                      <Space>
                        <Tag color={tier.color}>{tier.label}</Tag>
                        <Text type="secondary">
                          {tier.events.length} event
                          {tier.events.length > 1 ? "s" : ""}
                        </Text>
                      </Space>
                    }
                  >
                    <Table<EventItem>
                      rowKey={(r, index) => r.event_id || `ev-${index}`}
                      size="small"
                      columns={baseEventsColumns as any}
                      dataSource={tier.events}
                      pagination={{ pageSize: 5 }}
                      scroll={{ x: 1600 }}
                    />
                  </Card>
                ))}

                {!tierGroups.length && (
                  <Text type="secondary">
                    No EPCIS events found for this batch.
                  </Text>
                )}
              </Space>
            </Card>

            {/* EPCIS Graph */}
            <EPCISGraph events={graphEvents} />

            {/* MERKLE TREE */}
            <MerkleViewer
              events={allEvents}
              documents={data.documents}
              rootHash={data.blockchain.root_hash}
            />

            {/* DOCUMENTS */}
            <Card title="Documents & Credentials" style={{ marginTop: 16 }}>
              <Table<DocumentItem>
                rowKey="id"
                size="small"
                columns={docsColumns as any}
                dataSource={data.documents}
                pagination={{ pageSize: 5 }}
              />
            </Card>

            {/* DID VIEW */}
            <DIDViewer
              initialDid={
                (data.events?.[0]?.ilmd as any)?.dpp?.digital_identity?.did ||
                null
              }
            />
          </>
        )}
      </Space>
    </div>
  );
}
