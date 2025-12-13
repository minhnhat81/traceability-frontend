import React from "react";
import { Table } from "antd";

export default function KeyValueTable({ data }: { data: Record<string, any> }) {
  const rows = Object.entries(data || {}).map(([key, value]) => ({
    key,
    field: key,
    value:
      typeof value === "object" && value !== null
        ? JSON.stringify(value, null, 2)
        : String(value),
  }));

  return (
    <Table
      size="small"
      pagination={false}
      columns={[
        { title: "Field", dataIndex: "field", width: "30%" },
        { title: "Value", dataIndex: "value" },
      ]}
      dataSource={rows}
    />
  );
}
