import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tabs,
  Card,
  Space,
  Row,
  Col,
  message,
  Tooltip,
} from 'antd'
import { InfoCircleOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import {
  listDppTemplates,
  createDppTemplate,
  updateDppTemplate,
  deleteDppTemplate,
  type DppTemplate,
} from '@/services/dpp_templatesService'
import { DPP_STATIC_GROUPS, DPP_DYNAMIC_GROUPS } from '@constants/dppGroups'

type FormState = Partial<DppTemplate>

/** ✅ Default JSON structure */
function ensureGroupDefaults(val: any = {}) {
  return {
    product_description: { gtin: '', name: '', model: '' },
    composition: { materials_block: [] },
    social_impact: { factory: '', certifications: [] },
    animal_welfare: { standard: '', notes: '' },
    health_safety: { policy: '', certified_by: '' },
    brand_info: { brand: '', contact: '' },
    use_phase: { instructions: '' },
    end_of_life: { recycle_guideline: '' },
    digital_identity: { qr: '', did: '', ipfs_cid: '' },
    environmental_impact: { co2: 0, water: 0, electricity: 0 },
    circularity: { waste_reused: 0, packaging_recycled: 0 },
    quantity_info: { batch: '', weight: 0 },
    cost_info: { labor_cost: 0, transport_cost: 0 },
    transport: { distance_km: 0, co2_per_km: 0 },
    documentation: [{ file: '', issued_by: '' }],
    supply_chain: [{ tier: 0, supplier: '', updated_at: '' }],
    ...val,
  }
}

/** ✅ Group Field Renderer */
function GroupFields({
  prefix,
  fields,
  groupKey,
}: {
  prefix: (name: (string | number)[]) => string[]
  fields: any[]
  groupKey: string
}) {
  if (groupKey === 'composition') {
    return (
      <Form.List name={prefix(['materials_block'])}>
        {(listFields, { add, remove }) => (
          <Card
            size="small"
            title="Material Composition (Name + Percentage)"
            extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => add()}>Add Material</Button>}
          >
            {listFields.map((field) => (
              <Space key={field.key} align="baseline" style={{ marginBottom: 8 }}>
                <Form.Item {...field} name={[field.name, 'name']} rules={[{ required: true, message: 'Material name required' }]}>
                  <Input placeholder="Material name (e.g. Cotton)" style={{ width: 220 }} />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'percentage']} rules={[{ required: true, message: 'Percentage required' }]}>
                  <InputNumber placeholder="%" style={{ width: 120 }} min={0} parser={(v) => (v ? parseFloat(v) : 0)} />
                </Form.Item>
                <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
              </Space>
            ))}
            <Tooltip title="Add each material and its percentage. Example: Cotton 80, Polyester 20. The total must equal 100%.">
              <InfoCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </Card>
        )}
      </Form.List>
    )
  }

  if (fields.some((f: any) => f.name === 'certifications')) {
    return (
      <Form.List name={prefix(['certifications'])}>
        {(listFields, { add, remove }) => (
          <Card
            size="small"
            title="Certifications (Name + Number + Issued By)"
            extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => add()}>Add Certification</Button>}
          >
            {listFields.map((field) => (
              <Row gutter={12} key={field.key} style={{ marginBottom: 6 }}>
                <Col span={8}>
                  <Form.Item {...field} name={[field.name, 'name']} rules={[{ required: true, message: 'Certification name required' }]} label="Name">
                    <Input placeholder="e.g. OEKO-TEX® Standard 100" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item {...field} name={[field.name, 'number']} rules={[{ required: true, message: 'Certification number required' }]} label="Number">
                    <Input placeholder="e.g. 17.HVN.12345" />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item {...field} name={[field.name, 'issued_by']} rules={[{ required: true, message: 'Issued by required' }]} label="Issued By">
                    <Input placeholder="e.g. TESTEX" />
                  </Form.Item>
                </Col>
                <Col span={1} style={{ display: 'flex', alignItems: 'center' }}>
                  <Button danger type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
                </Col>
              </Row>
            ))}
            <Tooltip title="Add each certification with name, number, and issuer. Example: OEKO-TEX® Standard 100, No. 17.HVN.12345, TESTEX.">
              <InfoCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </Card>
        )}
      </Form.List>
    )
  }

  return (
    <Row gutter={16}>
      {fields.map((f: any, idx) => (
        <Col span={12} key={idx}>
          <Form.Item
            label={<span>{f.label}<Tooltip title={f.tooltip}><InfoCircleOutlined style={{ marginLeft: 6, color: '#999' }} /></Tooltip></span>}
            name={prefix([f.name])}
            rules={f.type === 'number' ? [{ type: 'number', min: 0, message: 'Value must be ≥ 0' }] : []}
          >
            {f.type === 'number' ? (
              <InputNumber placeholder="Enter number" style={{ width: '100%' }} min={0} parser={(v) => (v ? parseFloat(v) : 0)} />
            ) : (
              <Input placeholder="Enter text" />
            )}
          </Form.Item>
        </Col>
      ))}
    </Row>
  )
}

