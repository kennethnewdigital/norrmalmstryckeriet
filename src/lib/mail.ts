import { Resend } from 'resend';

function client() {
  const key = import.meta.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

function fromAddress() {
  return import.meta.env.RESEND_FROM || 'Norrmalmstryckeriet <noreply@norrmalmstryckeriet.se>';
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
}) {
  const r = await client().emails.send({
    from: fromAddress(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.reply_to,
  });
  if (r.error) throw new Error(`Resend: ${r.error.message}`);
  return r.data;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
