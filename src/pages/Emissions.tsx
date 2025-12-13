
import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Form, Input, Button, Table, message } from 'antd'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Emissions(){
  const [f1]=Form.useForm(); const [f2]=Form.useForm()
  const [factors,setFactors]=useState<any[]>([])
  const [records,setRecords]=useState<any[]>([])
  const [stats,setStats]=useState<any>({by_scope:[]})

  async function loadAll(){
    const a = api()
    const [fa,re,st] = await Promise.all([a.get('/api/emissions/factors'), a.get('/api/emissions/records'), a.get('/api/emissions/stats')])
    setFactors(fa.data.items||[]); setRecords(re.data.items||[]); setStats(st.data||{by_scope:[]})
  }
  useEffect(()=>{ loadAll() },[])

  async function addFactor(v:any){ await api().post('/api/emissions/factors', v); message.success('Added'); f1.resetFields(); loadAll() }
  async function addRecord(v:any){ await api().post('/api/emissions/records', v); message.success('Added'); f2.resetFields(); loadAll() }

  return (<div className="container">
    <Card className="card" title="Emission Factors (Scope 1/2/3)">
      <Form form={f1} layout="inline" onFinish={addFactor} style={{marginBottom:8}}>
        <Form.Item name="name" rules={[{required:true}]}><Input placeholder="name"/></Form.Item>
        <Form.Item name="scope" rules={[{required:true}]}><Input placeholder="scope (1|2|3)"/></Form.Item>
        <Form.Item name="factor" rules={[{required:true}]}><Input placeholder="factor kgCO2e/unit"/></Form.Item>
        <Form.Item name="unit" rules={[{required:true}]}><Input placeholder="unit"/></Form.Item>
        <Form.Item name="source"><Input placeholder="source"/></Form.Item>
        <Button type="primary" htmlType="submit">Add</Button>
      </Form>
      <Table rowKey="id" size="small" dataSource={factors} columns={[
        {title:'ID',dataIndex:'id',width:60},{title:'Name',dataIndex:'name'},{title:'Scope',dataIndex:'scope'},{title:'Factor',dataIndex:'factor'},{title:'Unit',dataIndex:'unit'},{title:'Source',dataIndex:'source'}
      ]}/>
    </Card>
    <Card className="card" title="Emission Records">
      <Form form={f2} layout="inline" onFinish={addRecord} style={{marginBottom:8}}>
        <Form.Item name="scope" rules={[{required:true}]}><Input placeholder="scope (1|2|3)"/></Form.Item>
        <Form.Item name="activity" rules={[{required:true}]}><Input placeholder="activity"/></Form.Item>
        <Form.Item name="quantity" rules={[{required:true}]}><Input placeholder="quantity"/></Form.Item>
        <Form.Item name="unit"><Input placeholder="unit"/></Form.Item>
        <Form.Item name="factor"><Input placeholder="factor"/></Form.Item>
        <Button type="primary" htmlType="submit">Add</Button>
      </Form>
      <Table rowKey="id" size="small" dataSource={records} columns={[
        {title:'ID',dataIndex:'id',width:60},{title:'Scope',dataIndex:'scope'},{title:'Activity',dataIndex:'activity'},{title:'Qty',dataIndex:'quantity'},{title:'Unit',dataIndex:'unit'},{title:'Factor',dataIndex:'factor'}
      ]}/>
    </Card>
    <Card className="card" title="Emissions Chart">
      <div style={{width:'100%', height:300}}>
        <ResponsiveContainer>
          <BarChart data={stats.by_scope || []}><XAxis dataKey="scope"/><YAxis/><Tooltip/><Bar dataKey="tco2e"/></BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </div>)
}
