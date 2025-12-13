
import { useEffect, useState } from 'react'
import { Card, Tree, Form, Input, Button, Table, message } from 'antd'
import { api } from '../api'

export default function RoleManager(){
  const [roles,setRoles]=useState<any[]>([])
  const [scopes,setScopes]=useState<any[]>([])
  const [form]=Form.useForm()
  const [sform]=Form.useForm()

  async function load(){
    try{
      const [r,s] = await Promise.all([api().get('/api/rbac/roles'), api().get('/api/rbac/scopes')])
      setRoles(r.data.items||[]); setScopes(s.data.items||[])
    }catch{}
  }
  async function addRole(v:any){ await api().post('/api/rbac/roles', v); message.success('Role created'); form.resetFields(); load() }
  async function addScope(v:any){ await api().post('/api/rbac/scopes', v); message.success('Scope created'); sform.resetFields(); load() }
  async function delRole(row:any){ await api().delete('/api/rbac/roles/'+row.id); message.success('Deleted'); load() }
  async function delScope(row:any){ await api().delete('/api/rbac/scopes/'+row.id); message.success('Deleted'); load() }

  useEffect(()=>{ load() },[])

  const treeData = scopes.map((sc:any)=>({ key: 'scope-'+sc.id, title: sc.name || sc.id, children:[
    sc.product_code?{key:'p-'+sc.id,title:'Product: '+sc.product_code}:null,
    sc.batch_code?{key:'b-'+sc.id,title:'Batch: '+sc.batch_code}:null,
  ].filter(Boolean)}))

  return (<div className="container">
    <Card className="card" title="Role & Scope Manager">
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Card size="small" title="Create Role">
          <Form form={form} layout="inline" onFinish={addRole}>
            <Form.Item name="name" rules={[{required:true}]}><Input placeholder="role name"/></Form.Item>
            <Form.Item name="description"><Input placeholder="description"/></Form.Item>
            <Button htmlType="submit" type="primary">Add</Button>
          </Form>
          <Table rowKey="id" size="small" dataSource={roles} columns={[
            {title:'ID',dataIndex:'id',width:60},
            {title:'Name',dataIndex:'name'},
            {title:'Description',dataIndex:'description'},
            {title:'',render:(_:any,row:any)=>(<Button size="small" danger onClick={()=>delRole(row)}>Delete</Button>)}
          ]}/>
        </Card>
        <Card size="small" title="Create Scope">
          <Form form={sform} layout="inline" onFinish={addScope}>
            <Form.Item name="name" rules={[{required:true}]}><Input placeholder="scope name"/></Form.Item>
            <Form.Item name="product_code"><Input placeholder="product_code"/></Form.Item>
            <Form.Item name="batch_code"><Input placeholder="batch_code"/></Form.Item>
            <Button htmlType="submit" type="primary">Add</Button>
          </Form>
          <Tree treeData={treeData} defaultExpandAll />
          <Table rowKey="id" size="small" dataSource={scopes} columns={[
            {title:'ID',dataIndex:'id',width:60},
            {title:'Name',dataIndex:'name'},
            {title:'Product',dataIndex:'product_code'},
            {title:'Batch',dataIndex:'batch_code'},
            {title:'',render:(_:any,row:any)=>(<Button size="small" danger onClick={()=>delScope(row)}>Delete</Button>)}
          ]}/>
        </Card>
      </div>
    </Card>
  </div>)
}
