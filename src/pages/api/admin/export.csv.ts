import type { APIRoute } from 'astro';
import { getAdminFromRequest } from '../../../lib/auth';
import { listOffert, type Offert } from '../../../lib/offert';

export const prerender = false;

const COLUMNS: Array<[string, (o: Offert) => string]> = [
  ['Ärendenummer', (o) => o.id],
  ['Datum', (o) => new Date(o.ts).toISOString()],
  ['Källa', (o) => o.source || 'offert'],
  ['Status', (o) => o.status],
  ['Namn', (o) => o.namn],
  ['Företag', (o) => o.foretag || ''],
  ['E-post', (o) => o.epost],
  ['Telefon', (o) => o.telefon || ''],
  ['Produkt', (o) => o.produkt || ''],
  ['Upplaga', (o) => o.upplaga || ''],
  ['Deadline', (o) => o.deadline || ''],
  ['Fillänk', (o) => o.filLank || ''],
  ['Meddelande', (o) => o.meddelande || ''],
  ['IP', (o) => o.ip || ''],
];

function csvCell(v: string): string {
  // Escape enligt RFC 4180
  const needsQuote = v.includes(',') || v.includes('"') || v.includes('\n') || v.includes('\r') || v.includes(';');
  const escaped = v.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = await getAdminFromRequest(cookies);
  if (!admin) return new Response('Ej inloggad', { status: 401 });

  const filter = url.searchParams.get('source');
  const all = await listOffert(1000);
  const rows = filter ? all.filter((o) => (o.source || 'offert') === filter) : all;

  const header = COLUMNS.map(([k]) => csvCell(k)).join(',');
  const body = rows
    .map((o) => COLUMNS.map(([, fn]) => csvCell(fn(o))).join(','))
    .join('\r\n');
  const csv = '﻿' + header + '\r\n' + body; // BOM för Excel-vänlig UTF-8

  const today = new Date().toISOString().slice(0, 10);
  const suffix = filter ? `-${filter}` : '';
  const filename = `norrmalm-offert${suffix}-${today}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
};
