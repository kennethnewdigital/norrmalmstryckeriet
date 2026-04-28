# Norrmalmstryckeriet — Project Guide for Claude

This is the official project guide. Always read this file first before making changes.

## Project Overview

- **Site**: norrmalmstryckeriet.se (Stockholm-based printing company)
- **Live URL**: https://norrmalmstryckeriet.vercel.app
- **Tech**: Astro 5 + Tailwind CSS v4 (`@tailwindcss/vite`)
- **Repo**: github.com/kennethnewdigital/norrmalmstryckeriet
- **Hosting**: Vercel (auto-deploys on push to `main`)

## Design Reference (Always Match This)

The pixel-perfect template for **product subpages** is:
🎯 **https://stg-norrmalmstryckeriet-staging.kinsta.cloud/broschyrer_new/**

This is the **only** correct visual reference. The original Elementor build that
must be replicated 1:1 in Astro.

The reference for the **homepage** is:
🎯 **https://stg-norrmalmstryckeriet-staging.kinsta.cloud/**

## Critical Design System Rules

### Margins
- **All site margins are `44px`** on left and right (not 34px)
- Hero, sections, carousels — all use `mx-[44px]` or `ml-[44px]/mr-[44px]`
- This matches the Elementor template's `44.16px` global margin

### Typography
- **Headings (Georgia)**: `var(--font-heading)` = `Georgia, "Times New Roman", serif`
- **Body (Arial)**: `var(--font-body)` = `Arial, Helvetica, sans-serif`
- **UI/Buttons (Inter)**: `var(--font-ui)` = `Inter, -apple-system, "system-ui", sans-serif`

Section heading sizes (matches template):
- H1 (e.g. "Hjälp?"): clamp 56px → 100px
- H2 main (Hero, Quote, "Vad vill du uppnå?"): clamp 32px → 72px, ls -2.16px, lh 75.6px
- H2 section: clamp 32px → 64px
- H3 carousel headings: clamp 22px → 48px
- Card title H3 (in scenario cards): **28px line-height 28px** (tight)
- Vår expertis card titles: **32px line-height 40px**
- Process step heading: 26px line-height 1.2

Section labels (uppercase):
- font-size **12px**, letter-spacing **1.8px**, font-weight 500

### Buttons
Use the `.btn-pill` class — it has correct values from template:
- `font-family: Inter`, `font-size: 16px`, `line-height: 16px`
- `font-weight: 500`, `letter-spacing: -0.3px`
- `padding: 16px 32px`, `border-radius: 100px`

