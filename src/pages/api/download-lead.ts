import type { APIRoute } from 'astro';
import { saveLead, generateLeadId, type DownloadLead } from '../../lib/leads';
import { sendMail, escapeHtml } from '../../lib/mail';

export const prerender = false;

// Katalog över tillåtna guider — en whitelist som binder slug till PDF-fil + titel.
// Håller /downloads/ som public-sökväg men förhindrar att nån POSTar en godtycklig
// path och trollar fram leads.
const GUIDES: Record<string, { title: string; pdf: string }> = {
  'affischer-guide-infographic':      { title: 'Affischer – guide',           pdf: '/downloads/affischer-guide-infographic.pdf' },
  'arsredovisning-guide-infographic': { title: 'Årsredovisning – guide',      pdf: '/downloads/arsredovisning-guide-infographic.pdf' },
  'blad-guide-infographic':           { title: 'Blad/flyers – guide',         pdf: '/downloads/blad-guide-infographic.pdf' },
  'bocker-guide-infographic':         { title: 'Böcker – guide',              pdf: '/downloads/bocker-guide-infographic.pdf' },
  'broschyrer-guide-infographic':     { title: 'Broschyrer – guide',          pdf: '/downloads/broschyrer-guide-infographic.pdf' },
  'digitaltryck-guide-infographic':   { title: 'Digitaltryck – guide',        pdf: '/downloads/digitaltryck-guide-infographic.pdf' },
  'foldrar-guide-infographic':        { title: 'Foldrar – guide',             pdf: '/downloads/foldrar-guide-infographic.pdf' },
  'industritryck-guide-infographic':  { title: 'Industritryck – guide',       pdf: '/downloads/industritryck-guide-infographic.pdf' },
  'kuvert-guide-infographic':         { title: 'Kuvert – guide',              pdf: '/downloads/kuvert-guide-infographic.pdf' },
  'mappar-infographic':               { title: 'Mappar – guide',              pdf: '/downloads/mappar-infographic.pdf' },
  'massmaterial-guide-infographic':   { title: 'Roll-ups & mässmaterial – guide', pdf: '/downloads/massmaterial-guide-infographic.pdf' },
  'offsettryck-guide-infographic':    { title: 'Offsettryck – guide',         pdf: '/downloads/offsettryck-guide-infographic.pdf' },
  'papper-guide-infographic':         { title: 'Papper – guide',              pdf: '/downloads/papper-guide-infographic.pdf' },
  'storformat-guide-infographic':     { title: 'Storformat – guide',          pdf: '/downloads/storformat-guide-infographic.pdf' },
  'varfor-trycksaker-gor-skillnad':   { title: 'Varför trycksaker gör skillnad', pdf: '/downloads/varfor-trycksaker-gor-skillnad.pdf' },
  'visitkort-guide-infographic':      { title: 'Visitkort – guide',           pdf: '/downloads/visitkort-guide-infographic.pdf' },
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    const form = contentType.includes('application/json')
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());

    const namn = str(form.name) || str(form.namn) || '';
    const epost = String(form.email || form.epost || '').trim().toLowerCase();
    const foretag = str(form.company) || str(form.foretag);
    const roll = str(form.role) || str(form.roll);
    const newsletter = form.newsletter === 'on' || form.newsletter === true || form.newsletter === 'true';
    const guideSlug = String(form.guide || '').trim();
    const sourceUrl = str(form.source);

    if (!namn || namn.trim() === '') {
      return json({ ok: false, error: 'Ange ditt namn.' }, 400);
    }
    if (!epost || !/^\S+@\S+\.\S+$/.test(epost)) {
      return json({ ok: false, error: 'Ogiltig e-postadress.' }, 400);
    }
    const guide = GUIDES[guideSlug];
    if (!guide) {
      return json({ ok: false, error: 'Okänd guide.' }, 400);
    }

    const lead: DownloadLead = {
      id: generateLeadId(),
      ts: Date.now(),
      namn: namn.trim().slice(0, 200),
      epost,
      foretag,
      roll,
      newsletter,
      guide: guideSlug,
      guideTitle: guide.title,
      pdfPath: guide.pdf,
      source: sourceUrl,
      ip: clientAddress || '',
      ua: request.headers.get('user-agent') || '',
      status: 'ny',
    };

    await saveLead(lead);

    const LEAD_TO = import.meta.env.OFFERT_TO || 'tryckeri@norrmalmstryckeriet.se';

    // Notis till tryckeri@
    try {
      await sendMail({
        to: LEAD_TO,
        reply_to: lead.epost,
        subject: `Lead ${lead.id} — ${lead.namn} laddade ner ${lead.guideTitle}`,
        html: renderLeadEmail(lead),
      });
    } catch (err) {
      console.error('Failed to send lead notification:', err);
    }

    // Bekräftelse till kund med nedladdningslänk
    try {
      await sendMail({
        to: lead.epost,
        subject: `Din tryckguide: ${lead.guideTitle}`,
        html: renderCustomerEmail(lead),
      });
    } catch (err) {
      console.error('Failed to send customer confirmation:', err);
    }

    return json({ ok: true, downloadUrl: lead.pdfPath, id: lead.id });
  } catch (err) {
    console.error('download-lead POST error:', err);
    return json({ ok: false, error: 'Något gick fel. Försök igen eller ring 08-96 01 35.' }, 500);
  }
};

