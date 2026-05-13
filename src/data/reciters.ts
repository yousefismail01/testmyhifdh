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
   * Base path for per-surah word-timing JSONs, e.g. `/data/words-husary`.
   * Files are at `${wordsBasePath}/${surah}.json` and each contains
   * `{ "surah:ayah": [[startMs, endMs], ...] }` for that surah only.
   * Optional — Alafasy doesn't have word-level data, so highlighting
   * is silently skipped for him.
   */
  wordsBasePath?: string;
}

const pad = (n: number, w: number) => String(n).padStart(w, "0");

export const reciters: ReciterInfo[] = [
  {
    id: "husary",
    mode: "ayah",
    name: { en: "Husary", ar: "الحصري", ur: "حصری" },
    audioUrl: (s, a) =>
      `https://audio-cdn.tarteel.ai/quran/husary/${pad(s, 3)}${pad(a, 3)}.mp3`,
    wordsBasePath: "/data/words-husary",
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
    wordsBasePath: "/data/words-minshawi",
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
    wordsBasePath: "/data/words-maherAlMuaiqly",
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
    wordsBasePath: "/data/words-abdulBasit",
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
    wordsBasePath: "/data/words-yasserAlDosari",
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

/**
 * Synchronous read of the segment cache. Returns null if the table
 * hasn't loaded yet — callers should fall back to `loadReciterSegments`
 * for the async path. Used by the audio play path so we can call
 * `audio.play()` inside the user gesture without an intervening await
 * (critical on iOS Safari, which voids the gesture after any awaited
 * promise even if it resolves synchronously).
 */
export function getCachedReciterSegments(
  id: ReciterId
): SegmentMap | null {
  return segmentCache.get(id) ?? null;
}

// Per-(reciter, surah) cache. Tens of KB per surah; a typical session
// touches a few surahs, so the working set stays tiny compared to
// loading the entire reciter's word data up-front.
const wordsCache = new Map<string, WordMap>();
const wordsLoading = new Map<string, Promise<WordMap>>();

const wordsKey = (id: ReciterId, surah: number) => `${id}:${surah}`;

/**
 * Lazy-load the word-timing table for a single surah of a reciter.
 * Returns an empty map if the reciter has no published word data
 * (Alafasy) or the fetch fails — callers should just skip highlighting
 * in that case. Files are typically 3–10 KB gzipped per surah.
 */
export async function loadReciterWordsForSurah(
  id: ReciterId,
  surah: number
): Promise<WordMap> {
  const key = wordsKey(id, surah);
  const cached = wordsCache.get(key);
  if (cached) return cached;
  const inflight = wordsLoading.get(key);
  if (inflight) return inflight;
  const info = getReciter(id);
  if (!info.wordsBasePath) return {};
  const p = (async () => {
    try {
      const res = await fetch(`${info.wordsBasePath}/${surah}.json`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as WordMap;
      wordsCache.set(key, data);
      return data;
    } catch {
      wordsCache.set(key, {});
      return {};
    } finally {
      wordsLoading.delete(key);
    }
  })();
  wordsLoading.set(key, p);
  return p;
}

/**
 * Synchronous read of the word-timing cache for a single ayah.
 * Returns the per-word `[startMs, endMs]` array, or null when the
 * surah's slice hasn't been fetched yet.
 */
export function getCachedWordTimings(
  id: ReciterId,
  surah: number,
  ayah: number
): WordTimings | null {
  const map = wordsCache.get(wordsKey(id, surah));
  return map?.[`${surah}:${ayah}`] ?? null;
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
