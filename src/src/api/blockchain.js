import axios from "axios";

// Lấy URL backend từ biến môi trường (.env)
const API_URL = import.meta.env.VITE_API_URL;

export async function anchorBatch(tenantId, bundleId, batchHash) {
  const payload = {
    tenant_id: tenantId,
    bundle_id: bundleId,
    batch_hash: batchHash,
  };

  console.log("🚀 Sending to backend:", API_URL, payload);

  const res = await axios.post(`${API_URL}/blockchain/anchor`, payload);
  return res.data;
}
