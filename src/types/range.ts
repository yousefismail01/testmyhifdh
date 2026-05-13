import type { AyahReference } from "../data/quran-meta";
import type { Language } from "../i18n/translations";

export type RangeMode = "surah" | "juz" | "page" | "custom";

/**
 * Renders a positive integer using the digits native to the given UI
 * language. English keeps Western digits; Arabic uses Eastern-Arabic
 * (٠١٢٣...); Urdu uses Extended Arabic-Indic (۰۱۲۳...).
 */
export function localizeNumber(n: number, lang: Language): string {
  if (lang === "en") return String(n);
  const map =
    lang === "ar"
      ? ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
      : ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n)
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? map[+c] : c))
    .join("");
}

export interface SelectedRange {
  mode: RangeMode;
  startSurah?: number;
  endSurah?: number;
  startAyah?: number;
  endAyah?: number;
  /** Legacy single-juz field; treat as a 1-element juzNumbers array. */
  juzNumber?: number;
  /** Selected juzs (sorted ascending). Authoritative when both are set. */
  juzNumbers?: number[];
  startPage?: number;
  endPage?: number;
  /**
   * Custom mode: an explicit list of ayahs (sorted by surah, then ayah).
   * Built via the juz drill-down customizer. juzNumbers is also set so
   * the pill can label the custom selection by its origin juz(s).
   */
  customAyahs?: AyahReference[];
}

/** Normalize the juz selection of a SelectedRange to a sorted number[]. */
export function getSelectedJuzs(range: SelectedRange): number[] {
  if (range.juzNumbers && range.juzNumbers.length > 0)
    return [...range.juzNumbers].sort((a, b) => a - b);
  if (range.juzNumber !== undefined) return [range.juzNumber];
  return [];
}

/**
 * Short human-readable label for a juz list. Used by the range pill.
 * `juzWord` is the translated "Juz" prefix; numerals are localized to
 * the chosen language.
 */
export function formatJuzList(
  juzs: number[],
  lang: Language,
  juzWord: string
): string {
  if (juzs.length === 0) return "";
  const n = (x: number) => localizeNumber(x, lang);
  if (juzs.length === 1) return `${juzWord} ${n(juzs[0])}`;
  if (juzs.length <= 3)
    return `${juzWord} ${juzs.map(n).join(", ")}`;
  return `${juzWord} ${juzs.slice(0, 2).map(n).join(", ")} +${n(
    juzs.length - 2
  )}`;
}
