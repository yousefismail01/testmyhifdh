/**
 * English Sahih International translation, one string per ayah.
 *
 * Lazy-loaded from /data/translation-en-sahih.json (~925 KB raw,
 * ~286 KB gzipped). The same fetch-once-and-cache pattern as the
 * tajweed runs file — keep the initial JS bundle small.
 */
type Map = Record<string, string>;

let data: Map = {};
let ready = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function loadTranslation(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/data/translation-en-sahih.json");
      if (!res.ok) throw new Error(String(res.status));
      data = (await res.json()) as Map;
    } catch {
      data = {};
    } finally {
      ready = true;
      for (const l of listeners) l();
    }
  })();
  return inflight;
}

export function isTranslationReady(): boolean {
  return ready;
}

export function subscribeTranslationReady(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTranslation(surah: number, ayah: number): string {
  return data[`${surah}:${ayah}`] ?? "";
}
