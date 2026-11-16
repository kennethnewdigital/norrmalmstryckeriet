import type { APIRoute } from 'astro';
import { getAdminFromRequest } from '../../../lib/auth';
import { listOffert, isAdLead, type Offert } from '../../../lib/offert';

export const prerender = false;

// Offline-konverteringsimport till Google Ads.
//
// Filen laddas upp under Mål → Konverteringar → Uppladdningar. Formatet är
// Googles egna mall för "Konverteringar från klick":
//
//   Parameters:TimeZone=Europe/Stockholm
//   Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency
//
// Konverteringsåtgärden i Google Ads måste vara skapad med källan
// "Importera → Andra datakällor eller CRM-system → Spåra konverteringar
// från klick", och namnet måste stämma exakt med CONVERSION_NAME nedan.
//
// Endast förfrågningar med ett klick-id tas med — övriga går inte att
// attribuera och ska inte laddas upp.

const CONVERSION_NAME =
  import.meta.env.GADS_OFFLINE_CONVERSION_NAME || 'Offertförfrågan (import)';

// Google kräver ett värde i mallen. Vi mäter inte affärsvärde här, så
// varje förfrågan får samma vikt. Sätt GADS_OFFLINE_CONVERSION_VALUE om
// ni senare vill ge dem ett uppskattat värde.
const CONVERSION_VALUE = import.meta.env.GADS_OFFLINE_CONVERSION_VALUE || '1';
const CURRENCY = 'SEK';

/** Google vill ha "yyyy-MM-dd HH:mm:ss" i den tidszon som anges överst. */
function formatTime(ts: number): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(ts));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

function csvCell(v: string): string {
  const needsQuote = /[",\n\r;]/.test(v);
  return needsQuote ? `"${v.replace(/"/g, '""')}"` : v;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = await getAdminFromRequest(cookies);
  if (!admin) return new Response('Ej inloggad', { status: 401 });

  // ?days=30 begränsar till de senaste N dagarna. Google accepterar inte
  // konverteringar äldre än konverteringsperioden, så en gräns är praktisk.
  const days = Number(url.searchParams.get('days') || '0');
  const cutoff = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;

  const all = await listOffert(1000);
  const rows = all
    .filter(isAdLead)
    .filter((o: Offert) => o.ts >= cutoff)
    .sort((a, b) => a.ts - b.ts);

  const lines = [
    'Parameters:TimeZone=Europe/Stockholm',
    ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency']
      .map(csvCell)
      .join(','),
    ...rows.map((o) =>
      [o.gclid!, CONVERSION_NAME, formatTime(o.ts), CONVERSION_VALUE, CURRENCY]
        .map(csvCell)
        .join(',')
    ),
  ];

  const today = new Date().toISOString().slice(0, 10);
  const suffix = days > 0 ? `-${days}d` : '';

  return new Response(lines.join('\r\n'), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="google-ads-konverteringar${suffix}-${today}.csv"`,
      'cache-control': 'no-store',
    },
  });
};
