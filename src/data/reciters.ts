/**
 * Reciter catalog. Two delivery modes:
 *
 *   "ayah"   — one MP3 per ayah, URL pattern
 *              https://audio-cdn.tarteel.ai/quran/{slug}/{NNN}{MMM}.mp3
 *
 *   "surah"  — one MP3 per surah; we have to seek into it and stop at
 *              the ayah's end timestamp. The segment data lives at
 *              /data/segments-{slug}.json (fetched on demand) and maps
 *              "surah:ayah" → [fromMs, toMs].
 *
 * Adding a new reciter is one entry in the array below + (for surah-
 * mode) a `segments-{slug}.json` file in `public/data/`.
 */
export type ReciterId =
  | "husary"
  | "alafasy"
  | "minshawi"
  | "maherAlMuaiqly"
  | "abdulBasit"
  | "yasserAlDosari";

export type ReciterMode = "ayah" | "surah";

export interface ReciterInfo {
  id: ReciterId;
  mode: ReciterMode;
  /** Display names per UI language. */
  name: { en: string; ar: string; ur: string };
  /** Build the audio URL. For surah-mode reciters, only the surah arg matters. */
  audioUrl: (surah: number, ayah: number) => string;
  /** For surah-mode reciters, the path to the segment-timing JSON. */
  segmentsUrl?: string;
  /**
   * Per-word timing JSON, used to highlight the active word during
   * playback. Maps "surah:ayah" → `[[startMs, endMs], ...]`. Optional —
   * Alafasy doesn't have word-level data, so highlighting is silently
   * skipped for him.
   */
  wordsUrl?: string;
}

const pad = (n: number, w: number) => String(n).padStart(w, "0");

export const reciters: ReciterInfo[] = [
  {
    id: "husary",
    mode: "ayah",
    name: { en: "Husary", ar: "الحصري", ur: "حصری" },
    audioUrl: (s, a) =>
      `https://audio-cdn.tarteel.ai/quran/husary/${pad(s, 3)}${pad(a, 3)}.mp3`,
    wordsUrl: "/data/words-husary.json",
  },
  {
    id: "alafasy",
    mode: "ayah",
    name: { en: "Alafasy", ar: "العفاسي", ur: "العفاسی" },
    audioUrl: (s, a) =>
      `https://audio-cdn.tarteel.ai/quran/alafasy/${pad(s, 3)}${pad(a, 3)}.mp3`,
    // No word-segment data published for Alafasy on this endpoint —
    // highlighting silently skips for him.
  },
  {
    id: "minshawi",
    mode: "ayah",
    name: { en: "Minshawi", ar: "المنشاوي", ur: "منشاوی" },
    audioUrl: (s, a) =>
      `https://audio-cdn.tarteel.ai/quran/minshawyMurattal/${pad(s, 3)}${pad(
        a,
        3
      )}.mp3`,
    wordsUrl: "/data/words-minshawi.json",
  },
  {
    id: "maherAlMuaiqly",
    mode: "ayah",
    name: { en: "Maher Al-Muaiqly", ar: "ماهر المعيقلي", ur: "ماہر المعیقلی" },
    audioUrl: (s, a) =>
      `https://audio-cdn.tarteel.ai/quran/maherAlMuaiqly/${pad(s, 3)}${pad(
        a,
        3
      )}.mp3`,
    wordsUrl: "/data/words-maherAlMuaiqly.json",
  },
  {
    id: "abdulBasit",
    mode: "surah",
    name: { en: "Abdul Basit", ar: "عبد الباسط", ur: "عبد الباسط" },
    audioUrl: (s) =>
      `https://audio-cdn.tarteel.ai/quran/surah/abdulBasit/mujawwad/mp3/${pad(
        s,
        3
      )}.mp3`,
    segmentsUrl: "/data/segments-abdulBasit.json",
    wordsUrl: "/data/words-abdulBasit.json",
  },
  {
    id: "yasserAlDosari",
    mode: "surah",
    name: { en: "Yasser Al-Dosari", ar: "ياسر الدوسري", ur: "یاسر الدوسری" },
    audioUrl: (s) =>
      `https://audio-cdn.tarteel.ai/quran/surah/yasserAlDosari/murattal/mp3/${pad(
        s,
        3
      )}.mp3`,
    segmentsUrl: "/data/segments-yasserAlDosari.json",
    wordsUrl: "/data/words-yasserAlDosari.json",
  },
];

export function getReciter(id: ReciterId): ReciterInfo {
  return reciters.find((r) => r.id === id) ?? reciters[0];
}

/** [fromMs, toMs] for an ayah within a surah-level recording. */
export type AyahSegment = [number, number];
type SegmentMap = Record<string, AyahSegment>;

/** Per-word `[startMs, endMs]` array, indexed by word position. */
export type WordTimings = [number, number][];
type WordMap = Record<string, WordTimings>;

const segmentCache = new Map<ReciterId, SegmentMap>();
const segmentLoading = new Map<ReciterId, Promise<SegmentMap>>();

const wordsCache = new Map<ReciterId, WordMap>();
const wordsLoading = new Map<ReciterId, Promise<WordMap>>();

/**
 * Lazy-load the per-word timing table for the given reciter. Returns
 * an empty map if the reciter has no published word-segment data
 * (Alafasy) or the fetch fails — callers should just skip highlighting
 * in that case. Files are ~250–500 KB gzipped each; fetched on first
 * audio play and cached for the rest of the session.
 */
export async function loadReciterWords(id: ReciterId): Promise<WordMap> {
  const cached = wordsCache.get(id);
  if (cached) return cached;
  const inflight = wordsLoading.get(id);
  if (inflight) return inflight;
  const info = getReciter(id);
  if (!info.wordsUrl) return {};
  const p = (async () => {
    try {
      const res = await fetch(info.wordsUrl!);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as WordMap;
      wordsCache.set(id, data);
      return data;
    } catch {
      wordsCache.set(id, {});
      return {};
    } finally {
      wordsLoading.delete(id);
    }
  })();
  wordsLoading.set(id, p);
  return p;
}

export function getCachedReciterWords(id: ReciterId): WordMap | null {
  return wordsCache.get(id) ?? null;
}

/**
 * Lazy-load the per-ayah segment table for a surah-mode reciter. The
 * same Promise is reused across concurrent callers; subsequent calls
 * after the fetch resolves return synchronously.
 */
export async function loadReciterSegments(
  id: ReciterId
): Promise<SegmentMap> {
  const cached = segmentCache.get(id);
  if (cached) return cached;
  const inflight = segmentLoading.get(id);
  if (inflight) return inflight;
  const info = getReciter(id);
  if (!info.segmentsUrl) return {};
  const p = (async () => {
    try {
      const res = await fetch(info.segmentsUrl!);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as SegmentMap;
      segmentCache.set(id, data);
      return data;
    } catch {
      segmentCache.set(id, {});
      return {};
    } finally {
      segmentLoading.delete(id);
    }
  })();
  segmentLoading.set(id, p);
  return p;
}
