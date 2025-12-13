import { useEffect, useState } from "react";
import { Table, Typography } from "antd";
import { api } from "@/api";

const { Text } = Typography;

export default function UsageLogTab({ batchId }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    api().get(`/api/batches/usage-log/${batchId}`).then((res) => {
      setData(res.data.items);
    });
  }, [batchId]);

  const columns = [
    { title: "Ngày tạo", dataIndex: "created_at" },
    { title: "Số lượng", dataIndex: "used_quantity" },
    { title: "Đơn vị", dataIndex: "unit" },
    { title: "Batch con", dataIndex: "child_code", render: (v) => <Text code>{v}</Text> },
    { title: "Mục đích", dataIndex: "purpose" },
    { title: "Người tạo", dataIndex: "created_by" },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 10 }}
    />
  );
}
