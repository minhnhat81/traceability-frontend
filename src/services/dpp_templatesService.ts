// traceability/web/src/api/dppTemplates.ts
import { api } from '../api'

export type DppTemplate = {
  id: number
  name: string
  tier: string
  template_name: string
  product_id?: number | null
  description?: string | null
  static_data: any
  dynamic_data: any
  schema: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function listDppTemplates(q?: string) {
  const res = await api().get<DppTemplate[]>('/api/dpp-templates', { params: { q } })
  return res.data
}
export async function getDppTemplate(id: number) {
  const res = await api().get<DppTemplate>(`/api/dpp-templates/${id}`)
  return res.data
}
export async function createDppTemplate(payload: Partial<DppTemplate>) {
  const res = await api().post<DppTemplate>('/api/dpp-templates', payload)
  return res.data
}
export async function updateDppTemplate(id: number, payload: Partial<DppTemplate>) {
  const res = await api().put<DppTemplate>(`/api/dpp-templates/${id}`, payload)
  return res.data
}
export async function deleteDppTemplate(id: number) {
  const res = await api().delete(`/api/dpp-templates/${id}`)
  return res.data
}
