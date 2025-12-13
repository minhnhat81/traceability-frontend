
import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Input, Button, Table } from 'antd'

export default function Customs(){
  const [batch,setBatch]=useState('LOT-0001')
  const [product,setProduct]=useState('TSHIRT')
  const [items,setItems]=useState<any[]>([])
  const [dpp,setDpp]=useState<any>(null)

  async function load(){
    const r = await api().get('/api/customs/search',{ params: { batch_code: batch||undefined, product_code: product||undefined }})
    setItems(r.data.items||[])
    const t = await api().get('/api/dpp/'+product+'/render')
    setDpp(t.data)
  }
  useEffect(()=>{ load() },[])

  return (<div className="container">
    <Card className="card" title="Customs Portal">
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <Input style={{width:220}} placeholder="batch code" value={batch} onChange={e=>setBatch(e.target.value)} />
        <Input style={{width:220}} placeholder="product code" value={product} onChange={e=>setProduct(e.target.value)} />
        <Button onClick={load} type="primary">Search</Button>
        <a className="ant-btn" href={`${import.meta.env.VITE_API_URL||'http://localhost:8022'}/api/customs/export?batch_code=${batch}`} target="_blank">Export ZIP</a>
      </div>
      <Table rowKey="id" size="small" dataSource={items} columns={[
        {title:'Batch', dataIndex:'batch_code'},
        {title:'Product', dataIndex:'product_code'},
        {title:'Country', dataIndex:'country'},
        {title:'MfgDate', dataIndex:'mfg_date'},
      ]}/>
      <div style={{marginTop:12}}><b>DPP (rendered by template)</b><pre>{JSON.stringify(dpp,null,2)}</pre></div>
    </Card>
  </div>)
}
