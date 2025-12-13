import { useEffect, useState } from "react";
import { Table, Button } from "antd";
import { api } from "../api";

export default function Observer() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const r = await api().get("/api/observer/fabric");
    setItems(r.data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <h3>🔍 Blockchain Observer</h3>
      <Button onClick={load} style={{ marginBottom: 10 }}>
        Reload
      </Button>
      <Table
        rowKey="id"
        size="small"
        dataSource={items}
        columns={[
          { title: "ID", dataIndex: "id", width: 60 },
          { title: "Tx ID", dataIndex: "tx_id" },
          { title: "Block", dataIndex: "block" },
          { title: "Event", dataIndex: "name" },
        ]}
      />
    </div>
  );
}
