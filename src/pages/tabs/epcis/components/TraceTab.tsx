import { useEffect, useState } from "react";
import { Tree, Card, Input, Button, Space, Typography, message, Tag, Divider } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { api } from "@/api";

const { Title, Text } = Typography;

export default function TraceTab() {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [batchCode, setBatchCode] = useState("");

  const fetchTrace = async (code: string) => {
    if (!code) {
      message.warning("Vui lòng nhập mã lô cần truy vết");
      return;
    }
    setLoading(true);
    try {
      const res = await api().get(`/api/batches/trace_tree/${code}`);
      const data = transformNode(res.data);
      setTreeData([data]);
      message.success("Truy xuất chuỗi thành công");
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.detail || "Không tìm thấy chuỗi batch");
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  const transformNode = (node: any) => ({
    title: (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Tag color={roleColor(node.role)}>{node.role.toUpperCase()}</Tag>
        <Text strong>{node.code}</Text>
        <Text type="secondary" style={{ marginLeft: 4 }}>
          {node.quantity} {node.unit}
        </Text>
        <Tag color={statusColor(node.status)}>{node.status}</Tag>
        <Text type="secondary" style={{ marginLeft: 6 }}>
          (Used: {node.used} / Remain: {node.remaining})
        </Text>
      </div>
    ),
    key: node.code,
    children: (node.children || []).map(transformNode),
  });

  const roleColor = (role: string) => {
    switch (role) {
      case "farm":
        return "green";
      case "supplier":
        return "blue";
      case "manufacturer":
        return "orange";
      case "brand":
        return "purple";
      default:
        return "default";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "READY_FOR_NEXT_LEVEL":
        return "green";
      case "OPEN":
        return "blue";
      case "CLOSED":
        return "volcano";
      default:
        return "default";
    }
  };

  return (
    <Card
      title="Trace Batch Chain (Farm → Supplier → Manufacturer → Brand)"
      style={{ margin: 16 }}
      extra={
        <Space>
          <Input
            placeholder="Nhập mã batch, ví dụ: FARM-001"
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
            onPressEnter={() => fetchTrace(batchCode)}
            style={{ width: 260 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={() => fetchTrace(batchCode)}
          >
            Truy vết
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setBatchCode("");
              setTreeData([]);
            }}
          >
            Xóa
          </Button>
        </Space>
      }
    >
      {treeData.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Title level={5} type="secondary">
            Nhập mã batch để xem sơ đồ chuỗi
          </Title>
        </div>
      ) : (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <Tree
            treeData={treeData}
            defaultExpandAll
            showLine={{ showLeafIcon: false }}
            selectable={false}
          />
        </>
      )}
    </Card>
  );
}