Variants:
- `.btn-pill .btn-red` → red bg `#D9222A` (also #DC2626 in some places)
- `.btn-pill .btn-dark` → dark bg `#222`
- Outlined white: `style="background: transparent;"` + `border-2 border-white text-white`

### Colors
- Primary red: `#D9222A`
- Dark text: `#222`
- Body text: `#333` / `#444` / `#555`
- Section bg gray: `#F3F3F3`
- Card bg gray: `#F5F5F5`
- Dark section bg: `#222` (NOT `#1F1F1F`)
- Inner dark cards: `#313131` (NOT `#2A2A2A`)
- Divider: `#D5D8DC`
- Form input bg: `#FDFDFD`

### Border Radius
- Hero, Vår expertis dark wrap, News section: **`50px`**
- Inner dark cards (Vår expertis): **`25px`**
- Scenario cards, reference cards: **`16px`**
- Form inputs: **`4px`** (NOT pill — these are rectangular)
- Pill buttons: `100px`

## Product Page Template Structure

ALL product pages follow this exact structure (see `src/pages/produkter/broschyrer.astro` and `blad.astro` as reference):

1. **Hero** — `mx-[44px] mt-[66px] rounded-[50px]` with bg image, gradient overlay
   - Category label (uppercase 12px ls 1.8px)
   - H1 (Georgia 72px)
   - Body paragraph
   - Two CTAs: red `.btn-pill .btn-red` + outlined ring button
   - Trust strip: "100+ år / ÅR AV ERFARENHET", "1000+ / UPPDRAG ÅRLIGEN", Svanen logo + "SVANENMÄRKT"

2. **Varför [produkt]?** — Quote section, full-width with `mx-[44px]`
   - Label (uppercase)
   - 2-column grid: H2 italic mix on left, paragraph + bullet list + dark Offertförfrågan on right

3. **Vad vill du uppnå?** — Sidoscroll-kort
   - Label, H2, intro paragraph
   - Horizontal carousel with `ml-[44px] pr-[44px]`
   - Cards: `w-[380px] bg-[#F5F5F5] rounded-[16px] p-[43px] min-h-[482px]`
   - Card title: 28px Georgia tight line-height
   - "Vår rekommendation:" inline bold
   - Prev/next buttons (gray + dark)

4. **Hur vi jobbar** — Centered
   - Label, H2 centered
   - 3-column grid with serif numbers (1. 2. 3.)
   - `.typo-process-number` class for numbers

5. **Varför inte webbshop** — Gray section `bg-[#F3F3F3]`
   - 2-column grid

6. **Vår expertis** — Dark rounded section
   - `mx-[44px] rounded-[50px] bg-[#222] py-[110px]`
   - Inner cards: `bg-[#313131] rounded-[25px] p-[39px]`
   - Card title H3: 32px line-height 40px white
   - Items: `<strong>Term</strong> – description` (no bullets)

7. **Kundcitat** — Centered, white bg
   - Single quote layout OR carousel with dots if multiple
   - Dots: `bg-[#D5D8DC]` inactive, `bg-[#222]` active
   - Auto-advance every 6 seconds

8. **FAQ** — Accordion
   - H2 + small subtitle ("Har du fler frågor? Ring 08-96 01 35")
   - Items use `.faq-toggle` class
   - Plus icon **red** `text-[#D9222A]`, fa-plus-circle SVG
   - Question text: bold

9. **Hjälp? + Formulär** — Gray section `bg-[#F3F3F3]` (this is part of "footer" per user)
   - 2-column grid
   - Left: "Hjälp?" 100px serif + "Berätta om..." H3 + paragraph + Tel/Email/Address
   - Right: form with 5 fields
   - Form inputs: `bg-[#FDFDFD] rounded-[4px] py-[14px] px-[16px] text-[18px]`
   - Submit button: `.btn-pill` white bg, dark text

10. **Kundreferenser** — Carousel (same as homepage)
    - Cards `w-[600px] h-[350px] rounded-[16px]`

11. **Nyheter** — Red rounded section (same as homepage)
    - `mx-[44px] rounded-[50px] bg-[#D9222A]`
    - 3 article cards in grid

## File Structure

```
src/
├── components/
│   ├── Header.astro       — Site header with menu
│   └── Footer.astro       — Site footer
├── layouts/
│   └── Layout.astro       — Base layout (wraps with Header + Footer)
├── pages/
│   ├── index.astro        — Homepage
│   └── produkter/
│       ├── broschyrer.astro  — Product page template (REFERENCE)
│       └── blad.astro        — Blad/reklamblad/flyers
└── styles/
    └── global.css         — Design tokens + typography classes
```

## Typography Utility Classes (in global.css)

Use these for consistency:
- `.typo-hero` — Hero H1 (clamp 30px → 72px)
- `.typo-quote` — Quote section H2 (matches Hero H2 size)
- `.typo-section-title` — Section H2 (clamp 28px → 64px)
- `.typo-process-number` — Big serif numbers 1. 2. 3. (clamp 60px → 146px)
- `.typo-carousel-heading` — Carousel section H3 (clamp 22px → 48px)
- `.typo-card-title` — Card titles
- `.typo-process-sub` — Process H4 (clamp 18px → 32px)
- `.typo-feature-heading` — Two-column feature H2
- `.typo-news-title` — News card H4
- `.typo-ref-name` — Reference card name overlay

## Workflow

1. **Make changes** to source files
2. **Test locally**: `npm run build` (must pass)
3. **Commit** with descriptive message
4. **Push** to `main` — Vercel auto-deploys in ~60 seconds
5. **Verify** at https://norrmalmstryckeriet.vercel.app

### Git Author Important
Commits must be authored by `kennethnewdigital` (set in git config) so Vercel
will deploy. If commits show `kennethdigitaliq` as author, Vercel blocks the
deploy because that user isn't in the Vercel team.

## When Building New Pages

Always follow these rules:

1. **Read the source copy** (provided as `.docx` from
   `/JOBB_2026/NORRMALMSTRYCKERIET_2026/NEW_COPY_WEB/`)
2. **Use 8 sections** in the order above (Hero through Nyheter)
3. **Match `/broschyrer_new/` template** for visual design
4. **Use 44px margins** consistently
5. **Use `.btn-pill` class** for buttons (never inline button styles)
6. **Use typography utility classes** when possible
7. **Run `npm run build`** before committing to catch syntax errors
8. **Reference `broschyrer.astro` or `blad.astro`** as templates

## Inspecting the Template

If you need exact values from the live template, use Chrome MCP:
1. Navigate to `https://stg-norrmalmstryckeriet-staging.kinsta.cloud/broschyrer_new/`
2. Use `javascript_exec` to inspect computed styles
3. Apply exact values to your code

Common values extracted from template:
- Section margins: `0 44.16px 0 44.15px`
- Hero: padding `0 0 0 88.31px`, margin `66.23px 0 0 44.15px`, br `50px`
- Scenario cards: `380px wide, padding 43px, min-height 482px, br 16px`
- Vår expertis dark cards: `padding 39px, br 25px`

## Common Pitfalls

- ❌ Don't use `mx-[34px]` — should be `mx-[44px]`
- ❌ Don't use `font-[var(--font-ui,Inter)]` (broken syntax) — use `.btn-pill` class
- ❌ Don't make hero full-width — it's rounded with margins
- ❌ Don't make Vår expertis full-width — it's rounded dark container
- ❌ Don't use round form inputs — they should be `rounded-[4px]` rectangles
- ❌ Don't put `Vår rekommendation` in a separate boxed section — it's inline
- ❌ Don't use `#1F1F1F` for dark bg — it's `#222`
- ❌ Don't use `#2A2A2A` for inner cards — it's `#313131`
