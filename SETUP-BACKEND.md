# Backend-setup — Resend + KV + Admin

Steg-för-steg för att aktivera formulär-backend, mail och admin på Vercel.

## 1. Resend (email)

1. Skapa konto på https://resend.com
2. Lägg till domänen `norrmalmstryckeriet.se` under **Domains** → **Add Domain**
3. Lägg de DNS-poster Resend visar (MX/TXT) på hostingen där DNS för `.se`-domänen ligger
4. Vänta tills domänen är **Verified** (kan ta någon timme)
5. Skapa en API-nyckel: **API Keys** → **Create API Key** → kopiera nyckeln (`re_...`)

Om domänen inte kan verifieras direkt: använd tillfälligt `RESEND_FROM=onboarding@resend.dev`.

## 2. Vercel KV (Redis)

I Vercel Dashboard för projektet:

1. **Storage** → **Create Database** → välj **KV** (eller **Upstash Redis** — samma sak)
2. Namnge: `norrmalm-kv`
3. **Connect Project** → välj `norrmalmstryckeriet`
4. Vercel sätter automatiskt in `KV_REST_API_URL` och `KV_REST_API_TOKEN` som env-vars

## 3. Env-variabler på Vercel

Vercel Dashboard → **Settings** → **Environment Variables**. Lägg till (alla tre miljöer):

| Namn | Värde |
|---|---|
| `RESEND_API_KEY` | Din Resend-nyckel `re_...` |
| `RESEND_FROM` | `Norrmalmstryckeriet <noreply@norrmalmstryckeriet.se>` |
| `OFFERT_TO` | `tryckeri@norrmalmstryckeriet.se` |
| `ADMIN_EMAILS` | `kenneth@digitaliq.se,tryckeri@norrmalmstryckeriet.se` (kommaseparerad — vilka som får logga in) |
| `JWT_SECRET` | Slumpa 32+ tecken, t.ex. `openssl rand -base64 48` |
| `KV_REST_API_URL` | (auto från KV-integrationen) |
| `KV_REST_API_TOKEN` | (auto från KV-integrationen) |

## 4. Redeploy

Efter env-variablerna satts: **Deployments** → senaste → **Redeploy** för att aktivera dem.

## 5. Testa

- **Formulär**: https://norrmalmstryckeriet.vercel.app/offert — fyll i, skicka.
  - Mejl går till `tryckeri@norrmalmstryckeriet.se` (offert-notis) OCH kunden får bekräftelse
  - Data landar i KV (nyckel `offert:<id>`)
- **Admin**: https://norrmalmstryckeriet.vercel.app/admin/login
  - Ange e-post (måste finnas i `ADMIN_EMAILS`)
  - Kod mejlas — ange kod → dashboard visar alla förfrågningar

## 6. Vercel Fluid Compute

`@astrojs/vercel@10` använder Fluid Compute per default — inga edge-specifika begränsningar. Node.js-runtime, 300s timeout, allt fungerar med Resend + KV utan config.

## Felsökning

**"KV_REST_API_URL / KV_REST_API_TOKEN not configured"** — glömt att lägga in env-variablerna eller köra redeploy efter att de satts.

**"RESEND_API_KEY not configured"** — API-nyckel saknas eller inte satts i alla miljöer (Production/Preview/Development).

**Admin-koden kommer inte fram** — kolla att din e-post finns i `ADMIN_EMAILS` (komma-separerad, inga mellanslag runt).

**Från-adress fungerar inte** — Resend-domänen är inte verifierad. Använd tillfälligt `onboarding@resend.dev` som `RESEND_FROM` tills DNS är på plats.
