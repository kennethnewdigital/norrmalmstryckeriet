import { kv } from './kv';

// Download-lead: separata rader i KV, helt skilt från offert-flödet.
// Admin har egen flik för dessa — ska inte blandas med offertförfrågningar.

export type DownloadLead = {
  id: string;
  ts: number;
  namn: string;
  epost: string;
  foretag?: string;
  roll?: string;
  newsletter: boolean;
  guide: string;              // t.ex. "foldrar-guide-infographic"
  guideTitle: string;         // t.ex. "Foldrar — tryckguide"
  pdfPath: string;            // "/downloads/foldrar-guide-infographic.pdf"
  source?: string;            // sidan de kom från
  ip?: string;
  ua?: string;
  status: 'ny' | 'kontaktad' | 'arkiverad';
};

const LIST_KEY = 'lead:download:list';
const LEAD_KEY = (id: string) => `lead:download:${id}`;

export async function saveLead(l: DownloadLead): Promise<void> {
  await kv.set(LEAD_KEY(l.id), l);
  await kv.lpush(LIST_KEY, l.id);
}

export async function listLeads(limit = 500): Promise<DownloadLead[]> {
  const ids = await kv.lrange(LIST_KEY, 0, limit - 1);
  const items = await Promise.all(ids.map((id) => kv.get<DownloadLead>(LEAD_KEY(id))));
  return items.filter((x): x is DownloadLead => x != null);
}

export async function getLead(id: string): Promise<DownloadLead | null> {
  return kv.get<DownloadLead>(LEAD_KEY(id));
}

export async function updateLeadStatus(id: string, status: DownloadLead['status']): Promise<void> {
  const cur = await getLead(id);
  if (!cur) throw new Error('Lead not found');
  await kv.set(LEAD_KEY(id), { ...cur, status });
}

export async function deleteLead(id: string): Promise<void> {
  await kv.del(LEAD_KEY(id));
  await kv.lrem(LIST_KEY, 0, id);
}

export function generateLeadId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8);
  return `L${y}${m}${day}-${rand}`;
}