function str(v: unknown, max = 300): string | undefined {
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

function renderLeadEmail(l: DownloadLead): string {
  const rows: Array<[string, string | undefined]> = [
    ['Namn', l.namn],
    ['E-post', l.epost],
    ['Företag', l.foretag],
    ['Roll', l.roll],
    ['Guide', l.guideTitle],
    ['Nyhetsbrev', l.newsletter ? 'JA — vill ha utskick' : 'nej'],
    ['Från sida', l.source],
  ];
  const rowsHtml = rows
    .filter(([, v]) => v)
    .map(([k, v]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#666;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;color:#222;">${escapeHtml(v!)}</td></tr>`
    )
    .join('');
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:640px;">
      <div style="background:#F3F4F6;border-left:4px solid #D9222A;padding:16px 20px;margin:0 0 20px 0;">
        <p style="margin:0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;font-weight:500;">Nedladdnings-lead</p>
        <p style="margin:4px 0 0 0;color:#222;font-size:22px;font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(l.id)}</p>
        <p style="margin:6px 0 0 0;color:#666;font-size:13px;">${new Date(l.ts).toLocaleString('sv-SE')}</p>
      </div>
      <h2 style="font-weight:400;font-size:22px;margin:0 0 20px 0;color:#222;">Ny nedladdning</h2>
      <table style="border-collapse:collapse;width:100%;">${rowsHtml}</table>
      <hr style="border:0;border-top:1px solid #eee;margin:24px 0;" />
      <p style="color:#888;font-size:12px;">Svara direkt på detta mejl för att kontakta kunden. Lead-id <strong>${escapeHtml(l.id)}</strong> finns i admin → Nedladdnings-leads.</p>
    </div>`;
}

function renderCustomerEmail(l: DownloadLead): string {
  const siteUrl = 'https://www.norrmalmstryckeriet.se';
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;">
      <h2 style="font-weight:400;font-size:22px;margin:0 0 16px 0;color:#222;">Din tryckguide är här</h2>
      <p style="color:#333;font-size:15px;line-height:1.6;">Hej ${escapeHtml(l.namn.split(' ')[0])},</p>
      <p style="color:#333;font-size:15px;line-height:1.6;">Tack för att du laddade ner <strong>${escapeHtml(l.guideTitle)}</strong>. Du hittar den här:</p>
      <p style="margin:24px 0;"><a href="${siteUrl}${l.pdfPath}" style="display:inline-block;background:#D9222A;color:white;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:500;font-size:15px;">Öppna guiden (PDF)</a></p>
      <p style="color:#333;font-size:15px;line-height:1.6;">Har du frågor om din trycksak, hör av dig så pratar vi — <strong>08-96 01 35</strong> eller svara på detta mejl.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:24px 0;" />
      <p style="color:#888;font-size:12px;">Norrmalmstryckeriet · Hammarbacken 4A, Häggvik · Sollentuna</p>
    </div>`;
}
