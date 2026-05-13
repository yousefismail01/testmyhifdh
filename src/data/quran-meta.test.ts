import { describe, expect, it } from "vitest";
import {
  surahs,
  juzData,
  getAyahsInRange,
  getJuzRange,
  getJuzSurahs,
  getJuzsSurahs,
  getAyahsInJuzs,
  getSurahRange,
  pickWeightedRandomAyah,
} from "./quran-meta";

describe("surahs / juzData reference data", () => {
  it("has 114 surahs and 30 juzs", () => {
    expect(surahs).toHaveLength(114);
    expect(juzData).toHaveLength(30);
  });

  it("surah numbers are sequential", () => {
    surahs.forEach((s, i) => expect(s.number).toBe(i + 1));
  });

  it("juzs cover the entire Mushaf with no gaps or overlaps", () => {
    expect(juzData[0].startSurah).toBe(1);
    expect(juzData[0].startAyah).toBe(1);
    expect(juzData[29].endSurah).toBe(114);
    expect(juzData[29].endAyah).toBe(surahs[113].ayahCount);
    for (let i = 1; i < juzData.length; i++) {
      const prev = juzData[i - 1];
      const cur = juzData[i];
      // The juz boundary should be exactly one ayah after prev's end.
      const prevSurah = surahs[prev.endSurah - 1];
      const expectedStart =
        prev.endAyah === prevSurah.ayahCount
          ? { surah: prev.endSurah + 1, ayah: 1 }
          : { surah: prev.endSurah, ayah: prev.endAyah + 1 };
      expect({ surah: cur.startSurah, ayah: cur.startAyah }).toEqual(
        expectedStart
      );
    }
  });
});

describe("getAyahsInRange", () => {
  it("enumerates ayahs within a single surah", () => {
    const refs = getAyahsInRange(1, 1, 1, 7);
    expect(refs).toHaveLength(7);
    expect(refs[0]).toEqual({ surah: 1, ayah: 1 });
    expect(refs[6]).toEqual({ surah: 1, ayah: 7 });
  });

  it("crosses surah boundaries correctly", () => {
    const refs = getAyahsInRange(1, 5, 2, 3);
    expect(refs).toEqual([
      { surah: 1, ayah: 5 },
      { surah: 1, ayah: 6 },
      { surah: 1, ayah: 7 }, // Al-Fatiha has 7 ayahs
      { surah: 2, ayah: 1 },
      { surah: 2, ayah: 2 },
      { surah: 2, ayah: 3 },
    ]);
  });

  it("returns a single ayah when start === end", () => {
    expect(getAyahsInRange(2, 50, 2, 50)).toEqual([{ surah: 2, ayah: 50 }]);
  });
});

describe("getJuzRange / getJuzSurahs", () => {
  it("getJuzRange echoes the juzData entry", () => {
    expect(getJuzRange(1)).toEqual({
      startSurah: 1,
      startAyah: 1,
      endSurah: 2,
      endAyah: 141,
    });
    expect(getJuzRange(30).endSurah).toBe(114);
  });

  it("getJuzSurahs splits a juz into its constituent surah segments", () => {
    // Juz 1 covers all of Al-Fatiha plus Al-Baqarah 1–141.
    const segs = getJuzSurahs(1);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({
      surah: 1,
      startAyah: 1,
      endAyah: 7,
      segmentCount: 7,
    });
    expect(segs[1]).toMatchObject({
      surah: 2,
      startAyah: 1,
      endAyah: 141,
      segmentCount: 141,
    });
  });

  it("clips ayah boundaries when a surah is split across juzs", () => {
    // Juz 2 is entirely inside Al-Baqarah (142–252).
    const segs = getJuzSurahs(2);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({
      surah: 2,
      startAyah: 142,
      endAyah: 252,
      segmentCount: 111,
    });
  });
});

