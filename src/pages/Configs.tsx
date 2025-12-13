import { useEffect, useState } from "react";
import { Button, message } from "antd";
import { api } from "../api";

export default function Configs() {
  const [cfg, setCfg] = useState<any>({});

  async function load() {
    const r = await api().get("/api/configs");
    setCfg(r.data);
  }

  async function save() {
    await api().post("/api/configs", {
      fabric: cfg.fabric,
      polygon: cfg.polygon,
      active: true,
    });
    message.success("Saved configuration");
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <h3>⚙️ Blockchain Config</h3>
      <pre style={{ background: "#f9fafb", padding: 10, borderRadius: 8 }}>
        {JSON.stringify(cfg, null, 2)}
      </pre>
      <Button onClick={save}>Save</Button>
    </div>
  );
}
