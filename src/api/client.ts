// src/api/client.ts
export const apiClient = {
  async get(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
};