export default function DPPTemplatesPage() {
  const [data, setData] = useState<DppTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DppTemplate | undefined>(undefined)
  const [form] = Form.useForm<FormState>()
  const [jsonMode, setJsonMode] = useState({ static: '', dynamic: '' })

  async function reload() {
    setLoading(true)
    try {
      setData(await listDppTemplates())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

  function onAdd() {
    setEditing(undefined)
    const def = ensureGroupDefaults()
    form.resetFields()
    form.setFieldsValue({
      tier: 'supplier',
      template_name: 'default',
      is_active: true,
      static_data: def,
      dynamic_data: def,
    })
    setJsonMode({ static: JSON.stringify(def, null, 2), dynamic: JSON.stringify(def, null, 2) })
    setOpen(true)
  }

  function onEdit(row: DppTemplate) {
    setEditing(row)
    const staticData = ensureGroupDefaults(row.static_data || {})
    const dynamicData = ensureGroupDefaults(row.dynamic_data || {})
    const comp = staticData.composition || {}
    if (Array.isArray(comp.materials) && Array.isArray(comp.percentages)) {
      staticData.composition.materials_block = comp.materials.map((m: string, i: number) => ({
        name: m,
        percentage: comp.percentages[i] ?? 0,
      }))
    }
    const patch = { ...row, static_data: staticData, dynamic_data: dynamicData }
    form.setFieldsValue(patch)
    setJsonMode({ static: JSON.stringify(staticData, null, 2), dynamic: JSON.stringify(dynamicData, null, 2) })
    setOpen(true)
  }

  async function onDelete(row: DppTemplate) {
    await deleteDppTemplate(row.id)
    message.success('Deleted')
    reload()
  }

  async function onSubmit() {
    try {
      const val = await form.validateFields()
      const payload: any = { ...val }

      const comp = payload.static_data?.composition || {}
      if (Array.isArray(comp.materials_block)) {
        payload.static_data.composition.materials = comp.materials_block.map((x: any) => x.name)
        payload.static_data.composition.percentages = comp.materials_block.map((x: any) =>
          parseFloat(x.percentage || 0)
        )
      }

      const total = (payload.static_data?.composition?.percentages || []).reduce(
        (sum: number, n: number) => sum + (Number.isFinite(n) ? n : 0),
        0
      )
      if (Math.abs(total - 100) > 0.01) {
        message.error('Total material percentage must equal 100%.')
        return
      }

      if (editing) {
        await updateDppTemplate(editing.id, payload)
        message.success('DPP Template updated successfully.')
      } else {
        await createDppTemplate(payload)
        message.success('DPP Template created successfully.')
      }

      setOpen(false)
      reload()
    } catch (err: any) {
      console.error('Submit failed:', err)
      message.error('Unexpected error while saving template.')
    }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Tier', dataIndex: 'tier' },
    { title: 'Template', dataIndex: 'template_name' },
    { title: 'Active', dataIndex: 'is_active', render: (v: boolean) => (v ? 'Yes' : 'No') },
    { title: 'Updated', dataIndex: 'updated_at' },
    {
      title: 'Actions',
      render: (_: any, row: DppTemplate) => (
        <Space>
          <Button type="link" onClick={() => onEdit(row)}>Edit</Button>
          <Button danger type="link" onClick={() => onDelete(row)}>Delete</Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={onAdd}>New Template</Button>
      </Space>

      <Table rowKey="id" dataSource={data} columns={columns} loading={loading} />

      <Modal
        title={editing ? 'Edit DPP Template' : 'Create DPP Template'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        width={1100}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            tier: 'supplier',
            template_name: 'default',
            is_active: true,
            static_data: ensureGroupDefaults(),
            dynamic_data: ensureGroupDefaults(),
          }}
        >
          <Card size="small" style={{ marginBottom: 12 }}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Template name" />
            </Form.Item>
            <Space size="large" wrap>
              <Form.Item label="Tier" name="tier">
                <Select
                  options={['supplier', 'manufacturer', 'brand'].map((v) => ({ value: v, label: v }))}
                  style={{ width: 200 }}
                />
              </Form.Item>
              <Form.Item label="Template Code" name="template_name">
                <Input style={{ width: 220 }} />
              </Form.Item>
              <Form.Item label="Active" name="is_active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Space>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Card>

          <Tabs
            items={[
              {
                key: 'static',
                label: 'Static Data',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {DPP_STATIC_GROUPS.map((g, idx) => (
                      <Card key={g.key} size="small" title={`${idx + 1}. ${g.label}`} style={{ background: '#fafafa' }}>
                        <GroupFields prefix={(n) => ['static_data', String(g.key), ...n.map(String)]} fields={g.fields} groupKey={g.key} />
                      </Card>
                    ))}
                  </Space>
                ),
              },
              {
                key: 'dynamic',
                label: 'Dynamic Data',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {DPP_DYNAMIC_GROUPS.map((g, idx) => (
                      <Card
                        key={g.key}
                        size="small"
                        title={`${idx + 1 + DPP_STATIC_GROUPS.length}. ${g.label}`}
                        style={{ background: '#fafafa' }}
                      >
                        <GroupFields prefix={(n) => ['dynamic_data', String(g.key), ...n.map(String)]} fields={g.fields} groupKey={g.key} />
                      </Card>
                    ))}
                  </Space>
                ),
              },
              {
                key: 'json',
                label: 'JSON Editor',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Card size="small" title="Static Data (JSON)">
                      <Input.TextArea
                        rows={12}
                        value={jsonMode.static}
                        onChange={(e) => setJsonMode({ ...jsonMode, static: e.target.value })}
                      />
                    </Card>
                    <Card size="small" title="Dynamic Data (JSON)">
                      <Input.TextArea
                        rows={12}
                        value={jsonMode.dynamic}
                        onChange={(e) => setJsonMode({ ...jsonMode, dynamic: e.target.value })}
                      />
                    </Card>
                  </Space>
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </div>
  )
}
