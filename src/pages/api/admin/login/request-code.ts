import type { APIRoute } from 'astro';
import { isAdminEmail, makeCode } from '../../../../lib/auth';
import { kv } from '../../../../lib/kv';
import { sendMail } from '../../../../lib/mail';

export const prerender = false;

const CODE_TTL = 60 * 10; // 10 min
const RL_TTL = 60; // 60s between requests

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return json({ ok: false, error: 'Ogiltig e-post.' }, 400);
    }

    // Anti-enum: always return ok so we don't reveal admin list
    if (!isAdminEmail(email)) {
      return json({ ok: true });
    }

    // Rate limit
    const rlKey = `admin:rl:${email}`;
    if (await kv.get(rlKey)) {
      return json({ ok: false, error: 'Vänta lite innan du begär ny kod.' }, 429);
    }
    await kv.set(rlKey, '1', { ex: RL_TTL });

    const code = makeCode();
    await kv.set(`admin:code:${email}`, code, { ex: CODE_TTL });

    await sendMail({
      to: email,
      subject: `Inloggningskod: ${code}`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;">
        <h2 style="font-weight:400;font-size:20px;color:#222;">Norrmalmstryckeriet admin</h2>
        <p style="color:#333;font-size:15px;">Din inloggningskod:</p>
        <p style="font-size:32px;letter-spacing:6px;font-weight:600;color:#222;margin:16px 0;">${code}</p>
        <p style="color:#666;font-size:13px;">Koden är giltig i 10 minuter. Om du inte begärde den — ignorera detta mejl.</p>
      </div>`,
      text: `Din inloggningskod: ${code}\n(Giltig i 10 min)`,
    });

    return json({ ok: true });
  } catch (err) {
    console.error('request-code error:', err);
    return json({ ok: false, error: 'Något gick fel.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
