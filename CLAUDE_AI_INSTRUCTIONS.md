# Custom Instructions för Claude.ai Projects

Klistra in denna text i fältet **"Custom instructions"** när du skapar projektet på claude.ai:

---

You are working on the Norrmalmstryckeriet website — a Stockholm-based printing company's site built in Astro 5 + Tailwind CSS v4.

**Project context:**
- Repo: `kennethnewdigital/norrmalmstryckeriet`
- Live: `https://norrmalmstryckeriet.vercel.app`
- Template reference (Elementor): `https://stg-norrmalmstryckeriet-staging.kinsta.cloud/broschyrer_new/`
- Always read `CLAUDE.md` in the repo first — it contains the complete design system rules.

**Hard rules:**
1. **Margins are always 44px** (not 34px) — `mx-[44px]` everywhere
2. **Use the `.btn-pill` class for buttons**, never inline button styles
3. **Hero is rounded with margins** — `mx-[44px] mt-[66px] rounded-[50px]`, NOT full-width
4. **Vår expertis section is wrapped in a rounded dark container** — `mx-[44px] rounded-[50px] bg-[#222]`
5. **Form inputs are rectangular** — `rounded-[4px]`, not pill-shaped
6. **Match the template at `/broschyrer_new/` 1:1** — when in doubt, inspect it via dev tools
7. **Product pages follow this order**: Hero → Varför → Vad vill du uppnå (sidoscroll) → Hur vi jobbar → Varför inte webbshop → Vår expertis → Kundcitat → FAQ → Hjälp+form → Kundreferenser → Nyheter
8. **Copy comes from `.docx` files** at `/JOBB_2026/NORRMALMSTRYCKERIET_2026/NEW_COPY_WEB/` — don't invent content

**When building new product pages:**
- Use `src/pages/produkter/broschyrer.astro` or `blad.astro` as templates
- Replace the data arrays (scenarios, faqs, testimonials, expertise) with copy from the docx
- Keep all visual styling identical
- Each scenario card uses inline "Vår rekommendation:" (not a separate boxed section)

**Color palette:**
- Red: `#D9222A`
- Dark text/bg: `#222`
- Inner dark cards: `#313131`
- Section gray bg: `#F3F3F3`
- Card gray bg: `#F5F5F5`
- Form input bg: `#FDFDFD`

**Typography classes (in `src/styles/global.css`):**
Use `.typo-hero`, `.typo-quote`, `.typo-section-title`, `.typo-process-number`, `.typo-carousel-heading`, `.typo-card-title` — they have correct clamp values.

**Critical**: Commits must be authored by `kennethnewdigital` for Vercel to deploy. The git config in the repo is already set correctly.

When the user asks to build a new product page, ALWAYS:
1. Read the docx copy first
2. Reference `broschyrer.astro` for structure
3. Run `npm run build` to verify
4. Push commits authored by `kennethnewdigital`

---

# Steg-för-steg: Sätta upp Claude.ai Projects

## 1. Logga in på claude.ai
Gå till https://claude.ai

## 2. Skapa Project
- Klicka på **"Projects"** i vänstermenyn
- Klicka **"Create project"**
- Namn: `Norrmalmstryckeriet`
- Beskrivning: `Astro + Tailwind site for norrmalmstryckeriet.se`

## 3. Lägg till Custom Instructions
- I projektet, klicka **"Set custom instructions"**
- Klistra in texten OVAN (mellan `---` strecken)
- Spara

## 4. Anslut GitHub (om tillgängligt på ditt konto)
- Klicka **"Add to project knowledge"** → **"Connect GitHub"**
- Auktorisera Claude att läsa repot
- Välj repo: `kennethnewdigital/norrmalmstryckeriet`
- ✅ Klart — Claude kan nu se hela kodbasen

## 5. Om GitHub-koppling inte är tillgänglig — ladda upp filer manuellt

Klicka **"Add to project knowledge"** och ladda upp dessa filer (i prioritetsordning):

### Måste ha (kärnfiler):
1. `CLAUDE.md` — projektguide
2. `src/styles/global.css` — designsystem
3. `src/pages/produkter/broschyrer.astro` — mall för produktsidor
4. `src/pages/produkter/blad.astro` — annan mall
5. `src/pages/index.astro` — startsidan
6. `src/components/Header.astro`
7. `src/components/Footer.astro`
8. `src/layouts/Layout.astro`
9. `package.json`
10. `tailwind.config.mjs` (om det finns)
11. `astro.config.mjs`

### Bra att ha (referensmaterial):
- Alla `.docx`-filer från `/JOBB_2026/NORRMALMSTRYCKERIET_2026/NEW_COPY_WEB/`
- Skärmdumpar från staging-mallen
