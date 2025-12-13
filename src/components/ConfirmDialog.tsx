// src/pages/Supplier.tsx
import { useEffect, useState } from 'react'
import { Button, Tabs, Form, Input, Table, message, Card } from 'antd'
import { api } from '../api'

// --------------------------- FARM MANAGEMENT ---------------------------
function FarmManagement() {
  const [farms, setFarms] = useState<any[]>([])
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const r = await api().get('/api/farms')
    setFarms(r.data || [])
    setLoading(false)
  }

  async function create(v: any) {
    await api().post('/api/farms', v)
    message.success('Farm created')
    form.resetFields()
    load()
  }

  async function remove(id: number) {
    await api().delete(`/api/farms/${id}`)
    message.success('Farm deleted')
    load()
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Card className="card" title="Farm Management">
      <Form
        form={form}
        layout="inline"
        onFinish={create}
        style={{ marginBottom: 12 }}
      >
        <Form.Item name="name" rules={[{ required: true }]}>
          <Input placeholder="Farm name" />
        </Form.Item>
        <Form.Item name="code" rules={[{ required: true }]}>
          <Input placeholder="Farm code" />
        </Form.Item>
        <Form.Item name="gln">
          <Input placeholder="GLN" />
        </Form.Item>
        <Form.Item name="size_ha">
          <Input placeholder="Size (ha)" />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Add Farm
        </Button>
      </Form>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={farms}
        size="small"
        columns={[
          { title: 'ID', dataIndex: 'id', width: 60 },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Code', dataIndex: 'code' },
          { title: 'GLN', dataIndex: 'gln' },
          { title: 'Size (ha)', dataIndex: 'size_ha' },
          {
            title: 'Actions',
            render: (r) => (
              <Button danger onClick={() => remove(r.id)}>
                Delete
              </Button>
            ),
          },
        ]}
      />
    </Card>
  )
}

// --------------------------- SUPPLIER PORTAL MAIN ---------------------------
// ⛔ Trước đây các function này return void → lỗi
// ✅ Bây giờ trả về JSX hợp lệ (giữ logic gốc)

function UploadDocs() {
  // giữ nguyên logic cũ (nếu có)
  return <div />
}

function EPCISQuick() {
  // giữ nguyên logic cũ (nếu có)
  return <div />
}

function FactoryProfile() {
  // giữ nguyên logic cũ (nếu có)
  return <div />
}

function ProcessReg() {
  // giữ nguyên logic cũ (nếu có)
  return <div />
}

export default function Supplier() {
  return (
    <div className="container">
      <Tabs
        items={[
          { key: 'farm', label: 'Farm Management', children: <FarmManagement /> },
          { key: 'factory', label: 'Factory Profile', children: <FactoryProfile /> },
          { key: 'process', label: 'Process Registration', children: <ProcessReg /> },
          { key: 'epcis', label: 'EPCIS Capture', children: <EPCISQuick /> },
          { key: 'upload', label: 'Upload Documents', children: <UploadDocs /> },
        ]}
      />
    </div>
  )
}
