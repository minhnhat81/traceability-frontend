import { useState, useEffect } from "react";
import { api } from "../api";
import { Table, Input, Button, Form, message } from "antd";

export default function Products() {
  const [items, setItems] = useState<any[]>([]);
  const [form] = Form.useForm();

  async function load() {
    const res = await api().get("/api/products");
    setItems(res.data.items || []);
  }

  async function create(v: any) {
    await api().post("/api/products", v);
    message.success("Created");
    form.resetFields();
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <h3>Products</h3>
      <Form form={form} layout="inline" onFinish={create} style={{ marginBottom: 12 }}>
        <Form.Item name="code" rules={[{ required: true }]}>
          <Input placeholder="code" />
        </Form.Item>
        <Form.Item name="name" rules={[{ required: true }]}>
          <Input placeholder="name" />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Create
        </Button>
      </Form>
      <Table
        rowKey="id"
        size="small"
        dataSource={items}
        columns={[
          { title: "ID", dataIndex: "id", width: 80 },
          { title: "Code", dataIndex: "code" },
          { title: "Name", dataIndex: "name" },
          { title: "Created", dataIndex: "created_at" },
        ]}
      />
    </div>
  );
}
