
import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card } from 'antd'

export default function AdminDashboard(){
  const [data,setData]=useState<any>({})
  useEffect(()=>{ api().get('/api/dashboard/admin').then(r=>setData(r.data)) },[])
  return (<div className="container">
    <Card className="card" title="Admin Dashboard (Emission/Origin/Compliance - stub)">
      <pre>{JSON.stringify(data,null,2)}</pre>
    </Card>
  </div>)
}
