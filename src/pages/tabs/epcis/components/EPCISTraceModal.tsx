import { useEffect, useState, useRef } from "react";
import {
  Modal,
  Spin,
  Row,
  Col,
  Tree,
  Typography,
  message,
  Table,
  Card,
} from "antd";
import * as G6 from "@antv/g6";
import { api } from "@/api";

const { Title, Text } = Typography;

interface BatchTraceModalProps {
  open: boolean;
  batchId?: number | null;
  onClose: () => void;
}

interface EPCISEvent {
  id: number;
  event_type: string;
  biz_step: string;
  event_time: string;
  product_code: string;
  quantity: number;
  unit: string;
  biz_location?: string;
}

const convertNode = (node: any) => ({
  key: node.id,
  title: `${node.code} (${node.owner_role}) — ${node.status}`,
  children:
    node.children?.map(convertNode) ||
    node.parents?.map(convertNode) ||
    [],
});

export default function BatchTraceModal({
  open,
  batchId,
  onClose,
}: BatchTraceModalProps) {
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [events, setEvents] = useState<EPCISEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const graphRef = useRef<HTMLDivElement>(null);
  const g6Instance = useRef<G6.Graph | null>(null); // ✅ FIX 1

  // 📦 Fetch trace chain
  useEffect(() => {
    if (!batchId || !open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api().get(`/api/batches/${batchId}/trace_chain`);
        setTrace(res.data);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải dữ liệu truy xuất nguồn gốc");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [batchId, open]);

  // 📦 Fetch EPCIS events
  const fetchEpcisEvents = async (bId: number) => {
    setLoadingEvents(true);
    try {
      const res = await api().get(`/api/epcis_events`, {
        params: { batch_id: bId },
      });
      setEvents(res.data.items || res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách sự kiện EPCIS");
    } finally {
      setLoadingEvents(false);
    }
  };

  // 🔍 Select tree node
  const handleSelect = async (keys: React.Key[], info: any) => {
    if (!info?.node?.key) return;
    const bId = info.node.key;

    setSelectedBatch({
      id: bId,
      title: info.node.title,
    });

    await fetchEpcisEvents(Number(bId));
  };

  const columns = [
    { title: "Loại sự kiện", dataIndex: "event_type" },
    { title: "Biz Step", dataIndex: "biz_step" },
    { title: "Mã sản phẩm", dataIndex: "product_code" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      render: (v: any, r: any) => `${v || 0} ${r.unit || ""}`,
    },
    {
      title: "Thời gian",
      dataIndex: "event_time",
      render: (t: string) =>
        t ? new Date(t).toLocaleString("vi-VN") : "—",
    },
    { title: "Địa điểm", dataIndex: "biz_location" },
  ];

  // 🎯 Render Graph
  useEffect(() => {
    if (!trace || !graphRef.current) return;

    if (g6Instance.current) {
      g6Instance.current.destroy();
      g6Instance.current = null;
    }

    const graph = new G6.Graph({
      container: graphRef.current,
      width: graphRef.current.clientWidth,
      height: 300,
      layout: {
        type: "dagre",
        rankdir: "LR",
        nodesep: 40,
        ranksep: 80,
      },
      defaultNode: {
        type: "rect",
        size: [150, 40],
        style: {
          radius: 6,
          fill: "#e6f4ff",
          stroke: "#1677ff",
        },
        labelCfg: {
          style: { fontSize: 12, fill: "#000" },
        },
      },
      defaultEdge: {
        type: "polyline",
        style: { stroke: "#aaa", endArrow: true },
      },
      modes: { default: ["drag-canvas", "zoom-canvas"] },
    } as any); // ✅ FIX 2

    const nodes: any[] = [];
    const edges: any[] = [];

    const addNode = (batch: any, parentId?: string) => {
      const id = String(batch.id);
      if (!nodes.find((n) => n.id === id)) {
        nodes.push({
          id,
          label: `${batch.code}\n(${batch.owner_role})`,
          style: {
            fill:
              batch.owner_role === "farm"
                ? "#d9f7be"
                : batch.owner_role === "supplier"
                ? "#ffd666"
                : batch.owner_role === "manufacturer"
                ? "#bae7ff"
                : "#ffd6e7",
          },
        });
      }
      if (parentId) edges.push({ source: parentId, target: id });
      (batch.children || []).forEach((c: any) => addNode(c, id));
    };

    addNode(trace.root);
    (trace.upstream || []).forEach((u: any) => addNode(u));
    (trace.downstream || []).forEach((d: any) => addNode(d));

    (graph as any).data({ nodes, edges }); // ✅ FIX 3
    graph.render();

    g6Instance.current = graph;
  }, [trace]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1300}
      title="🔍 Truy xuất nguồn gốc (Trace Chain + EPCIS + Graph)"
      footer={null}
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : trace ? (
        <>
          <Title level={5}>
            Lô hiện tại:{" "}
            <Text strong>
              {trace.root?.code} ({trace.root?.owner_role})
            </Text>{" "}
            — {trace.root?.status}
          </Title>

          <Card size="small" title="📈 Chuỗi liên kết (Graph View)" className="mb-4">
            <div
              ref={graphRef}
              style={{
                width: "100%",
                height: 300,
                border: "1px solid #f0f0f0",
                borderRadius: 6,
              }}
            />
          </Card>

          <Row gutter={12}>
            <Col span={12}>
              <Title level={5}>🔼 Upstream</Title>
              {trace.upstream?.length ? (
                <Tree
                  defaultExpandAll
                  onSelect={handleSelect}
                  treeData={trace.upstream.map(convertNode)}
                />
              ) : (
                <p>Không có dữ liệu tầng trước.</p>
              )}
            </Col>

            <Col span={12}>
              <Title level={5}>🔽 Downstream</Title>
              {trace.downstream?.length ? (
                <Tree
                  defaultExpandAll
                  onSelect={handleSelect}
                  treeData={trace.downstream.map(convertNode)}
                />
              ) : (
                <p>Không có dữ liệu tầng sau.</p>
              )}
            </Col>
          </Row>

          {selectedBatch && (
            <Card className="mt-4" bordered>
              {loadingEvents ? (
                <Spin />
              ) : events.length ? (
                <Table
                  dataSource={events}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                />
              ) : (
                <p>Không có sự kiện EPCIS.</p>
              )}
            </Card>
          )}
        </>
      ) : (
        <p>Không có dữ liệu truy xuất.</p>
      )}
    </Modal>
  );
}
