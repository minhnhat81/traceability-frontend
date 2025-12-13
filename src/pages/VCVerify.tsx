
import { useState } from 'react'
import { api } from '../api'
import { Card, Input, Button } from 'antd'

export default function VCVerify(){
  const [jws,setJws]=useState('')
  const [pub,setPub]=useState('') // base64 raw ed25519
  const [res,setRes]=useState<any>(null)
  async function verify(){ const r = await api().post('/api/vc/verify',{ jws, public_key_base64: pub }); setRes(r.data) }
  return (<div className="container">
    <Card className="card" title="VC Verify (DID/JWS - demo with raw Ed25519)">
      <Input placeholder="public_key_base64" value={pub} onChange={e=>setPub(e.target.value)} style={{marginBottom:8}}/>
      <Input.TextArea placeholder="detached JWS: header..signature" rows={4} value={jws} onChange={e=>setJws(e.target.value)} />
      <div style={{marginTop:8}}><Button onClick={verify} type="primary">Verify</Button></div>
      <pre>{JSON.stringify(res,null,2)}</pre>
    </Card>
  </div>)
}
