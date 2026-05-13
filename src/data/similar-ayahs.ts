/**
 * Mutashabihat / similar-phrase index. Maps an ayah key to an array of
 * other ayah keys whose wording overlaps significantly — useful for
 * hifz, where the most common error is "jumping" from one verse into a
 * parallel verse with similar wording.
 *
 * Built offline by merging:
 *   - the Mutashabihat-ul-Quran groupings (traditional scholarship —
 *     authoritative, ~2,200 ayahs)
 *   - high-confidence machine matches as backfill for ayahs not covered
 *     by the above (filtered to score >= 70, coverage >= 50%, >= 3
 *     overlapping words)
 *
 * The shipped file is ~117 KB raw / ~24 KB gzipped — small enough to
 * fetch unconditionally on app boot when the toggle is on.
 */
type Map = Record<string, string[]>;

let data: Map = {};
let ready = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function loadSimilar(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/data/similar-ayahs.json");
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

export function isSimilarReady(): boolean {
  return ready;
}

export function subscribeSimilarReady(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Returns the list of similar ayah keys for the given ayah, or an
 * empty array if the data hasn't loaded yet / the ayah has no
 * recorded similars.
 */
export function getSimilarAyahs(surah: number, ayah: number): string[] {
  return data[`${surah}:${ayah}`] ?? [];
}
