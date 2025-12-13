import { api } from '@/api'

const client = api() // ✅ tạo instance dùng chung

export const getSuppliers = async (q?: string) => {
  const res = await client.get('/api/suppliers', { params: q ? { q } : {} })
  return res.data
}

export const getSupplierOptions = async () => {
  const res = await client.get('/api/suppliers/options')
  return res.data
}

export const createSupplier = async (data: any) => {
  const res = await client.post('/api/suppliers', data)
  return res.data
}

export const updateSupplier = async (id: number, data: any) => {
  const res = await client.put(`/api/suppliers/${id}`, data)
  return res.data
}

export const deleteSupplier = async (id: number) => {
  await client.delete(`/api/suppliers/${id}`)
}
