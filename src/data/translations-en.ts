/**
 * English Sahih International translation. Per-surah files in
 * /data/translation-en-sahih/{surah}.json — fetched on demand and
 * cached for the rest of the session. Splitting by surah keeps the
 * working set small: a typical session touches a handful of surahs
 * rather than all 114.
 *
 * File shape per surah: { "surah:ayah": "english text", ... }
 */
type AyahMap = Record<string, string>;

const cache = new Map<number, AyahMap>();
const inflight = new Map<number, Promise<AyahMap>>();
const listeners = new Set<() => void>();

export function loadTranslationForSurah(surah: number): Promise<AyahMap> {
  const cached = cache.get(surah);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(surah);
  if (existing) return existing;
  const p = (async () => {
    try {
      const res = await fetch(`/data/translation-en-sahih/${surah}.json`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as AyahMap;
      cache.set(surah, data);
      for (const l of listeners) l();
      return data;
    } catch {
      const empty: AyahMap = {};
      cache.set(surah, empty);
      for (const l of listeners) l();
      return empty;
    } finally {
      inflight.delete(surah);
    }
  })();
  inflight.set(surah, p);
  return p;
}

export function isTranslationReadyForSurah(surah: number): boolean {
  return cache.has(surah);
}

export function subscribeTranslationReady(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTranslation(surah: number, ayah: number): string {
  const map = cache.get(surah);
  if (!map) return "";
  return map[`${surah}:${ayah}`] ?? "";
}
