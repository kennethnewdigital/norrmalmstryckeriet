/**
 * Minimal Vercel KV (Upstash Redis) REST client — used to store
 * form submissions and admin login codes.
 */
const url = () => import.meta.env.KV_REST_API_URL;
const token = () => import.meta.env.KV_REST_API_TOKEN;

async function fetchKv(path: string, init: RequestInit = {}) {
  const base = url();
  const t = token();
  if (!base || !t) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not configured');
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`KV ${path} → ${res.status} ${body}`);
  }
  return res.json();
}

export const kv = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const r = await fetchKv(`/get/${encodeURIComponent(key)}`);
    if (r.result == null) return null;
    try {
      return JSON.parse(r.result) as T;
    } catch {
      return r.result as T;
    }
  },
  async set<T = unknown>(key: string, value: T, opts?: { ex?: number }): Promise<void> {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    // Upstash REST: pipeline-format ["SET", key, value, "EX", ttl]
    const args: (string | number)[] = ['SET', key, payload];
    if (opts?.ex) args.push('EX', opts.ex);
    await fetchKv('/', { method: 'POST', body: JSON.stringify([args]) });
  },
  async del(key: string): Promise<void> {
    await fetchKv('/', { method: 'POST', body: JSON.stringify([['DEL', key]]) });
  },
  async lpush(key: string, value: string): Promise<void> {
    await fetchKv('/', { method: 'POST', body: JSON.stringify([['LPUSH', key, value]]) });
  },
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const r = await fetchKv(`/lrange/${encodeURIComponent(key)}/${start}/${stop}`);
    return (r.result || []) as string[];
  },
  async llen(key: string): Promise<number> {
    const r = await fetchKv(`/llen/${encodeURIComponent(key)}`);
    return Number(r.result || 0);
  },
};
