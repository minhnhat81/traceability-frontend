export const API_URL = import.meta.env.VITE_API_URL;

async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)) }

export async function apiFetch<T>(path: string, init: RequestInit = {}, retries = 2): Promise<T> {
  const url = `${API_URL}${path}`;
  let lastErr: any;
  for (let i=0;i<=retries;i++){
    try{
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(init.headers||{}) },
        credentials: 'include',
        ...init,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json() as T;
    }catch(e){
      lastErr = e;
      if (i<retries) await sleep(300*(i+1));
    }
  }
  throw lastErr;
}
