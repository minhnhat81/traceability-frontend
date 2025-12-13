
import { useEffect, useState } from 'react'
import { Card, Input, Button, Table } from 'antd'
import { api } from '../api'

export default function AuditViewer(){
  // calendar heatmap per year
  const [days,setDays]=useState(30)
  const [endpoint,setEndpoint]=useState('')
  const [userId,setUserId]=useState<number|undefined>(undefined)
  const [stats,setStats]=useState<any>({daily:[],top_endpoints:[],top_users:[]})

  async function load(){
    const r = await api().get('/api/audit/stats',{ params: { days, endpoint: endpoint||undefined, user_id: userId||undefined }})
    setStats(r.data || {daily:[],top_endpoints:[],top_users:[]})
  }
  useEffect(()=>{ load() },[])

  return (<div className="container">
    <Card className="card" title="Audit Viewer">
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <Input style={{width:180}} placeholder="endpoint contains" value={endpoint} onChange={e=>setEndpoint(e.target.value)} />
        <Input style={{width:120}} placeholder="user id" value={userId||''} onChange={e=>setUserId(e.target.value?parseInt(e.target.value):undefined)} />
        <Input style={{width:100}} placeholder="days" value={days} onChange={e=>setDays(parseInt(e.target.value||'30'))} />
        <Button onClick={load} type="primary">Refresh</Button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12}}>
        <Card size="small" title="Timeline (per day)">
          <div style={{display:'flex', alignItems:'flex-end', gap:4, height:120}}>
            {stats.daily.map((d:any,i:number)=>(
              <div key={i} title={d.date+': '+d.count} style={{width:10, background:'#1677ff', height: Math.max(2, d.count*4)}} />
            ))}
          </div>
        </Card>
        <Card size="small" title="Top endpoints">
          <Table size="small" rowKey="endpoint" pagination={false} dataSource={stats.top_endpoints} columns={[
            {title:'Endpoint', dataIndex:'endpoint'}, {title:'Count', dataIndex:'count'}
          ]}/>
        </Card>
        <Card size="small" title="Top users">
          <Table size="small" rowKey="user_id" pagination={false} dataSource={stats.top_users} columns={[
            {title:'User', dataIndex:'user_id'}, {title:'Count', dataIndex:'count'}
          ]}/>
        </Card>
      </div>
    </Card>
  </div>)
}


function CalendarHeatmap({days}:{days:any[]}){
  // days: [{date:'YYYY-MM-DD', count:number}]
  const byDate = new Map(days.map((d:any)=>[d.date, d.count]))
  const start = new Date(new Date().getFullYear(),0,1)
  const cells = []
  for(let i=0;i<366;i++){
    const dt = new Date(start.getTime()+i*86400000)
    const key = dt.toISOString().slice(0,10)
    const c = byDate.get(key)||0
    const shade = c>20?4:c>10?3:c>5?2:c>0?1:0
    cells.push(<div key={key} title={key+': '+c} style={{width:10,height:10,background: ['#eee','#cfe2ff','#9ec5fe','#6ea8fe','#3d8bfd'][shade], margin:1}}/>)
  }
  return <div style={{display:'flex', flexWrap:'wrap', width: 80* (12/12)}}>{cells}</div>
}
