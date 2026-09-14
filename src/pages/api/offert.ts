import type { APIRoute } from 'astro';
import { saveOffert, generateId, type Offert } from '../../lib/offert';
import { sendMail, escapeHtml } from '../../lib/mail';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    const form = contentType.includes('application/json')
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());

    // Support both the form's field names (firstname/lastname/email/phone/company/product/message)
    // and Swedish variants (namn/epost/telefon/foretag/produkt/meddelande).
    const firstname = str(form.firstname);
    const lastname = str(form.lastname);
    const namn = str(form.namn) || [firstname, lastname].filter(Boolean).join(' ') || '';
    const epost = String(form.epost || form.email || '').trim().toLowerCase();
    const foretag = str(form.foretag) || str(form.company);
    const telefon = str(form.telefon) || str(form.phone);
    const produkt = str(form.produkt) || str(form.product);
    const meddelande = str(form.meddelande, 5000) || str(form.message, 5000);
    const gdpr = form.gdpr === 'on' || form.gdpr === true || form.gdpr === 'true';

    if (!namn || namn.trim() === '') {
      return json({ ok: false, error: 'Ange ditt namn.' }, 400);
    }
    if (!epost || !/^\S+@\S+\.\S+$/.test(epost)) {
      return json({ ok: false, error: 'Ogiltig e-postadress.' }, 400);
    }
    if (!meddelande || meddelande.trim() === '') {
      return json({ ok: false, error: 'Beskriv projektet.' }, 400);
    }
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      if (!gdpr) return json({ ok: false, error: 'Godkänn integritetspolicyn.' }, 400);
    }

    const offert: Offert = {
      id: generateId(),
      ts: Date.now(),
      namn: namn.trim().slice(0, 200),
      foretag,
      epost,
      telefon,
      produkt,
      upplaga: str(form.upplaga),
      deadline: str(form.deadline),
      meddelande,
      filLank: str(form.filLank),
      ip: clientAddress || '',
      ua: request.headers.get('user-agent') || '',
      status: 'ny',
    };

    await saveOffert(offert);

    const OFFERT_TO = import.meta.env.OFFERT_TO || 'tryckeri@norrmalmstryckeriet.se';

    // Notification to Norrmalmstryckeriet
    try {
      await sendMail({
        to: OFFERT_TO,
        reply_to: offert.epost,
        subject: `Ny offertförfrågan från ${offert.namn}${offert.foretag ? ` (${offert.foretag})` : ''}`,
        html: renderOffertEmail(offert),
        text: renderOffertText(offert),
      });
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }

    // Confirmation to customer
    try {
      await sendMail({
        to: offert.epost,
        subject: 'Tack — vi har tagit emot din offertförfrågan',
        html: renderCustomerConfirmation(offert),
      });
    } catch (err) {
      console.error('Failed to send customer confirmation:', err);
    }

    return json({ ok: true, id: offert.id });
  } catch (err) {
    console.error('Offert POST error:', err);
    return json({ ok: false, error: 'Något gick fel. Ring 08-96 01 35 så hjälper vi dig direkt.' }, 500);
  }
};

function str(v: unknown, max = 500): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s ? s.slice(0, max) : undefined;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderOffertEmail(o: Offert): string {
  const rows: Array<[string, string | undefined]> = [
    ['Namn', o.namn],
    ['Företag', o.foretag],
    ['E-post', o.epost],
    ['Telefon', o.telefon],
    ['Produkt', o.produkt],
    ['Upplaga', o.upplaga],
    ['Deadline', o.deadline],
    ['Fillänk (WeTransfer/Sprend)', o.filLank],
    ['Meddelande', o.meddelande],
  ];
  const rowsHtml = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;color:#222;">${escapeHtml(v!)}</td></tr>`
    )
    .join('');
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:640px;">
      <h2 style="font-weight:400;font-size:22px;margin:0 0 20px 0;color:#222;">Ny offertförfrågan</h2>
      <p style="color:#555;font-size:14px;margin:0 0 16px 0;">ID: ${escapeHtml(o.id)} · ${new Date(o.ts).toLocaleString('sv-SE')}</p>
      <table style="border-collapse:collapse;width:100%;">${rowsHtml}</table>
      <hr style="border:0;border-top:1px solid #eee;margin:24px 0;" />
      <p style="color:#888;font-size:12px;">Svara direkt på detta mejl för att kontakta kunden.</p>
    </div>`;
}

function renderOffertText(o: Offert): string {
  return `Ny offertförfrågan (${o.id})
Datum: ${new Date(o.ts).toLocaleString('sv-SE')}

Namn: ${o.namn}
Företag: ${o.foretag ?? '-'}
E-post: ${o.epost}
Telefon: ${o.telefon ?? '-'}
Produkt: ${o.produkt ?? '-'}
Upplaga: ${o.upplaga ?? '-'}
Deadline: ${o.deadline ?? '-'}
Fillänk: ${o.filLank ?? '-'}

Meddelande:
${o.meddelande ?? '(inget)'}
`;
}

function renderCustomerConfirmation(o: Offert): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;">
      <h2 style="font-weight:400;font-size:22px;margin:0 0 16px 0;color:#222;">Tack — vi har tagit emot din offertförfrågan</h2>
      <p style="color:#333;font-size:15px;line-height:1.6;">Hej ${escapeHtml(o.namn.split(' ')[0])},</p>
      <p style="color:#333;font-size:15px;line-height:1.6;">Tack för din förfrågan. Vi återkommer så snart vi kan med en offert. Behöver du komma i kontakt tidigare — <strong>ring 08-96 01 35</strong>.</p>
      <p style="color:#666;font-size:13px;margin-top:24px;">Ärendenummer: ${escapeHtml(o.id)}</p>
      <hr style="border:0;border-top:1px solid #eee;margin:24px 0;" />
      <p style="color:#888;font-size:12px;">Norrmalmstryckeriet · Hammarbacken 4A, Häggvik · Sollentuna</p>
    </div>`;
}
