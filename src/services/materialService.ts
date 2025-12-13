// src/services/materialService.ts
import { api } from '@/api'

// TypeScript interfaces
export interface Material {
  id?: number
  tenant_id: number
  name: string
  scientific_name?: string
  stages?: string[] | string
  dpp_notes?: string
}

// 🧩 Get all materials (filtered by tenant)
export const getMaterials = async (tenant_id: number) => {
  try {
    const res = await api().get<Material[]>("/materials/", {
      params: { tenant_id },
    })
    return res.data
  } catch (err) {
    console.error("[MaterialService] getMaterials error:", err)
    throw err
  }
}

// 🧩 Create new material
export const createMaterial = async (data: Material) => {
  try {
    const res = await api().post<Material>("/materials/", data)
    return res.data
  } catch (err) {
    console.error("[MaterialService] createMaterial error:", err)
    throw err
  }
}

// 🧩 Update existing material
export const updateMaterial = async (id: number, data: Material, tenant_id: number) => {
  try {
    const res = await api().put<Material>(`/materials/${id}`, data, {
      params: { tenant_id },
    })
    return res.data
  } catch (err) {
    console.error("[MaterialService] updateMaterial error:", err)
    throw err
  }
}

// 🧩 Delete material
export const deleteMaterial = async (id: number, tenant_id: number) => {
  try {
    const res = await api().delete(`/materials/${id}`, {
      params: { tenant_id },
    })
    return res.data
  } catch (err) {
    console.error("[MaterialService] deleteMaterial error:", err)
    throw err
  }
}
