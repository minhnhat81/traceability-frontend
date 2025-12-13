
import { useEffect, useState } from 'react'
import { Card, Table, Form, Input, Button, message } from 'antd'
import { api } from '../api'

export default function Customers(){
  const [items,setItems]=useState<any[]>([])
  const [q,setQ]=useState('')
  const [form]=Form.useForm()

  async function load(){ const r = await api().get('/api/customers',{ params: q?{q}:{}}); setItems(r.data.items||[]) }
  async function create(v:any){ await api().post('/api/customers', v); message.success('Created'); form.resetFields(); load() }
  async function update(row:any){ await api().put('/api/customers/'+row.id, row); message.success('Updated'); load() }
  async function remove(row:any){ await api().delete('/api/customers/'+row.id); message.success('Deleted'); load() }

  useEffect(()=>{ load() },[])

  return (<div className="container">
    <Card className="card" title="Customers">
      <div style={{marginBottom:8}}>
        <Input placeholder="search (code/name/country)" style={{width:240, marginRight:8}} value={q} onChange={e=>setQ(e.target.value)} />
        <Button onClick={load}>Search</Button>
      </div>
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
        {title:'Country',dataIndex:'country'},
        {title:'Actions',render:(_:any,row:any)=>(<div style={{display:'flex',gap:4}}>
          <Button size="small" onClick={()=>update({...row})}>Save</Button>
          <Button size="small" danger onClick={()=>remove(row)}>Delete</Button>
        </div>)}
      ]}/>
    </Card>
  </div>)
}