describe("getJuzsSurahs (multi-juz union)", () => {
  it("merges consecutive juzs into contiguous spans per surah", () => {
    const { segments, coveredAyahs } = getJuzsSurahs([1, 2]);
    // Juz 1: Al-Fatiha 1–7 + Al-Baqarah 1–141; Juz 2: Al-Baqarah 142–252.
    expect(segments).toHaveLength(2);
    const baqarah = segments.find((s) => s.surah === 2)!;
    expect(baqarah.startAyah).toBe(1);
    expect(baqarah.endAyah).toBe(252);
    expect(coveredAyahs.get(2)?.size).toBe(252);
  });

  it("non-consecutive juzs: segment span min/max, covered ayahs precise", () => {
    // Juz 1 (Baqarah 1–141) + Juz 3 (Baqarah 253 onwards, into Aal-Imran).
    const { segments, coveredAyahs } = getJuzsSurahs([1, 3]);
    const baqarah = segments.find((s) => s.surah === 2)!;
    // Span goes from juz 1's start to juz 3's end-within-baqarah.
    expect(baqarah.startAyah).toBe(1);
    expect(baqarah.endAyah).toBe(286);
    // But the gap (juz 2: 142–252) is NOT in coveredAyahs.
    const covered = coveredAyahs.get(2)!;
    expect(covered.has(141)).toBe(true);
    expect(covered.has(142)).toBe(false);
    expect(covered.has(252)).toBe(false);
    expect(covered.has(253)).toBe(true);
  });

  it("empty input yields empty output", () => {
    expect(getJuzsSurahs([]).segments).toEqual([]);
  });
});

describe("getAyahsInJuzs", () => {
  it("returns the union of selected juzs sorted by surah:ayah", () => {
    const refs = getAyahsInJuzs([1]);
    expect(refs[0]).toEqual({ surah: 1, ayah: 1 });
    // Juz 1 contains Fatiha (7) + Baqarah 1–141 = 148 ayahs.
    expect(refs).toHaveLength(148);
    expect(refs[refs.length - 1]).toEqual({ surah: 2, ayah: 141 });
  });

  it("non-consecutive picks skip the gap juz's ayahs", () => {
    const refs = getAyahsInJuzs([1, 3]);
    // No Baqarah 142..252 should appear.
    const baqarahGap = refs.filter(
      (r) => r.surah === 2 && r.ayah >= 142 && r.ayah <= 252
    );
    expect(baqarahGap).toHaveLength(0);
    // But Baqarah 253 should.
    expect(
      refs.some((r) => r.surah === 2 && r.ayah === 253)
    ).toBe(true);
  });

  it("dedupes overlapping selections", () => {
    const single = getAyahsInJuzs([1]);
    const doubled = getAyahsInJuzs([1, 1]);
    expect(doubled).toHaveLength(single.length);
  });

  it("returns [] for empty input", () => {
    expect(getAyahsInJuzs([])).toEqual([]);
  });
});

describe("getSurahRange", () => {
  it("spans full surahs by default", () => {
    expect(getSurahRange(1, 2)).toEqual({
      startSurah: 1,
      startAyah: 1,
      endSurah: 2,
      endAyah: 286,
    });
  });
});

describe("pickWeightedRandomAyah", () => {
  it("returns one of the supplied refs", () => {
    const pool = [
      { surah: 1, ayah: 1 },
      { surah: 1, ayah: 2 },
      { surah: 2, ayah: 5 },
    ];
    for (let i = 0; i < 50; i++) {
      const picked = pickWeightedRandomAyah(pool);
      expect(pool).toContainEqual(picked);
    }
  });

  it("over many samples, every pool entry is reachable", () => {
    const pool = [
      { surah: 1, ayah: 1 },
      { surah: 1, ayah: 2 },
      { surah: 1, ayah: 3 },
    ];
    const seen = new Set<string>();
    for (let i = 0; i < 200 && seen.size < pool.length; i++) {
      const p = pickWeightedRandomAyah(pool);
      seen.add(`${p.surah}:${p.ayah}`);
    }
    expect(seen.size).toBe(pool.length);
  });
});
