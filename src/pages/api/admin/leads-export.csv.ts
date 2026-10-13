import type { APIRoute } from 'astro';
import { getAdminFromRequest } from '../../../lib/auth';
import { listLeads } from '../../../lib/leads';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = await getAdminFromRequest(cookies);
  if (!admin) {
    return new Response('Ej inloggad', { status: 401 });
  }

  const guideFilter = url.searchParams.get('guide') || '';
  let items = await listLeads(10000);
  if (guideFilter) items = items.filter((i) => i.guide === guideFilter);

  const header = ['Lead-id', 'Datum', 'Status', 'Namn', 'Företag', 'E-post', 'Roll', 'Guide', 'Nyhetsbrev', 'Från sida', 'IP'];
  const rows = items.map((l) => [
    l.id,
    new Date(l.ts).toLocaleString('sv-SE'),
    l.status,
    l.namn,
    l.foretag || '',
    l.epost,
    l.roll || '',
    l.guideTitle,
    l.newsletter ? 'ja' : 'nej',
    l.source || '',
    l.ip || '',
  ]);

  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const bom = '﻿'; // UTF-8 BOM för Excel
  const filename = guideFilter
    ? `leads-${guideFilter}-${new Date().toISOString().slice(0, 10)}.csv`
    : `leads-alla-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(bom + csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
};
