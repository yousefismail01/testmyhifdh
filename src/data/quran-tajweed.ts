import tajweedData from "./ayahs-tajweed.json";

/** One run of consecutive words from a single Mushaf page. */
export interface TajweedRun {
  /** Mushaf page number (1–604). Drives which page font to render with. */
  p: number;
  /** PUA-encoded text whose glyphs only render correctly with the page's font. */
  t: string;
}

const runs = tajweedData as Record<string, TajweedRun[]>;
const loadedFonts = new Set<number>();

export function getTajweedRuns(surah: number, ayah: number): TajweedRun[] {
  return runs[`${surah}:${ayah}`] ?? [];
}

/**
 * Lazy-register the per-page font face. Each page's font file contains the
 * specific glyphs for that page's PUA codepoints, so a word from page N
 * only renders correctly with the `qpc-v4-p{N}` family.
 */
export function ensurePageFont(page: number): void {
  if (loadedFonts.has(page)) return;
  loadedFonts.add(page);
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    const family = `qpc-v4-p${page}`;
    const face = new FontFace(
      family,
      `url(/fonts/qpc-v4/p${page}.woff2) format("woff2")`,
      { display: "swap" }
    );
    document.fonts.add(face);
    void face.load();
  } catch {
    /* fontface unsupported or quota — degrade gracefully */
  }
}
