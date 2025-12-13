
import { useEffect, useState } from 'react'
import { Tabs, Card, Form, Input, Button, Table, message } from 'antd'
import { api } from '../api'

function Standards(){
  const [form] = Form.useForm()
  const [cfg,setCfg]=useState<any>({})
  async function load(){ const r=await api().get('/api/market'); setCfg(r.data); form.setFieldsValue(r.data) }
  async function save(v:any){ await api().post('/api/market',v); message.success('Saved'); load() }
  useEffect(()=>{ load() },[])
  return (<Card title="Cấu hình tiêu chuẩn & thị trường">
    <Form form={form} layout="vertical" onFinish={save}>
      <Form.Item label="EVFTA (JSON)" name="evfta"><Input.TextArea rows={4}/></Form.Item>
      <Form.Item label="CPTPP (JSON)" name="cptpp"><Input.TextArea rows={4}/></Form.Item>
      <Form.Item label="EU DPP (JSON)" name="eu_dpp"><Input.TextArea rows={4}/></Form.Item>
      <Form.Item label="UFLPA (JSON)" name="uflpa"><Input.TextArea rows={4}/></Form.Item>
      <Button htmlType="submit" type="primary">Save</Button>
    </Form>
  </Card>)
}

function SupplierDirectory(){
  const [items,setItems]=useState<any[]>([]); const [q,setQ]=useState('')
  const [form]=Form.useForm()
  async function load(){ const r=await api().get('/api/suppliers',{ params: q?{q}:{}}); setItems(r.data.items||[]) }
  async function create(v:any){ await api().post('/api/suppliers', v); message.success('Created'); form.resetFields(); load() }
  useEffect(()=>{ load() },[])
  return (<Card title="Danh sách nhà cung cấp">
    <div style={{marginBottom:8}}><Input placeholder='search supplier' value={q} onChange={e=>setQ(e.target.value)} style={{width:240, marginRight:8}}/><Button onClick={load}>Search</Button></div>
    <Form form={form} layout="inline" onFinish={create} style={{marginBottom:8}}>
      <Form.Item name="code" rules={[{required:true}]}><Input placeholder="code"/></Form.Item>
      <Form.Item name="name" rules={[{required:true}]}><Input placeholder="name"/></Form.Item>
      <Form.Item name="country"><Input placeholder="country"/></Form.Item>
      <Button htmlType="submit" type="primary">Add</Button>
    </Form>
    <Table rowKey="id" size="small" dataSource={items} columns={[
      {title:'ID',dataIndex:'id',width:60},
      {title:'Code',dataIndex:'code'},
      {title:'Name',dataIndex:'name'},
      {title:'Country',dataIndex:'country'}
    ]}/>
  </Card>)
}

function LedgerViewer(){
  const [fab,setFab]=useState<any[]>([])
  const [poly,setPoly]=useState<any[]>([])
  async function load(){ const [a,b] = await Promise.all([api().get('/api/ledger/fabric'), api().get('/api/ledger/polygon')]); setFab(a.data.items||[]); setPoly(b.data.items||[])}
  useEffect(()=>{ load() },[])
  return (<div>
    <Card title="Fabric Events"><Table rowKey="id" size="small" dataSource={fab} columns={[
      {title:'ID',dataIndex:'id',width:60},{title:'Tx',dataIndex:'tx_id'},{title:'Block',dataIndex:'block'},{title:'Chaincode',dataIndex:'chaincode'},{title:'Event',dataIndex:'event'}
    ]}/></Card>
    <Card title="Polygon Logs" style={{marginTop:12}}><Table rowKey="id" size="small" dataSource={poly} columns={[
      {title:'ID',dataIndex:'id',width:60},{title:'Tx',dataIndex:'tx_hash'},{title:'Method',dataIndex:'method'}
    ]}/></Card>
  </div>)
}

function Dashboard(){
  const [adm,setAdm]=useState<any>({})
  useEffect(()=>{ api().get('/api/dashboard/admin').then(r=>setAdm(r.data)) },[])
  return (<Card title="Admin Dashboard">
    <pre>{JSON.stringify(adm,null,2)}</pre>
  </Card>)
}

export default function AdminPortal(){
  return (<div className="container">
    <Tabs items={[
      {key:'dashboard',label:'Dashboard',children:<Dashboard/>},
      {key:'standards',label:'Standards/Market',children:<Standards/>},
      {key:'suppliers',label:'Supplier Directory',children:<SupplierDirectory/>},
      {key:'ledger',label:'Blockchain Ledger',children:<LedgerViewer/>},
    ]}/>
  </div>)
}
