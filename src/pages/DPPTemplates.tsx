import { useEffect, useRef, useState } from 'react'
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
import * as XLSX from 'xlsx'

import {
  listDppTemplates,
  createDppTemplate,
  updateDppTemplate,
  deleteDppTemplate,
  type DppTemplate,
} from '@/services/dpp_templatesService'
import { DPP_STATIC_GROUPS, DPP_DYNAMIC_GROUPS } from '@constants/dppGroups'

type FormState = Partial<DppTemplate>

/* ===============================
   DEFAULT GROUP STRUCTURE
================================ */
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
    supply_chain: [{ tier: 1, supplier: '', updated_at: '' }],
    ...val,
  }
}

/* ===============================
   GROUP FIELD RENDERER (GIỮ NGUYÊN)
================================ */
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
            title="Material Composition"
            extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => add()}>Add</Button>}
          >
            {listFields.map((field) => (
              <Space key={field.key} align="baseline">
                <Form.Item {...field} name={[field.name, 'name']} rules={[{ required: true }]}>
                  <Input placeholder="Material" />
                </Form.Item>
                <Form.Item {...field} name={[field.name, 'percentage']} rules={[{ required: true }]}>
                  <InputNumber min={0} />
                </Form.Item>
                <Button icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} />
              </Space>
            ))}
          </Card>
        )}
      </Form.List>
    )
  }

  return (
    <Row gutter={16}>
      {fields.map((f: any) => (
        <Col span={12} key={f.name}>
          <Form.Item
            label={
              <span>
                {f.label}
                <Tooltip title={f.tooltip}>
                  <InfoCircleOutlined style={{ marginLeft: 6 }} />
                </Tooltip>
              </span>
            }
            name={prefix([f.name])}
          >
            {f.type === 'number' ? <InputNumber style={{ width: '100%' }} /> : <Input />}
          </Form.Item>
        </Col>
      ))}
    </Row>
  )
}

/* ===============================
   MAIN PAGE
================================ */
export default function DPPTemplatesPage() {
  const [data, setData] = useState<DppTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DppTemplate>()
  const [form] = Form.useForm<FormState>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { reload() }, [])

  async function reload() {
    setLoading(true)
    try {
      setData(await listDppTemplates())
    } finally {
      setLoading(false)
    }
  }

  /* ===============================
     EXPORT XLS – 3 TABS (NEW)
  ================================ */
  function exportTemplateXLS() {
    const wb = XLSX.utils.book_new()

    // TAB 1: META
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([{
        name: 'Sample Template',
        tier: 'supplier',
        template_name: 'default',
        is_active: true,
        description: 'Sample DPP template',
      }]),
      'META'
    )

    // TAB 2: STATIC_DPP
    const staticRow: any = {}
    DPP_STATIC_GROUPS.forEach((g) => {
      g.fields.forEach((f: any) => {
        staticRow[`${g.key}.${f.name}`] = f.type === 'number' ? 0 : `sample_${f.name}`
      })
    })
    staticRow['composition.materials'] = 'Cotton,Polyester'
    staticRow['composition.percentages'] = '80,20'
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([staticRow]),
      'STATIC_DPP'
    )

    // TAB 3: DYNAMIC_DPP
    const dynamicRow: any = {}
    DPP_DYNAMIC_GROUPS.forEach((g) => {
      g.fields.forEach((f: any) => {
        dynamicRow[`${g.key}.${f.name}`] = f.type === 'number' ? 0 : `sample_${f.name}`
      })
    })
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([dynamicRow]),
      'DYNAMIC_DPP'
    )

    XLSX.writeFile(wb, 'DPP_TEMPLATE_SAMPLE.xlsx')
  }

  /* ===============================
     IMPORT XLS – 3 TABS
  ================================ */
  async function importTemplateXLS(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)

    const meta = XLSX.utils.sheet_to_json<any>(wb.Sheets['META'])[0] || {}
    const staticRow = XLSX.utils.sheet_to_json<any>(wb.Sheets['STATIC_DPP'])[0] || {}
    const dynamicRow = XLSX.utils.sheet_to_json<any>(wb.Sheets['DYNAMIC_DPP'])[0] || {}

    const staticData = ensureGroupDefaults()
    const dynamicData = ensureGroupDefaults()

    Object.keys(staticRow).forEach((k) => {
      const [g, f] = k.split('.')
      if ((staticData as any)[g]) {
        ;(staticData as any)[g][f] = staticRow[k]
      }
    })

    Object.keys(dynamicRow).forEach((k) => {
      const [g, f] = k.split('.')
      if ((dynamicData as any)[g]) {
        ;(dynamicData as any)[g][f] = dynamicRow[k]
      }
    })

    form.setFieldsValue({
      ...meta,
      static_data: staticData,
      dynamic_data: dynamicData,
    })

    message.success('Imported XLS successfully')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ===============================
     RENDER
  ================================ */
  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => setOpen(true)}>New Template</Button>
        <Button onClick={exportTemplateXLS}>Export XLS</Button>
        <Button onClick={() => fileInputRef.current?.click()}>Import XLS</Button>
        <input ref={fileInputRef} hidden type="file" accept=".xlsx" onChange={importTemplateXLS} />
      </Space>

      <Table rowKey="id" dataSource={data} loading={loading} />

      <Modal open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} width={1100}>
        <Form form={form} layout="vertical">
          <Tabs
            items={[
              {
                key: 'static',
                label: 'Static Data',
                children: DPP_STATIC_GROUPS.map((g) => (
                  <Card key={g.key} size="small" title={g.label}>
                    <GroupFields prefix={(n) => ['static_data', g.key, ...n]} fields={g.fields} groupKey={g.key} />
                  </Card>
                )),
              },
              {
                key: 'dynamic',
                label: 'Dynamic Data',
                children: DPP_DYNAMIC_GROUPS.map((g) => (
                  <Card key={g.key} size="small" title={g.label}>
                    <GroupFields prefix={(n) => ['dynamic_data', g.key, ...n]} fields={g.fields} groupKey={g.key} />
                  </Card>
                )),
              },
            ]}
          />
        </Form>
      </Modal>
    </div>
  )
}
