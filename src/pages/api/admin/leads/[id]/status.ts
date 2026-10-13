import type { APIRoute } from 'astro';
import { getAdminFromRequest } from '../../../../../lib/auth';
import { updateLeadStatus, type DownloadLead } from '../../../../../lib/leads';

export const prerender = false;

const VALID: DownloadLead['status'][] = ['ny', 'kontaktad', 'arkiverad'];

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const admin = await getAdminFromRequest(cookies);
  if (!admin) return json({ ok: false, error: 'Ej inloggad.' }, 401);

  const id = String(params.id || '');
  const body = await request.json().catch(() => ({}));
  const status = String(body.status || '') as DownloadLead['status'];
  if (!VALID.includes(status)) return json({ ok: false, error: 'Ogiltig status.' }, 400);

  try {
    await updateLeadStatus(id, status);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 400);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
