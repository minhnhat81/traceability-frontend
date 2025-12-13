import { useEffect, useState } from "react";
import { Table, Tabs, Button, Space, Tag, message, Typography } from "antd";
import { ReloadOutlined, CheckOutlined } from "@ant-design/icons";
import { api } from "@/api";
import EPCISCloneButton from "./EPCISCloneButton"; // ✅ thay cho CloneBatchModal

const { TabPane } = Tabs;
const { Text } = Typography;

export default function TopTabs() {
  const [activeTab, setActiveTab] = useState("farm");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (level?: string) => {
    setLoading(true);
    try {
      const res = await api().get("/api/batches", { params: { level: level || activeTab } });
      setData(res.data.items || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu batch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const handleFinalize = async (record: any) => {
    try {
      await api().post("/api/batches/finalize", { batch_code: record.code });
      message.success(`${record.code} đã đánh dấu sẵn sàng`);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || "Lỗi finalize batch");
    }
  };

  const columns = [
    {
      title: "Mã lô",
      dataIndex: "code",
      key: "code",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Sản phẩm",
      dataIndex: "product_code",
      key: "product_code",
    },
    {
      title: "Tổng SL",
      dataIndex: "quantity",
      key: "quantity",
      render: (v, r) => `${v} ${r.unit || ""}`,
    },
    {
      title: "Đã dùng",
      dataIndex: "used",
      key: "used",
      render: (v, r) => `${v} ${r.unit || ""}`,
    },
    {
      title: "Còn lại",
      dataIndex: "remaining",
      key: "remaining",
      render: (v, r) => (
        <Text type={v <= 0 ? "danger" : "success"}>
          {v} {r.unit || ""}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "READY_FOR_NEXT_LEVEL") color = "green";
        else if (status === "OPEN") color = "blue";
        else if (status === "CLOSED") color = "volcano";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status !== "READY_FOR_NEXT_LEVEL" && (
            <Button
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleFinalize(record)}
            >
              Finalize
            </Button>
          )}
          {/* ✅ Giao diện mới có hiển thị tồn kho */}
          <EPCISCloneButton
            batchCode={record.code}
            batchStatus={record.status}
            remaining={record.remaining}
            unit={record.unit}
            onReload={() => fetchData(activeTab)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => fetchData(activeTab)}>
          Làm mới
        </Button>
      </Space>

      <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k)}>
        {["farm", "supplier", "manufacturer", "brand"].map((lv) => (
          <TabPane
            tab={lv.charAt(0).toUpperCase() + lv.slice(1)}
            key={lv}
          >
            <Table
              loading={loading}
              dataSource={data}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
}
