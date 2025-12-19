// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Table,
  Tag,
  Space,
  Spin,
  Alert,
  Collapse,
  Tabs,
} from "antd";
import { api } from "../api";

// AntV Charts (React wrapper)
import { Line, Pie, Column } from "@ant-design/plots";

// Leaflet Map
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix type errors with Leaflet components in TSX
const AnyMapContainer: any = MapContainer as any;
const AnyCircleMarker: any = CircleMarker as any;

const { Title, Text } = Typography;
const { Panel } = Collapse;

type EventItem = {
  id?: number;
  event_id?: string;
  event_type?: string;
  action?: string;
  event_time?: string;
  owner_role?: string;
  event_owner_role?: string;
  role?: string; // normalized role on FE
  batch_code?: string;
  biz_step?: string;
  disposition?: string;
  epc_list?: any[];
  // từ backend full-timeline (normalize_dpp nếu có)
  dpp?: any;
  ilmd?: any;
};

type BatchItem = {
  batch_code: string;
  product_code?: string;
  country?: string;
  dpp_json?: any;
  code?: string;
  batchCode?: string;
  product?: string;
};

type TimelineByRole = {
  farm?: EventItem[];
  supplier?: EventItem[];
  manufacturer?: EventItem[];
  brand?: EventItem[];
  unknown?: EventItem[];
  [k: string]: EventItem[] | undefined;
};

type BatchDetail = {
  loading: boolean;
  events: EventItem[]; // flatten tất cả role
  meta: {
    timeline?: TimelineByRole;
  };
  error?: string | null;
};

const safeDate = (v?: string) => (v ? new Date(v).toLocaleString() : "-");

// convert các kiểu "1", 1, "1 kg CO2" => number an toàn
function toNumberSafe(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const num = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(num) ? num : 0;
}

/**
 * Chuẩn hoá role thành 1 trong 5 nhóm:
 * "farm" | "supplier" | "manufacturer" | "brand" | "unknown"
 * Xử lý luôn case: FARM, Farm, "FARM ", "supplier_level_1", ...
 */
function normalizeRoleKey(
  raw?: string | null
): "farm" | "supplier" | "manufacturer" | "brand" | "unknown" {
  if (!raw) return "unknown";
  const s = raw.toString().trim().toLowerCase();

  if (s.includes("farm")) return "farm";
  if (s.includes("suppl")) return "supplier";
  if (s.includes("manu")) return "manufacturer";
  if (s.includes("brand")) return "brand";

  return "unknown";
}

// Chuẩn hoá lấy DPP từ batch (hỗ trợ 3 trường hợp):
// 1. dpp_json là object có field .dpp  => { dpp: {...} }
// 2. dpp_json là object DPP trực tiếp  => {...}
// 3. dpp_json là STRING JSON           => parse trước rồi áp dụng 1 & 2
function extractDppFromBatch(batch: any): any {
  if (!batch) return {};

  let container: any = batch.dpp_json;
  if (!container) return {};

  if (typeof container === "string") {
    try {
      container = JSON.parse(container);
    } catch {
      return {};
    }
  }

  if (container && typeof container === "object" && container.dpp) {
    return container.dpp;
  }

  return container;
}

// Lấy DPP đầu tiên có trong timeline (ưu tiên farm -> supplier -> manufacturer -> brand -> unknown)
function extractDppFromTimeline(timeline?: TimelineByRole): any {
  if (!timeline) return null;
  const order: Array<keyof TimelineByRole> = [
    "farm",
    "supplier",
    "manufacturer",
    "brand",
    "unknown",
  ];

  for (const r of order) {
    const list = timeline[r] || [];
    for (const ev of list) {
      const anyEv: any = ev;
      if (anyEv?.dpp) return anyEv.dpp;
      if (anyEv?.ilmd?.dpp) return anyEv.ilmd.dpp;
    }
  }
  return null;
}

// Lấy DPP từ danh sách event (ưu tiên dùng cho từng tab role)
function extractDppFromEvents(evList: EventItem[]): any {
  for (const ev of evList) {
    const anyEv: any = ev;
    if (anyEv?.dpp) return anyEv.dpp;
    if (anyEv?.ilmd?.dpp) return anyEv.ilmd.dpp;
  }
  return null;
}

