import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Diagnostik-endpoint: skickar ett testmail via Resend och returnerar
// råsvaret som JSON. Skyddad med MAIL_TEST_KEY-env-var. Ingen KV-skrivning,
// inget kund-flöde, ingen sidoeffekt utöver själva Resend-anropet.
//
// Anrop:
//   GET /api/mail-test?to=DIN@MAIL.SE&key=DINHEMLIGHET
//
// Svaret innehåller antingen { ok: true, id: "..." } från Resend eller
// { ok: false, error: {...} } med exakt fel-meddelande + statuskod.

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const key = url.searchParams.get('key') || '';
  const to = url.searchParams.get('to') || '';
  const expectedKey = import.meta.env.MAIL_TEST_KEY;

  if (!expectedKey) {
    return json({ ok: false, error: 'MAIL_TEST_KEY är inte satt i env — sätt den i Vercel så aktiveras denna endpoint.' }, 500);
  }
  if (key !== expectedKey) {
    return json({ ok: false, error: 'Fel eller saknad ?key' }, 401);
  }
  if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
    return json({ ok: false, error: 'Ogiltig ?to-adress' }, 400);
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.RESEND_FROM || 'Norrmalmstryckeriet <noreply@norrmalmstryckeriet.se>';

  const diagnostics = {
    RESEND_API_KEY_set: Boolean(apiKey),
    RESEND_API_KEY_prefix: apiKey ? apiKey.slice(0, 6) + '…' : null,
    RESEND_FROM: from,
    OFFERT_TO_env: import.meta.env.OFFERT_TO || '(fallback: tryckeri@norrmalmstryckeriet.se)',
    to,
    now: new Date().toISOString(),
  };

  if (!apiKey) {
    return json({ ok: false, error: 'RESEND_API_KEY saknas i env', diagnostics });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      subject: `Testmail från Norrmalmstryckeriet-siten — ${new Date().toLocaleString('sv-SE')}`,
      html: `<p>Detta är ett testmail från <code>/api/mail-test</code>.</p>
             <p>Om detta kommer fram fungerar hela Resend-kedjan (nyckel, från-adress, domänverifiering).</p>
             <p>Om det inte kommer fram men Resend säger OK — då är det din mottagares filter (Exchange/M365) som stoppar det.</p>`,
      text: 'Testmail från Norrmalmstryckeriet-siten. Om detta kommer fram fungerar Resend.',
    });

    if (result.error) {
      return json({
        ok: false,
        stage: 'resend-error',
        resend_error: result.error,
        diagnostics,
      });
    }

    return json({
      ok: true,
      stage: 'resend-accepted',
      resend_id: result.data?.id,
      diagnostics,
      note: 'Resend har accepterat mailet. Kolla nu Resend-loggen (resend.com/emails) och mottagarens inkorg + karantän + skräppost.',
    });
  } catch (err) {
    const e = err as Error & { statusCode?: number; name?: string };
    return json({
      ok: false,
      stage: 'exception',
      error: {
        name: e.name,
        message: e.message,
        statusCode: e.statusCode ?? null,
      },
      diagnostics,
    });
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
