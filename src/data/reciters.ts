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
}

const pad = (n: number, w: number) => String(n).padStart(w, "0");

export const reciters: ReciterInfo[] = [
  {
    id: "husary",
    mode: "ayah",
    name: { en: "Husary", ar: "الحصري", ur: "حصری" },
    audioUrl: (s, a) =>
      `https://audio-cdn.tarteel.ai/quran/husary/${pad(s, 3)}${pad(a, 3)}.mp3`,
  },
  {
    id: "alafasy",
    mode: "ayah",
    name: { en: "Alafasy", ar: "العفاسي", ur: "العفاسی" },
    audioUrl: (s, a) =>
      `https://audio-cdn.tarteel.ai/quran/alafasy/${pad(s, 3)}${pad(a, 3)}.mp3`,
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
  },
];

export function getReciter(id: ReciterId): ReciterInfo {
  return reciters.find((r) => r.id === id) ?? reciters[0];
}

/** [fromMs, toMs] for an ayah within a surah-level recording. */
export type AyahSegment = [number, number];
type SegmentMap = Record<string, AyahSegment>;

const segmentCache = new Map<ReciterId, SegmentMap>();
const segmentLoading = new Map<ReciterId, Promise<SegmentMap>>();

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
