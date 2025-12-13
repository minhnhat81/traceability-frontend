/* realtime anchor overlay */
import { useAnchorStream } from '../hooks/useAnchorStream'

import { useEffect, useState } from 'react'
import { Card, Form, Input, DatePicker, Button } from 'antd'
import { ComposableMap, Geographies, Geography, Line, Marker } from 'react-simple-maps'
import world from '../assets/world-min.json'
import { api } from '../api'
import dayjs from 'dayjs'

function toCoord(country?: string): [number,number] {
  // naive mapping for demo
  if(!country) return [0,0]
  const c = country.toUpperCase()
  if(c==='VN') return [106.7, 10.8]
  if(c==='TH') return [100.5, 13.7]
  if(c in {'US':1,'USA':1}) return [-98, 39]
  if(c==='CN') return [116.4, 39.9]
  return [0,0]
}

export default function SupplyChainMap(){
  const [batch,setBatch]=useState<string|undefined>('LOT-0001')
  const [range,setRange]=useState<any>([dayjs().add(-90,'day'), dayjs()])
  const [nodes,setNodes]=useState<any[]>([])
  const [flows,setFlows]=useState<any[]>([])

  async function load(){
    const params:any = {}
    if(batch) params.batch_code=batch
    if(range && range[0] && range[1]){
      params.date_from = range[0].toISOString()
      params.date_to = range[1].toISOString()
    }
    const [n,f] = await Promise.all([api().get('/api/map/nodes',{params}), api().get('/api/map/flows',{params})])
    setNodes(n.data.items||[]); setFlows(f.data.items||[])
  }

  useEffect(()=>{ load() },[])

  const markers = nodes.map((n:any,i:number)=>{
    let coord:[number,number]=[0,0]
    if(n.type==='supplier') coord = toCoord(n.country)
    if(n.type==='factory') coord = [0,0] // unknown, show at 0; extend DB with lat/lon to place accurately
    if(n.type==='port') coord = toCoord(n.country)
    return <Marker key={'m'+i} coordinates={coord as any}><circle r={3} /><text y={-8} fontSize={8}>{n.name||n.code}</text></Marker>
  })

  const lines = flows.map((e:any,i:number)=>{
    // parse "where" like SGLN or country code
    const parts = (e.from||'').split(':')
    const fromC = toCoord(parts[parts.length-1])
    const parts2 = (e.to||'').split(':')
    const toC = toCoord(parts2[parts2.length-1])
    return <Line key={'l'+i} from={fromC as any} to={toC as any} stroke="#555" />
  })

  return (<div className="container">
    <Card className="card" title="Supply Chain Map">
      <Form layout="inline" onFinish={load} style={{marginBottom:8}}>
        <Form.Item label="Batch">
          <Input value={batch} onChange={e=>setBatch(e.target.value||undefined)} placeholder="LOT-0001" style={{width:200}}/>
        </Form.Item>
        <Form.Item label="Date range">
          <DatePicker.RangePicker value={range} onChange={setRange}/>
        </Form.Item>
        <Button htmlType="submit" type="primary">Apply</Button>
      </Form>
      <ComposableMap projection="geoEqualEarth" width={900} height={420}>
        <Geographies geography={world as any}>
          {({ geographies }) => geographies.map(geo => <Geography key={geo.rsmKey} geography={geo} fill="#F2F2F2" stroke="#DDD" />)}
        </Geographies>
        {markers}
        {lines}
      </ComposableMap>
    </Card>
  </div>)
}