// Suy ra product từ batch_code nếu không có metadata batch
function deriveProductFromBatchCode(code: string): string {
  if (!code) return "";
  const parts = code.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return code;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [eventsAll, setEventsAll] = useState<EventItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [err, setErr] = useState("");

  // Chi tiết EPCIS cho từng batch (lazy load khi mở panel)
  const [batchDetails, setBatchDetails] = useState<Record<string, BatchDetail>>(
    {}
  );

  // Tab đang chọn theo từng batch: all | farm | supplier | manufacturer | brand
  const [roleTabByBatch, setRoleTabByBatch] = useState<Record<string, string>>({
    // [batch_code]: "all" | "farm" | ...
  });

  /* --------------------------------------
      LOAD DATA TỔNG QUAN
  ---------------------------------------*/
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr("");

        const [evRes, btRes] = await Promise.all([
          api().get("/api/epcis/events"),
          api().get("api/batches"),
        ]);

        setEventsAll(evRes.data?.items || []);
        setBatches(btRes.data?.items || []);
      } catch (e) {
        console.error(e);
        setErr("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* --------------------------------------
      KPI SUMMARY (tổng tất cả EPCIS)
  ---------------------------------------*/
  const totalEvents = eventsAll.length;

  const roles = useMemo(() => {
    const g = { farm: 0, supplier: 0, manu: 0, brand: 0 };

    eventsAll.forEach((ev) => {
      const raw = ev.owner_role || ev.event_owner_role || ev.role || "";
      const norm = normalizeRoleKey(raw);

      if (norm === "farm") g.farm++;
      else if (norm === "supplier") g.supplier++;
      else if (norm === "manufacturer") g.manu++;
      else if (norm === "brand") g.brand++;
    });

    return g;
  }, [eventsAll]);

  /* --------------------------------------
      DỮ LIỆU CHO BẢNG BATCH TỔNG QUAN
      (CO2 / Circularity đọc từ DPP batch + events)
      ❗ Quan trọng: union giữa batches từ BE và
      tất cả batch_code xuất hiện trong eventsAll
      → hiển thị cả các batch-tier như
        GARMENT-001-...-SUPPLIER-...-BRAND-...
  ---------------------------------------*/
  const batchRows = useMemo(() => {
    // 1) Map meta batch từ /api/batches
    const metaByCode: Record<string, any> = {};
    batches.forEach((b: any) => {
      const bc = b.batch_code || b.code || b.batchCode;
      if (!bc) return;
      metaByCode[bc] = b;
    });

    // 2) Gom events theo batch_code (bao gồm cả batch-tier)
    const eventsByBatch: Record<string, EventItem[]> = {};
    eventsAll.forEach((ev: any) => {
      const bc =
        ev.batch_code || ev.batchCode || ev.batch_code_full || ev.batch;
      if (!bc) return;
      if (!eventsByBatch[bc]) eventsByBatch[bc] = [];
      eventsByBatch[bc].push(ev);
    });

    // 3) Tập tất cả batch_code = union(metaByCode, eventsByBatch)
    const allCodes = Array.from(
      new Set([...Object.keys(metaByCode), ...Object.keys(eventsByBatch)])
    ).sort();

    // 4) Build rows
    return allCodes.map((bc) => {
      const meta = metaByCode[bc];
      const evs = eventsByBatch[bc] || [];

      // Batch object dùng để extract DPP nếu có
      const baseBatch: any =
        meta ||
        ({
          batch_code: bc,
          code: bc,
          batchCode: bc,
          product_code: deriveProductFromBatchCode(bc),
          country: "VN",
        } as BatchItem);

      // DPP từ batch
      let dpp = extractDppFromBatch(baseBatch) || {};

      // Nếu batch chưa có DPP → fallback từ events
      if (!dpp || Object.keys(dpp || {}).length === 0) {
        const dppFromEvents = extractDppFromEvents(evs);
        if (dppFromEvents) {
          dpp = dppFromEvents;
        }
      }

      const env = (dpp && dpp.environmental_impact) || {};
      const circ = (dpp && dpp.circularity) || {};

      const co2 = toNumberSafe(env.co2 ?? env.co2_kg);
      const water = toNumberSafe(env.water);
      const energy = toNumberSafe(env.energy);

      const circScore =
        toNumberSafe(circ.recycled_content) +
        toNumberSafe(circ.reusability) +
        toNumberSafe(circ.waste_reduction);

      const product =
        baseBatch.product_code ||
        baseBatch.product ||
        deriveProductFromBatchCode(bc);

      const country = baseBatch.country || "VN";

      return {
        key: bc,
        batch_code: bc,
        product,
        co2,
        water,
        energy,
        circScore,
        country,
        _raw: baseBatch,
      };
    });
  }, [batches, eventsAll]);

  const batchColumns = [
    { title: "Batch", dataIndex: "batch_code" },
    { title: "Product", dataIndex: "product" },
    {
      title: "CO₂",
      dataIndex: "co2",
      render: (v: any) => <Tag color="green">{v}</Tag>,
    },
    { title: "Water", dataIndex: "water" },
    { title: "Energy", dataIndex: "energy" },
    {
      title: "Circularity",
      dataIndex: "circScore",
      render: (v: any) => <Tag color="blue">{v}</Tag>,
    },
  ];

  /* --------------------------------------
      CHART CONFIG TỔNG QUAN
  ---------------------------------------*/
  const co2Chart = {
    data: batchRows,
    xField: "batch_code",
    yField: "co2",
    color: "#52c41a",
    smooth: true,
  };

  const circularChart = {
    data: batchRows,
    xField: "batch_code",
    yField: "circScore",
    color: "#1677ff",
  };

  const pieData = [
    { type: "Farm", value: roles.farm },
    { type: "Supplier", value: roles.supplier },
    { type: "Manufacturer", value: roles.manu },
    { type: "Brand", value: roles.brand },
  ];

  const pieConfig = {
    data: pieData,
    angleField: "value",
    colorField: "type",
    radius: 0.9,
  };

  /* --------------------------------------
      MAP (Leaflet)
  ---------------------------------------*/
  const countryMap: Record<string, any> = {
    VN: { lat: 21.03, lng: 105.85 },
    US: { lat: 37.09, lng: -95.71 },
    CN: { lat: 35.86, lng: 104.19 },
    JP: { lat: 36.2, lng: 138.25 },
  };

  const markers = batchRows.map((b) => ({
    ...b,
    pos: countryMap[b.country] || countryMap["VN"],
  }));

  /* --------------------------------------
      EPC FLOW (simple static)
  ---------------------------------------*/
  const flowSteps = ["Farm", "Supplier", "Manufacturer", "Brand"];

  /* --------------------------------------
      LAZY LOAD CHI TIẾT EPCIS THEO BATCH
      (FE gọi /api/epcis/dpp/full-timeline?batch_code=XYZ)
      => lấy đủ event ở mọi tầng, chuẩn hoá role
  ---------------------------------------*/
  async function loadBatchDetail(batchCode: string) {
    if (!batchCode) return;

    const existing = batchDetails[batchCode];
    if (existing && !existing.loading && existing.events.length) return;

    setBatchDetails((prev) => ({
      ...prev,
      [batchCode]: {
        loading: true,
        events: existing?.events || [],
        meta: existing?.meta || {},
        error: null,
      },
    }));

    try {
      const res = await api().get("/api/epcis/dpp/full-timeline", {
        params: { batch_code: batchCode },
      });

      const rawTimeline: Record<string, any[]> = res.data?.timeline || {};

      // Chuẩn hoá lại timeline theo role chuẩn: farm / supplier / manufacturer / brand / unknown
      const normalizedTimeline: TimelineByRole = {
        farm: [],
        supplier: [],
        manufacturer: [],
        brand: [],
        unknown: [],
      };

      const combined: EventItem[] = [];

      Object.entries(rawTimeline).forEach(([rawKey, value]) => {
        const list = Array.isArray(value) ? value : [];
        const normKey = normalizeRoleKey(rawKey);

        list.forEach((ev: any) => {
          const evNormKey = normalizeRoleKey(ev.role || rawKey);
          const displayRole = evNormKey.toUpperCase(); // hiển thị trên UI

          const item: EventItem = {
            ...ev,
            owner_role: displayRole,
            event_owner_role: displayRole,
            role: evNormKey,
          };

          combined.push(item);

          if (!normalizedTimeline[evNormKey]) {
            normalizedTimeline[evNormKey] = [];
          }
          normalizedTimeline[evNormKey]!.push(item);
        });
      });

      setBatchDetails((prev) => ({
        ...prev,
        [batchCode]: {
          loading: false,
          events: combined,
          meta: { timeline: normalizedTimeline },
          error: null,
        },
      }));
    } catch (e: any) {
      console.error(e);
      setBatchDetails((prev) => ({
        ...prev,
        [batchCode]: {
          loading: false,
          events: [],
          meta: prev[batchCode]?.meta || {},
          error: "Failed to load EPCIS events for this batch",
        },
      }));
    }
  }

  function handleCollapseChange(keys: string | string[]) {
    const activeKeys = Array.isArray(keys) ? keys : [keys];
    activeKeys.forEach((k) => {
      if (k) loadBatchDetail(k);
    });
  }

  function handleRoleTabChange(batchCode: string, key: string) {
    setRoleTabByBatch((prev) => ({
      ...prev,
      [batchCode]: key,
    }));
  }

  /* --------------------------------------
      RENDER
  ---------------------------------------*/
  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Reports &amp; Dashboard</Title>

      {err && <Alert type="error" message={err} style={{ marginBottom: 16 }} />}

      {loading ? (
        <Spin />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* KPI SUMMARY */}
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic title="Total EPCIS Events" value={totalEvents} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Farm Events" value={roles.farm} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Supplier Events" value={roles.supplier} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Manufacturer Events" value={roles.manu} />
              </Card>
            </Col>
          </Row>

          {/* EPC FLOW SIMPLE */}
          <Card title="EPC Supply Chain Flow (Simple)">
            <div
              style={{
                display: "flex",
                gap: 40,
                justifyContent: "space-between",
                padding: "20px 40px",
              }}
            >
              {flowSteps.map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      background: "#1677ff",
                      padding: 10,
                      borderRadius: 6,
                      width: 120,
                      color: "#fff",
                    }}
                  >
                    {s}
                  </div>
                  {i < flowSteps.length - 1 && (
                    <div style={{ marginTop: 6 }}>⬇</div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* CHARTS TỔNG QUAN */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="CO₂ by Batch">
                <Line {...co2Chart} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Circularity Score">
                <Column {...circularChart} />
              </Card>
            </Col>
          </Row>

          <Card title="Event Distribution by Role">
            <Pie {...pieConfig} />
          </Card>

          {/* MAP HEATMAP */}
          <Card title="Activity Heatmap (Countries)">
            <AnyMapContainer
              center={[20, 105]}
              zoom={3}
              style={{ height: 350, width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {markers.map((m, idx) => (
                <AnyCircleMarker
                  key={idx}
                  center={[m.pos.lat, m.pos.lng]} // [lat, lng]
                  radius={10}
                  color="red"
                >
                  <LeafletTooltip>
                    {`${m.batch_code} – CO₂: ${m.co2}`}
                  </LeafletTooltip>
                </AnyCircleMarker>
              ))}
            </AnyMapContainer>
          </Card>

          {/* BẢNG BATCH TỔNG QUAN */}
          <Card title="Batch Environmental & Circularity Analysis">
            <Table dataSource={batchRows} columns={batchColumns} />
          </Card>

          {/* DASHBOARD NÂNG CAO: CHI TIẾT TỪNG BATCH */}
          <Card title="Per-Batch EPCIS Details">
            <Collapse accordion onChange={handleCollapseChange}>
              {batchRows.map((row) => {
                const code = row.batch_code;
                const detail = batchDetails[code];
                const evs = detail?.events || [];

                // Nếu có timeline trong meta thì dùng, không thì tự đếm
                const timeline = detail?.meta?.timeline || {};
                const roleCount = {
                  farm: (timeline.farm || []).length,
                  supplier: (timeline.supplier || []).length,
                  manufacturer: (timeline.manufacturer || []).length,
                  brand: (timeline.brand || []).length,
                };

                if (
                  !timeline.farm &&
                  !timeline.supplier &&
                  !timeline.manufacturer &&
                  !timeline.brand &&
                  evs.length
                ) {
                  // fallback: đếm từ list events
                  evs.forEach((ev) => {
                    const norm = normalizeRoleKey(
                      ev.owner_role || ev.event_owner_role || ev.role
                    );
                    if (norm === "farm") roleCount.farm++;
                    else if (norm === "supplier") roleCount.supplier++;
                    else if (norm === "manufacturer") roleCount.manufacturer++;
                    else if (norm === "brand") roleCount.brand++;
                  });
                }

                // ===== ENV / CIRCULARITY CHUNG CHO BATCH (fallback) =====
                const batchDpp = extractDppFromBatch(row._raw) || {};
                let envBatch = batchDpp.environmental_impact || {};
                let circBatch = batchDpp.circularity || {};

                const activeRoleKey = roleTabByBatch[code] || "all";

                // Lọc events theo tab
                const filteredEvents: EventItem[] =
                  activeRoleKey === "all"
                    ? evs
                    : evs.filter((ev) => {
                        const norm = normalizeRoleKey(
                          ev.owner_role || ev.event_owner_role || ev.role
                        );
                        return norm === activeRoleKey;
                      });

                // Đếm role trong phạm vi tab (cho sparkline)
                const roleCountTab = {
                  farm: 0,
                  supplier: 0,
                  manufacturer: 0,
                  brand: 0,
                };
                filteredEvents.forEach((ev) => {
                  const norm = normalizeRoleKey(
                    ev.owner_role || ev.event_owner_role || ev.role
                  );
                  if (norm === "farm") roleCountTab.farm++;
                  else if (norm === "supplier") roleCountTab.supplier++;
                  else if (norm === "manufacturer") roleCountTab.manufacturer++;
                  else if (norm === "brand") roleCountTab.brand++;
                });

                // ===== ENV / CIRCULARITY THEO TAB =====
                // 1. Ưu tiên DPP lấy từ events thuộc tab đó
                let env = envBatch;
                let circ = circBatch;

                const dppFromEvents = extractDppFromEvents(filteredEvents);
                if (dppFromEvents) {
                  const env2 = dppFromEvents.environmental_impact || {};
                  const circ2 = dppFromEvents.circularity || {};
                  env = { ...env, ...env2 };
                  circ = { ...circ, ...circ2 };
                } else if (!env.co2 && !env.water && !env.energy && timeline) {
                  // 2. Fallback: DPP từ timeline toàn batch nếu batchDpp rỗng
                  const tlDpp = extractDppFromTimeline(timeline as TimelineByRole);
                  if (tlDpp) {
                    const env2 = tlDpp.environmental_impact || {};
                    const circ2 = tlDpp.circularity || {};
                    env = { ...env, ...env2 };
                    circ = { ...circ, ...circ2 };
                  }
                }

                const co2 = toNumberSafe(env.co2 ?? env.co2_kg);
                const water = toNumberSafe(env.water);
                const energy = toNumberSafe(env.energy);
                const circScore =
                  toNumberSafe(circ.recycled_content) +
                  toNumberSafe(circ.reusability) +
                  toNumberSafe(circ.waste_reduction);

                const eventColumns = [
                  {
                    title: "Time",
                    dataIndex: "event_time",
                    render: (v: string) => safeDate(v),
                  },
                  {
                    title: "Type",
                    // /dpp/full-timeline không có event_type, dùng action làm type
                    dataIndex: "action",
                    render: (v: string) => v || "ObjectEvent",
                  },
                  {
                    title: "Role",
                    render: (_: any, ev: EventItem) =>
                      ev.owner_role ||
                      ev.event_owner_role ||
                      ev.role ||
                      "-",
                  },
                  {
                    title: "Biz Step",
                    dataIndex: "biz_step",
                  },
                  {
                    title: "Disposition",
                    dataIndex: "disposition",
                  },
                  {
                    title: "EPC Count",
                    render: (_: any, ev: EventItem) =>
                      Array.isArray(ev.epc_list) ? ev.epc_list.length : 0,
                  },
                ];

                const miniChartData = [
                  { role: "Farm", value: roleCountTab.farm },
                  { role: "Supplier", value: roleCountTab.supplier },
                  { role: "Manufacturer", value: roleCountTab.manufacturer },
                  { role: "Brand", value: roleCountTab.brand },
                ];

                const miniColumnConfig = {
                  data: miniChartData,
                  xField: "role",
                  yField: "value",
                  columnWidthRatio: 0.6,
                  height: 80,
                  autoFit: true,
                  xAxis: {
                    label: null as any,
                    line: null as any,
                    tickLine: null as any,
                  },
                  yAxis: {
                    label: null as any,
                    grid: null as any,
                  },
                  tooltip: false,
                };

                return (
                  <Panel
                    header={`Batch ${code} – ${row.product || ""}`}
                    key={code}
                  >
                    {!detail || detail.loading ? (
                      <Spin />
                    ) : (
                      <Space
                        direction="vertical"
                        size="large"
                        style={{ width: "100%" }}
                      >
                        {detail.error && (
                          <Alert type="error" message={detail.error} />
                        )}

                        {/* KPI mini cho batch (tổng, không phụ thuộc tab) */}
                        <Row gutter={16}>
                          <Col span={4}>
                            <Statistic
                              title="Total Events"
                              value={evs.length}
                            />
                          </Col>
                          <Col span={4}>
                            <Statistic title="Farm" value={roleCount.farm} />
                          </Col>
                          <Col span={4}>
                            <Statistic
                              title="Supplier"
                              value={roleCount.supplier}
                            />
                          </Col>
                          <Col span={4}>
                            <Statistic
                              title="Manufacturer"
                              value={roleCount.manufacturer}
                            />
                          </Col>
                          <Col span={4}>
                            <Statistic title="Brand" value={roleCount.brand} />
                          </Col>
                        </Row>

                        {/* TABS THEO TẦNG */}
                        <Tabs
                          activeKey={activeRoleKey}
                          onChange={(k) => handleRoleTabChange(code, k)}
                          items={[
                            { key: "all", label: "All Roles" },
                            { key: "farm", label: "Farm" },
                            { key: "supplier", label: "Supplier" },
                            { key: "manufacturer", label: "Manufacturer" },
                            { key: "brand", label: "Brand" },
                          ]}
                        />

                        {/* Nội dung theo tab (sparkline + env/circ + bảng) */}
                        <Row gutter={16}>
                          <Col span={12}>
                            <Card
                              size="small"
                              title="Events by Role (sparkline)"
                            >
                              <Column {...miniColumnConfig} />
                              <Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                              >
                                Farm / Supplier / Manufacturer / Brand
                              </Text>
                            </Card>
                          </Col>
                          <Col span={12}>
                            <Card
                              size="small"
                              title="Environmental / Circularity"
                            >
                              <Row>
                                <Col span={6}>
                                  <Statistic title="CO₂" value={co2} />
                                </Col>
                                <Col span={6}>
                                  <Statistic title="Water" value={water} />
                                </Col>
                                <Col span={6}>
                                  <Statistic title="Energy" value={energy} />
                                </Col>
                                <Col span={6}>
                                  <Statistic
                                    title="Circularity Score"
                                    value={circScore}
                                  />
                                </Col>
                              </Row>
                            </Card>
                          </Col>
                        </Row>

                        {/* Bảng chi tiết EPCIS (lọc theo tab) */}
                        <Table
                          rowKey={(r: any, idx) => r.event_id || `ev-${idx}`}
                          dataSource={filteredEvents}
                          columns={eventColumns}
                          pagination={{ pageSize: 5 }}
                        />
                      </Space>
                    )}
                  </Panel>
                );
              })}
            </Collapse>

            {!batchRows.length && (
              <Text type="secondary">No batches found for this tenant.</Text>
            )}
          </Card>
        </Space>
      )}
    </div>
  );
}
