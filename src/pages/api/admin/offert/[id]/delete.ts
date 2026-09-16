import type { APIRoute } from 'astro';
import { getAdminFromRequest } from '../../../../../lib/auth';
import { deleteOffert, getOffert } from '../../../../../lib/offert';

export const prerender = false;

async function handle({ params, cookies }: Parameters<APIRoute>[0]) {
  const admin = await getAdminFromRequest(cookies);
  if (!admin) return json({ ok: false, error: 'Ej inloggad.' }, 401);

  const id = String(params.id || '');
  try {
    const cur = await getOffert(id);
    if (!cur) return json({ ok: false, error: 'Ärendet finns inte.' }, 404);
    await deleteOffert(id);
    return json({ ok: true, id });
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 400);
  }
}

export const DELETE: APIRoute = handle;
export const POST: APIRoute = handle;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
