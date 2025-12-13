import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface AnchorPayload {
  tenant_id: number;
  bundle_id: string;
  batch_hash: string;
  mode?: "real" | "mock";
}

export async function publishToBlockchain(payload: AnchorPayload) {
  const res = await axios.post(`${API_URL}/api/blockchain/publish`, payload);
  return res.data;
}

export async function verifyOnChain(batchCode: string) {
  const res = await axios.post(`${API_URL}/api/blockchain/verify`, { batch_code: batchCode });
  return res.data;
}

export async function getBlockchainProof(batchCode: string) {
  const res = await axios.get(`${API_URL}/api/blockchain/proof`, { params: { batch_code: batchCode } });
  return res.data;
}

export async function getEPCISEvents(batchCode: string) {
  const res = await axios.get(`${API_URL}/api/epcis/events`, { params: { batch_code: batchCode } });
  return res.data;
}
