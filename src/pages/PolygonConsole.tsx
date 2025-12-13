import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Select, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { api } from '../api';

export default function PolygonConsole() {
  const [abis, setAbis] = useState<any[]>([]);
  const [abiId, setAbiId] = useState<number | undefined>(undefined);
  const [rawAbi, setRawAbi] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [methods, setMethods] = useState<string[]>([]);
  const [paramDefs, setParamDefs] = useState<any[]>([]);
  const [paramValues, setParamValues] = useState<any>({});
  const [chosen, setChosen] = useState<string>('');

  async function load() {
    const r = await api().get('/api/polygon/abis');
    setAbis(r.data.items || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadAbi(values: any) {
    try {
      const body = {
        name: values.name,
        network: values.network,
        rpc_url: values.rpc_url,
        address: values.address,
        abi: rawAbi,
      };
      await api().post('/api/polygon/abis', body);
      message.success('ABI saved');
      load();
    } catch (e) {
      message.error('Save failed');
    }
  }

  async function call(values: any) {
    const r = await api().post('/api/polygon/call', {
      abi_id: abiId,
      method: values.method,
      args: values.args ? JSON.parse(values.args) : [],
    });
    setResult(r.data);
  }

  async function send(values: any) {
    const r = await api().post('/api/polygon/tx', {
      abi_id: abiId,
      method: values.method,
      args: values.args ? JSON.parse(values.args) : [],
      private_key: values.private_key,
    });
    setResult(r.data);
  }

  return (
    <div className="container">
      <Card className="card" title="Polygon Console">
        <Card size="small" title="Upload ABI">
          <Form onFinish={uploadAbi} layout="vertical">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="network" label="Network">
              <Input placeholder="polygon, amoy, ..." />
            </Form.Item>
            <Form.Item name="rpc_url" label="RPC URL" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="address" label="Contract Address" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="ABI JSON">
              <Upload
                beforeUpload={(f) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const json = JSON.parse(String(reader.result));
                      setRawAbi(json);
                      message.success('ABI loaded');
                    } catch {
                      message.error('Invalid ABI JSON');
                    }
                  };
                  reader.readAsText(f);
                  return false; // prevent upload
                }}
              >
                <Button icon={<UploadOutlined />}>Select ABI JSON</Button>
              </Upload>
            </Form.Item>

            <Button htmlType="submit" type="primary">
              Save ABI
            </Button>
          </Form>
        </Card>

        <Card size="small" title="Call / Send">
          <div style={{ marginBottom: 8 }}>
            <Select
              style={{ width: 300, marginRight: 8 }}
              placeholder="Select saved ABI"
              onChange={async (v) => {
                setAbiId(v);
                const r = await api().get(`/api/polygon/abi/${v}/methods`);
                setMethods(r.data.methods || []);
              }}
              options={abis.map((a: any) => ({
                label: `${a.name} (${a.address.slice(0, 8)}...)`,
                value: a.id,
              }))}
            />
            <Button onClick={load}>Reload ABIs</Button>
          </div>

          <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              style={{ width: 260 }}
              placeholder="Select method"
              options={methods.map((m) => ({ label: m, value: m }))}
              onChange={async (m) => {
                setChosen(m);
                const abi = abis.find((a) => a.id === abiId);
                if (abi) {
                  await api().get(`/api/polygon/abi/${abiId}/methods`);
                }
              }}
            />
            <Button
              onClick={async () => {
                if (!abiId || !chosen) return;
                const info = await api().get(`/api/polygon/abis`);
                const abi = info.data.items.find((x: any) => x.id === abiId);
                if (abi) {
                  // refresh
                }
              }}
            >
              Refresh
            </Button>
          </div>

          <div style={{ marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Select method"
              options={methods.map((m) => ({ label: m, value: m }))}
              onChange={async (m) => {
                setChosen(m);
                try {
                  const info = await api().get(`/api/polygon/abis`);
                  const abi = (info.data.items || []).find((x: any) => x.id === abiId);
                  if (!abi) {
                    setParamDefs([]);
                    return;
                  }
                  // you may fetch ABI inputs here later if endpoint exists
                } catch (e) {
                  setParamDefs([]);
                }
              }}
            />
          </div>

          <div>
            {paramDefs.length > 0 &&
              paramDefs.map((p: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <label style={{ display: 'block', fontSize: 12 }}>
                    {p.name || 'arg' + idx} ({p.type})
                  </label>
                  <input
                    className="ant-input"
                    value={paramValues[p.name || 'arg' + idx] || ''}
                    onChange={(e) =>
                      setParamValues({
                        ...paramValues,
                        [p.name || 'arg' + idx]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
          </div>

          <Form layout="inline" onFinish={call} style={{ marginBottom: 8 }}>
            <Form.Item name="method" rules={[{ required: true }]}>
              <Input placeholder="method name" />
            </Form.Item>
            <Form.Item name="args">
              <Input placeholder='["arg1","arg2"] (JSON array)' />
            </Form.Item>
            <Button htmlType="submit">eth_call</Button>
          </Form>

          <Form layout="inline" onFinish={send}>
            <Form.Item name="method" rules={[{ required: true }]}>
              <Input placeholder="method name" />
            </Form.Item>
            <Form.Item name="args">
              <Input placeholder='["arg1","arg2"] (JSON array)' />
            </Form.Item>
            <Form.Item name="private_key" rules={[{ required: true }]}>
              <Input.Password placeholder="private key" />
            </Form.Item>
            <Button htmlType="submit" type="primary">
              Send Tx
            </Button>
          </Form>

          <div style={{ marginTop: 8 }}>
            <b>Result</b>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </Card>
      </Card>
    </div>
  );
}
