import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Switch, Tabs, Card, Space, message } from 'antd'
import { listDppTemplates, createDppTemplate, updateDppTemplate, deleteDppTemplate, type DppTemplate } from '@/services/dpp_templatesService'
import { DPP_STATIC_GROUPS, DPP_DYNAMIC_GROUPS } from '../constants/dppGroups';


type FormState = Partial<DppTemplate>

function GroupFields({prefix, fields}:{prefix:(name:(string|number)[])=>string[]; fields:any[]}){
  const [form] = Form.useForm() // just for useWatch if needed
  return (
    <Space direction="vertical" style={{width:'100%'}}>
      {fields.map((f:any)=>(
        <Form.Item key={f.name} label={f.label} name={prefix([f.name])} valuePropName={f.type==='number' ? undefined : undefined}>
          {f.type==='number' ? <Input type="number" /> :
           f.type==='array' ? <Input placeholder='["a","b"] as JSON' /> :
           <Input />}
        </Form.Item>
      ))}
    </Space>
  )
}

export default function DPPTemplatesPage(){
  const [data,setData]=useState<DppTemplate[]>([])
  const [loading,setLoading]=useState(false)
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState<DppTemplate|undefined>(undefined)
  const [form]=Form.useForm<FormState>()

  async function reload(){
    setLoading(true)
    try{ setData(await listDppTemplates()) } finally{ setLoading(false) }
  }
  useEffect(()=>{ reload() },[])

  function onAdd(){
    setEditing(undefined)
    form.resetFields()
    setOpen(true)
  }
  function onEdit(row:DppTemplate){
    setEditing(row)
    form.setFieldsValue(row as any)
    setOpen(true)
  }
  async function onDelete(row:DppTemplate){
    await deleteDppTemplate(row.id)
    message.success('Deleted')
    reload()
  }

  async function onSubmit(){
    const val = await form.validateFields()
    if(editing){
      await updateDppTemplate(editing.id, val)
      message.success('Updated')
    }else{
      await createDppTemplate(val)
      message.success('Created')
    }
    setOpen(false); reload()
  }

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Tier', dataIndex: 'tier' },
    { title: 'Template', dataIndex: 'template_name' },
    { title: 'Active', dataIndex: 'is_active', render: (v:boolean)=> v?'Yes':'No' },
    { title: 'Updated', dataIndex: 'updated_at' },
    { title: 'Actions', render: (_:any, row:DppTemplate)=>(
      <Space>
        <Button type="link" onClick={()=>onEdit(row)}>Edit</Button>
        <Button danger type="link" onClick={()=>onDelete(row)}>Delete</Button>
      </Space>
    )},
  ]

  return (
    <div style={{padding:16}}>
      <Space style={{marginBottom:12}}>
        <Button type="primary" onClick={onAdd}>New Template</Button>
      </Space>
      <Table rowKey="id" dataSource={data} columns={columns} loading={loading} />

      <Modal title={editing?'Edit DPP Template':'Create DPP Template'} open={open} onCancel={()=>setOpen(false)} onOk={onSubmit} width={1000}>
        <Form form={form} layout="vertical" initialValues={{
          tier:'supplier', template_name:'default', is_active:true,
          static_data:{}, dynamic_data:{}, schema:{}
        }}>
          <Card size="small" style={{marginBottom:12}}>
            <Form.Item label="Name" name="name" rules={[{required:true}]}>
              <Input placeholder="Template name" />
            </Form.Item>
            <Space size="large">
              <Form.Item label="Tier" name="tier">
                <Select options={['supplier','manufacturer','brand'].map(v=>({value:v,label:v}))} style={{width:200}} />
              </Form.Item>
              <Form.Item label="Template Code" name="template_name">
                <Input style={{width:220}} />
              </Form.Item>
              <Form.Item label="Active" name="is_active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Space>
            <Form.Item label="Description" name="description">
              <Input.TextArea rows={2}/>
            </Form.Item>
          </Card>

          <Tabs
            items={[
              {
                key:'static', label:'Static Data',
                children: (
                  <Space direction="vertical" style={{width:'100%'}}>
                    {DPP_STATIC_GROUPS.map(g=>(
                      <Card key={g.key} size="small" title={g.label}>
                        <GroupFields prefix={(n) => ['static_data', String(g.key), ...n.map(String)]} fields={g.fields}/>
                      </Card>
                    ))}
                  </Space>
                )
              },
              {
                key:'dynamic', label:'Dynamic Data',
                children: (
                  <Space direction="vertical" style={{width:'100%'}}>
                    {DPP_DYNAMIC_GROUPS.map(g=>(
                      <Card key={g.key} size="small" title={g.label}>
                        {g.fields
                          ? <GroupFields prefix={(n) => ['dynamic_data', String(g.key), ...n.map(String)]} fields={g.fields}/>
                          : <Form.Item name={['dynamic_data', g.key]} label="JSON Array">
                              <Input.TextArea placeholder='[]' />
                            </Form.Item>}
                      </Card>
                    ))}
                  </Space>
                )
              },
              {
                key:'schema', label:'Schema (JSON)',
                children: (
                  <Form.Item name="schema" tooltip="JSON object">
                    <Input.TextArea rows={10} placeholder='{}'/>
                  </Form.Item>
                )
              }
            ]}
          />
        </Form>
      </Modal>
    </div>
  )
}
