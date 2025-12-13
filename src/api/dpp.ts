// src/api/dpp.ts
import { api } from "../api";
import { DppResponse } from "../types/dpp";

// Gọi đúng endpoint backend: /api/public/dpp/{ref}?mode=full
export async function fetchDPP(ref: string): Promise<DppResponse> {
  const res = await api().get(
    `/api/public/dpp/${encodeURIComponent(ref)}`,
    { params: { mode: "full" } }
  );

  return res.data as DppResponse;
}
