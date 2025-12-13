import { api } from "@/api"; // phải đúng alias tới src/api.ts

const client = api();

/** Kiểu dữ liệu khớp backend */
export interface Batch {
  id?: number;
  code: string;
  product_code?: string; // ✅ không bắt buộc
  unit?: string;         // ✅ thêm mới
  quantity?: number;   // ✅ mới
  // 4 cấp (tuỳ backend có hay không)
  farm_batch_code?: string;
  supplier_batch_code?: string;
  manufacturer_batch_code?: string;
  brand_batch_code?: string;

  farm_batch_id?: number;
  supplier_batch_id?: number;
  manufacturer_batch_id?: number;
  brand_batch_id?: number;

  mfg_date?: string;
  country?: string;
  qty?: number;
  status?: string;
  parent_batch_id?: number | null;
  blockchain_tx_hash?: string | null;
  material_type?: string | null;
  description?: string | null;
  origin_farm_id?: number | null;
  farm_id?: number | null;
  supplier_id?: number | null;
  source_epcis_id?: number | null;
  certificates?: any;
  origin?: any;
  created_at?: string;
}

export type BatchCreate = Omit<Batch, "id" | "created_at">;
export type BatchUpdate = Partial<Omit<Batch, "id" | "created_at">> & {};

/** GET /api/batches/ (backend trả {items:[...]}) */
export async function getBatches(level?: string, tenant_id?: number): Promise<Batch[]> {
  const res = await client.get("/api/batches/", {
    params: { level, tenant_id }, // backend không dùng cũng không sao
  });
  const data = res.data;
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getBatchById(id: number): Promise<Batch> {
  const res = await client.get(`/api/batches/${id}`);
  return res.data;
}

export async function createBatch(payload: BatchCreate): Promise<any> {
  const res = await client.post("/api/batches/", payload);
  return res.data;
}

export async function updateBatch(id: number, payload: BatchUpdate): Promise<any> {
  const res = await client.put(`/api/batches/${id}`, payload);
  return res.data;
}

export async function deleteBatch(id: number) {
  const res = await api().delete(`/api/batches/${id}/force_delete`);
  return res.data;
}


