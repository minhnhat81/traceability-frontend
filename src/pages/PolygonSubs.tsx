
import { useEffect, useState } from 'react'
import { Card, Table, Button, Select, message } from 'antd'
import { api } from '../api'

export default function PolygonSubs(){
  const [abis,setAbis]=useState<any[]>([])
  const [events,setEvents]=useState<string[]>([])
  const [abiId,setAbiId]=useState<number|undefined>(undefined)
  const [subs,setSubs]=useState<any[]>([])
  useEffect(()=>{ load() },[])

  async function load(){
    const [a,s] = await Promise.all([api().get('/api/polygon/abis'), api().get('/api/polygon/subscriptions')])
    setAbis(a.data.items||[]); setSubs(s.data.items||[])
  }
  async function pickAbi(v:number){
    setAbiId(v); const r = await api().get(`/api/polygon/abi/${v}/events`); setEvents(r.data.events||[])
  }
  async function addSub(ev:string){
    await api().post('/api/polygon/subscriptions',{ abi_id: abiId, event_name: ev }); message.success('Subscribed'); load()
  }
  async function toggle(row:any, en:boolean){
    await api().put('/api/polygon/subscriptions/'+row.id, {enabled: en}); message.success('Updated'); load()
  }

  return (<div className="container">
    <Card className="card" title="Polygon Subscriptions">
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <Select style={{width:320}} placeholder="Select ABI" onChange={pickAbi}
          options={abis.map((a:any)=>({label:`${a.name} (${a.address.slice(0,8)}...)`, value:a.id}))}/>
        <Select style={{width:280}} placeholder="Select event" options={events.map(e=>({label:e,value:e}))}/>
        <Button onClick={()=>{ const ev=(document.querySelector('.ant-select-selection-item') as any)?.title; if(ev) addSub(ev) }}>Subscribe</Button>
        <Button onClick={load}>Reload</Button>
      </div>
      <Table rowKey="id" size="small" dataSource={subs} columns={[
        {title:'ID', dataIndex:'id', width:60},
        {title:'ABI', dataIndex:'abi_name'},
        {title:'Address', dataIndex:'address'},
        {title:'Event', dataIndex:'event_name'},
        {title:'Enabled', render:(_:any,row:any)=>(<>
          <Button size="small" onClick={()=>toggle(row,true)}>Enable</Button>
          <Button size="small" danger onClick={()=>toggle(row,false)} style={{marginLeft:6}}>Disable</Button>
        </>)},
      ]}/>
    </Card>
  </div>)
}
