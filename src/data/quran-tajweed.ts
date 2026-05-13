/** One run of consecutive words from a single Mushaf page. */
export interface TajweedRun {
  /** Mushaf page number (1–604). Drives which page font to render with. */
  p: number;
  /** PUA-encoded text whose glyphs only render correctly with the page's font. */
  t: string;
}

type RunsMap = Record<string, TajweedRun[]>;

let runs: RunsMap = {};
let ready = false;
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const loadedFonts = new Set<number>();
const readyFonts = new Set<number>();
const fontReadyListeners = new Set<() => void>();

/** True once the page's woff2 has finished loading into the document. */
export function isPageFontReady(page: number): boolean {
  return readyFonts.has(page);
}

/** Subscribe to font-ready notifications (any page becoming ready). */
export function subscribePageFontReady(listener: () => void): () => void {
  fontReadyListeners.add(listener);
  return () => fontReadyListeners.delete(listener);
}

/**
 * Kicks off a fetch of /data/ayahs-tajweed.json the first time it's
 * called, returning the same promise on subsequent calls. The JSON
 * used to live inside the JS bundle (~648 KB raw / ~60 KB gzipped),
 * which made first paint slower than it needed to be. Now it ships as
 * a separate static asset that the app fetches once during startup.
 */
export function loadTajweed(): Promise<void> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const res = await fetch("/data/ayahs-tajweed.json");
      if (!res.ok) throw new Error(String(res.status));
      runs = (await res.json()) as RunsMap;
    } catch {
      // Network failure or HTTP error — leave the runs map empty so the
      // UI renders nothing rather than crashing. The user can hit reload.
      runs = {};
    } finally {
      ready = true;
      for (const listener of listeners) listener();
    }
  })();
  return loadingPromise;
}

/** True once the tajweed runs data has loaded (or failed). */
export function isTajweedReady(): boolean {
  return ready;
}

/** Subscribe to readiness changes; returns an unsubscribe function. */
export function subscribeTajweedReady(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTajweedRuns(surah: number, ayah: number): TajweedRun[] {
  return runs[`${surah}:${ayah}`] ?? [];
}

/**
 * Lazy-register the per-page font face. Each page's font file contains the
 * specific glyphs for that page's PUA codepoints, so a word from page N
 * only renders correctly with the `qpc-v4-p{N}` family.
 *
 * The QPC v4 font ships 6 CPAL palettes:
 *   palette 0 — default (black base text + tajweed accent colors)
 *   palette 1 — white base text + slightly adjusted tajweed colors (dark UI)
 * We also register a `--tajweed-dark` font-palette-values rule pointing at
 * palette 1, so a single CSS `font-palette: --tajweed-dark` declaration
 * picks the right palette for whichever page font is active.
 */
export function ensurePageFont(page: number): void {
  if (loadedFonts.has(page)) return;
  loadedFonts.add(page);
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const family = `qpc-v4-p${page}`;
  try {
    // font-display: block — the QPC v4 PUA codepoints overlap Arabic
    // Presentation Forms in standard fonts, so a fallback font would
    // flash a misrendered version of the text. `block` keeps the text
    // invisible for ~100ms while the page font loads instead.
    const face = new FontFace(
      family,
      `url(/fonts/qpc-v4/p${page}.woff2) format("woff2")`,
      { display: "block" }
    );
    document.fonts.add(face);
    face
      .load()
      .then(() => {
        readyFonts.add(page);
        for (const l of fontReadyListeners) l();
      })
      .catch(() => {
        // Network/decoding failure — still mark "ready" so callers
        // stop waiting forever; the fallback glyphs will at least show
        // something.
        readyFonts.add(page);
        for (const l of fontReadyListeners) l();
      });
  } catch {
    /* fontface unsupported — degrade gracefully */
    readyFonts.add(page);
  }
  // The QPC v4 font ships 6 CPAL palettes. We reference three named:
  //   palette 0 (default)      — black base text + tajweed colors  (tajweed, light)
  //   palette 1 (--tajweed-dark) — white base text + tajweed colors  (tajweed, dark)
  //   palette 3 (--qpc-plain)   — black base + marker accents       (plain, light)
  //   palette 4 (--qpc-plain-dark) — white base + marker accents    (plain, dark)
  //
  // Indices 10/11/12 in the CPAL drive the ayah-end rosette ornament's
  // three color layers. Pin them in both plain palettes to a single
  // gold-and-green Mushaf palette so the marker reads identically in
  // light and dark.
  const ORNAMENT_OVERRIDES =
    "override-colors: " +
    "10 #1f8a6e, " + // medium green — rosette body
    "11 #c19a3a, " + // warm gold — inner accent
    "12 #2e544f"; //   deep teal — outline accent
  try {
    const style = document.createElement("style");
    style.textContent =
      `@font-palette-values --tajweed-dark { font-family: "${family}"; base-palette: 1; }` +
      `@font-palette-values --qpc-plain { font-family: "${family}"; base-palette: 3; ${ORNAMENT_OVERRIDES}; }` +
      `@font-palette-values --qpc-plain-dark { font-family: "${family}"; base-palette: 4; ${ORNAMENT_OVERRIDES}; }`;
    document.head.appendChild(style);
  } catch {
    /* font-palette-values unsupported — non-fatal */
  }
}
