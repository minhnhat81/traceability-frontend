import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Tabs,
  message,
  Divider,
  Modal,
  Progress,
} from "antd";
import { api } from "../api";
import { withTheme } from "@rjsf/core";
import { Theme as AntDTheme } from "@rjsf/antd";
import validator from "@rjsf/validator-ajv8";
import schema from "../configs/forms/BlockchainConfigFormSchema.json";

const FormRjsf = withTheme(AntDTheme);

export default function BlockchainSettings() {
  const [configs, setConfigs] = useState<any>({ polygon: null, fabric: null });
  const [activeTab, setActiveTab] = useState("polygon");
  const [formFabric] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  // ===============================
  // Load saved configs
  // ===============================
  async function load() {
    setLoading(true);
    try {
      const r = await api().get("/api/configs/blockchain");
      setConfigs(r.data || {});
    } catch {
      message.error("Failed to load blockchain configs");
    } finally {
      setLoading(false);
    }
  }

  // ===============================
  // Save configs
  // ===============================
  async function savePolygon(v: any) {
    const body = {
      chain_name: "Polygon",
      rpc_url: v.rpc_url,
      contract_address: v.contract_address,
      network: "polygon",
      abi_id: 1,
      config_json: v,
    };
    try {
      const r = await api().post("/api/configs/blockchain", body);
      message.success("Polygon config saved!");
      setConfigs(r.data.configs);
    } catch {
      message.error("Save failed");
    }
  }

  async function saveFabric(v: any) {
    const config = {
      msp_id: v.msp_id,
      connection_profile: v.connection_profile,
      channel_name: v.channel_name,
      chaincode_name: v.chaincode_name,
      gateway_url: v.gateway_url,
    };
    const body = {
      chain_name: "Fabric",
      rpc_url: v.gateway_url,
      contract_address: v.chaincode_name,
      network: "fabric",
      abi_id: 1,
      config_json: config,
    };
    try {
      const r = await api().post("/api/configs/blockchain", body);
      message.success("Fabric config saved!");
      setConfigs(r.data.configs);
      formFabric.resetFields();
    } catch {
      message.error("Save failed");
    }
  }

  // ===============================
  // Test / Deploy
  // ===============================
  async function testConnection(kind: "polygon" | "fabric") {
    setModalVisible(true);
    setModalTitle("Testing Connection...");
    setProgress(20);
    try {
      const r = await api().post("/api/configs/blockchain/test", { kind });
      setProgress(100);
      setModalTitle("Connection Result");
      setModalContent(r.data);
    } catch (err: any) {
      setModalContent({ error: err?.response?.data?.detail || "Test failed" });
      setProgress(100);
    }
  }

  async function deployContract(kind: "polygon" | "fabric") {
    setModalVisible(true);
    setModalTitle("Deploying Contract...");
    setProgress(30);
    try {
      const r = await api().post("/api/configs/blockchain/deploy", { kind });
      setProgress(100);
      setModalTitle("Deployment Completed");
      setModalContent(r.data);
    } catch (err: any) {
      setModalContent({
        error: err?.response?.data?.detail || "Deploy failed",
      });
      setProgress(100);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ===============================
  // Render
  // ===============================
  return (
    <div className="container" style={{ padding: 24 }}>
      <Card title="Blockchain Configurations" bordered loading={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "polygon",
              label: "Polygon",
              children: (
                <FormRjsf
                  schema={schema as any}
                  validator={validator}
                  onSubmit={({ formData }) => savePolygon(formData)}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button type="primary" htmlType="submit">
                      Save
                    </Button>
                    <Button onClick={() => testConnection("polygon")}>
                      Test Connection
                    </Button>
                    <Button onClick={() => deployContract("polygon")} danger>
                      Deploy Contract
                    </Button>
                  </div>
                </FormRjsf>
              ),
            },
            {
              key: "fabric",
              label: "Fabric",
              children: (
                <Form form={formFabric} layout="vertical" onFinish={saveFabric}>
                  <Form.Item
                    name="gateway_url"
                    label="Gateway URL"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="http://localhost:7050" />
                  </Form.Item>
                  <Form.Item
                    name="channel_name"
                    label="Channel Name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="mychannel" />
                  </Form.Item>
                  <Form.Item
                    name="chaincode_name"
                    label="Chaincode Name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="tracecc" />
                  </Form.Item>
                  <Form.Item
                    name="connection_profile"
                    label="Connection Profile (JSON)"
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea rows={6} placeholder="{}" />
                  </Form.Item>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button type="primary" htmlType="submit">
                      Save
                    </Button>
                    <Button onClick={() => testConnection("fabric")}>
                      Test Connection
                    </Button>
                    <Button onClick={() => deployContract("fabric")} danger>
                      Deploy Chaincode
                    </Button>
                  </div>
                </Form>
              ),
            },
          ]}
        />
        <Divider />
        <b>Current Configurations:</b>
        <pre>
          {JSON.stringify(
            activeTab === "polygon"
              ? { polygon: configs.polygon }
              : { fabric: configs.fabric },
            null,
            2
          )}
        </pre>
      </Card>

      <Modal
        open={modalVisible}
        title={modalTitle}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <Progress percent={progress} />
        <pre style={{ marginTop: 12 }}>
          {modalContent ? JSON.stringify(modalContent, null, 2) : "Running..."}
        </pre>
      </Modal>
    </div>
  );
}
