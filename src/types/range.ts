import type { AyahReference } from "../data/quran-meta";

export type RangeMode = "surah" | "juz" | "page" | "custom";

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

/** Short human-readable label for a juz list. Used by the range pill. */
export function formatJuzList(juzs: number[]): string {
  if (juzs.length === 0) return "";
  if (juzs.length === 1) return `Juz ${juzs[0]}`;
  if (juzs.length <= 3) return `Juz ${juzs.join(", ")}`;
  return `Juz ${juzs.slice(0, 2).join(", ")} +${juzs.length - 2}`;
}
