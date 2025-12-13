
import { useState } from 'react'
import { api } from '../api'
import { Input, Button, Card } from 'antd'

export default function Consumer(){
  const [code,setCode]=useState('TSHIRT')
  const [data,setData]=useState<any>(null)
  async function scan(){ const r = await api().get('/api/consumer/scan',{ params: { code } }); setData(r.data) }
  return (<div className="container">
    <Card className="card" title="Scan QR / Digital Product Passport">
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <Input style={{width:260}} value={code} onChange={e=>setCode(e.target.value)} placeholder="product code or EPC"/>
        <Button onClick={scan}>Scan</Button>
      </div>
      <pre>{JSON.stringify(data,null,2)}</pre>
    </Card>
  </div>)
}
