
import { useEffect, useState } from 'react'
import { api } from '../api'
import { Input, Button, Table, Card, Form, message } from 'antd'

export default function Brand(){
  const [batch,setBatch]=useState('LOT-0001')
  const [events,setEvents]=useState<any[]>([])
  async function load(){ const r = await api().get('/api/epcis/events'); const all = r.data.items||[]; setEvents(all.filter((x:any)=>x.batch_code===batch)) }
  useEffect(()=>{ load() },[])

  async function checkFTA(){ const r = await api().post('/api/compliance/fta',{batch_code:batch}); message.info('FTA pass='+r.data.pass) }
  async function checkUFLPA(){ const r = await api().post('/api/compliance/uflpa',{batch_code:batch}); message.info('UFLPA pass='+r.data.pass) }

  return (<div className="container">
    <Card className="card" title="Batch Viewer">
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <Input style={{width:240}} value={batch} onChange={e=>setBatch(e.target.value)} placeholder="batch code"/>
        <Button onClick={load}>Reload</Button>
        <a className="ant-btn ant-btn-primary" href={`${import.meta.env.VITE_API_URL||'http://localhost:8022'}/api/export/pack.pdf?batch_code=${batch}`} target="_blank">Export PDF</a>
        <Button onClick={checkFTA}>Check FTA</Button>
        <Button onClick={checkUFLPA}>Check UFLPA</Button>
      </div>
      <Table rowKey="id" size="small" dataSource={events} columns={[
        {title:'Time',dataIndex:'event_time'},
        {title:'Type',dataIndex:'event_type'},
        {title:'Action',dataIndex:'action'},
        {title:'BizStep',dataIndex:'biz_step'},
        {title:'Disposition',dataIndex:'disposition'},
      ]}/>
    </Card>
    <Card className="card" title="Risk Indicators">
      <pre>(stub) Add real risk scoring here…</pre>
    </Card>
  </div>)
}
