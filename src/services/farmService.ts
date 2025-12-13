import { api } from '@/api'

const client = api()

export interface Farm {
  id?: number
  name: string
  code?: string
  gln?: string
  location?: any
  size_ha?: number
  certification?: any
  contact_info?: any
  farm_type?: string
  status?: string
  extra_data?: any
  created_at?: string
}

export async function getFarms(): Promise<Farm[]> {
  const res = await client.get('/api/farms/')
  // Backend trả về {"items": [...]} → lấy res.data.items nếu có
  return res.data.items || res.data || []
}

export async function createFarm(payload: Farm): Promise<Farm> {
  const res = await client.post('/api/farms', payload)
  return res.data
}

export async function updateFarm(id: number, payload: Partial<Farm>): Promise<Farm> {
  const res = await client.put(`/api/farms/${id}`, payload)
  return res.data
}

export async function deleteFarm(id: number): Promise<void> {
  await client.delete(`/api/farms/${id}`)
}
