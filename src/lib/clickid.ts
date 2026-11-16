// Klick-id från Google Ads (gclid/wbraid/gbraid).
//
// Syftet är att veta att en offertförfrågan kom från en annons, utan att
// sätta några annonscookies. Id:t ligger i webbadressen när besökaren
// landar från annonsen, sparas i sessionStorage så det överlever navigering
// inom besöket, och skickas med formuläret som ett vanligt fält.
//
// Ingen tredjepartslagring, ingen cookie, inget som ligger kvar efter att
// fliken stängts.

const STORAGE_KEY = 'nmt_click_id';

// wbraid/gbraid används av Google i stället för gclid när iOS-appspårning
// är begränsad. Ordningen är prioritetsordning.
const PARAMS = ['gclid', 'wbraid', 'gbraid'] as const;

export type ClickId = { type: (typeof PARAMS)[number]; value: string };

function readFromUrl(): ClickId | null {
  try {
    const q = new URLSearchParams(window.location.search);
    for (const type of PARAMS) {
      const value = q.get(type);
      if (value && value.length <= 200) return { type, value };
    }
  } catch (_) {}
  return null;
}

function readFromSession(): ClickId | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClickId;
    if (parsed && parsed.value && (PARAMS as readonly string[]).includes(parsed.type)) {
      return parsed;
    }
  } catch (_) {}
  return null;
}

/**
 * Fångar klick-id:t från URL:en om det finns där och sparar det för besöket.
 * Körs på varje sidvisning. Ett nytt id i URL:en skriver över det gamla —
 * det senaste klicket är det som gäller.
 */
export function captureClickId(): ClickId | null {
  const fromUrl = readFromUrl();
  if (fromUrl) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch (_) {}
    return fromUrl;
  }
  return readFromSession();
}

/** Hämtar klick-id:t utan att läsa om URL:en. */
export function getClickId(): ClickId | null {
  return readFromUrl() || readFromSession();
}

/**
 * Fyller i dolda fält (name="gclid" / name="click_id_type") i ett formulär.
 * Anropas precis före submit så att värdet är så färskt som möjligt.
 */
export function applyClickIdToForm(form: HTMLFormElement): void {
  const click = getClickId();
  if (!click) return;
  setHidden(form, 'gclid', click.value);
  setHidden(form, 'click_id_type', click.type);
}

function setHidden(form: HTMLFormElement, name: string, value: string): void {
  let el = form.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
  if (!el) {
    el = document.createElement('input');
    el.type = 'hidden';
    el.name = name;
    form.appendChild(el);
  }
  el.value = value;
}
