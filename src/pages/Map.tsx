
import { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps'
import { Card } from 'antd'
import { api } from '../api'

export default function SupplyMap(){
  const [data,setData]=useState<{nodes:any[],links:any[]}>({nodes:[],links:[]})
  useEffect(()=>{ api().get('/api/map/flows').then(r=>setData(r.data)) },[])
  return (<div className="container">
    <Card className="card" title="Supply Chain Map">
      <ComposableMap projectionConfig={{ scale: 150 }}>
        <Geographies geography="/world-110m.json">
          {({ geographies }) => geographies.map(geo => <Geography key={geo.rsmKey} geography={geo} />)}
        </Geographies>
        {data.nodes.map((n,i)=>(<Marker key={i} coordinates={[n.lon,n.lat]}><circle r={3}/><text y={-10} fontSize={8}>{n.name}</text></Marker>))}
        {data.links.map((l,i)=>{
          const a = data.nodes.find(n=>n.id===l.from); const b = data.nodes.find(n=>n.id===l.to)
          if(!a||!b) return null
          return <Line key={i} from={[a.lon,a.lat]} to={[b.lon,b.lat]} strokeWidth={1}/>
        })}
      </ComposableMap>
    </Card>
  </div>)
}
