import { kv } from './kv';

export type Offert = {
  id: string;
  ts: number;
  namn: string;
  foretag?: string;
  epost: string;
  telefon?: string;
  produkt?: string;
  upplaga?: string;
  deadline?: string;
  meddelande?: string;
  filLank?: string;
  source?: string; // t.ex. "offert" eller "produkt-mappar"
  ip?: string;
  ua?: string;
  status: 'ny' | 'hanterad' | 'arkiverad';
};

const LIST_KEY = 'offert:list';
const OFFERT_KEY = (id: string) => `offert:${id}`;

export async function saveOffert(o: Offert): Promise<void> {
  await kv.set(OFFERT_KEY(o.id), o);
  await kv.lpush(LIST_KEY, o.id);
}

export async function listOffert(limit = 200): Promise<Offert[]> {
  const ids = await kv.lrange(LIST_KEY, 0, limit - 1);
  const items = await Promise.all(ids.map((id) => kv.get<Offert>(OFFERT_KEY(id))));
  return items.filter((x): x is Offert => x != null);
}

export async function getOffert(id: string): Promise<Offert | null> {
  return kv.get<Offert>(OFFERT_KEY(id));
}

export async function updateOffertStatus(id: string, status: Offert['status']): Promise<void> {
  const cur = await getOffert(id);
  if (!cur) throw new Error('Offert not found');
  await kv.set(OFFERT_KEY(id), { ...cur, status });
}

export async function deleteOffert(id: string): Promise<void> {
  await kv.del(OFFERT_KEY(id));
  await kv.lrem(LIST_KEY, 0, id); // ta bort alla förekomster av id ur listan
}

export function generateId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${y}${m}${day}-${rand}`;
}
