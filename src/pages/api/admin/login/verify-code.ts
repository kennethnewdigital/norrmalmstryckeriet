import type { APIRoute } from 'astro';
import { isAdminEmail, signAdminJwt, setAdminCookie } from '../../../../lib/auth';
import { kv } from '../../../../lib/kv';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();

    if (!email || !code) {
      return json({ ok: false, error: 'Ange e-post och kod.' }, 400);
    }
    if (!isAdminEmail(email)) {
      return json({ ok: false, error: 'Fel kod.' }, 401);
    }

    const stored = await kv.get<string>(`admin:code:${email}`);
    if (!stored || stored !== code) {
      return json({ ok: false, error: 'Fel eller utgången kod.' }, 401);
    }

    await kv.del(`admin:code:${email}`);

    const token = await signAdminJwt(email);
    setAdminCookie(cookies, token);

    return json({ ok: true });
  } catch (err) {
    console.error('verify-code error:', err);
    return json({ ok: false, error: 'Något gick fel.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
