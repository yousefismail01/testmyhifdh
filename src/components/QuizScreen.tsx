import { useState, useEffect, useCallback, useRef } from "react";
import {
  surahs,
  getAyahsInRange,
  getJuzRange,
  getSurahRange,
  pickWeightedRandomAyah,
  type AyahReference,
} from "../data/quran-meta";
import { fetchAyahText } from "../data/quran-api";
import type { SelectedRange } from "./RangeSelector";

interface Props {
  range: SelectedRange;
  onBack: () => void;
}

interface RevealedAyah {
  surah: number;
  ayah: number;
  text: string;
  isEndOfSurah: boolean;
}

export default function QuizScreen({ range, onBack }: Props) {
  const [ayahPool, setAyahPool] = useState<AyahReference[]>([]);
  const [currentAyah, setCurrentAyah] = useState<AyahReference | null>(null);
  const [ayahText, setAyahText] = useState("");
  const [revealedAyahs, setRevealedAyahs] = useState<RevealedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const lastRevealedRef = useRef<AyahReference | null>(null);

  const [hideSurahName, setHideSurahName] = useState(false);
  const [testFirstAyahs, setTestFirstAyahs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [promptOnly, setPromptOnly] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let r: {
      startSurah: number;
      startAyah: number;
      endSurah: number;
      endAyah: number;
    };

    if (range.mode === "juz") {
      r = getJuzRange(range.juzNumber!);
    } else if (range.mode === "surah") {
      r = getSurahRange(range.startSurah!, range.endSurah!);
    } else {
      const startPage = range.startPage!;
      const endPage = range.endPage!;
      let startSurah = 1;
      let endSurah = 114;
      for (const s of surahs) {
        if (s.startPage <= startPage) startSurah = s.number;
        if (s.startPage <= endPage) endSurah = s.number;
      }
      r = {
        startSurah,
        startAyah: 1,
        endSurah,
        endAyah: surahs[endSurah - 1].ayahCount,
      };
    }

    const pool = getAyahsInRange(
      r.startSurah,
      r.startAyah,
      r.endSurah,
      r.endAyah
    ).filter((a) => a.ayah < surahs[a.surah - 1].ayahCount);
    setAyahPool(pool);
  }, [range]);

  const rollNewAyah = useCallback(async () => {
    if (ayahPool.length === 0) return;
    setLoading(true);
    setRevealedAyahs([]);

    const picked = pickWeightedRandomAyah(ayahPool);
    setCurrentAyah(picked);
    lastRevealedRef.current = picked;

    const shouldHide = testFirstAyahs && picked.ayah === 1;
    setPromptOnly(shouldHide);

    if (shouldHide) {
      setAyahText("");
    } else {
      const text = await fetchAyahText(picked.surah, picked.ayah);
      setAyahText(text);
    }
    setLoading(false);
  }, [ayahPool, testFirstAyahs]);

  useEffect(() => {
    if (ayahPool.length > 0) {
      rollNewAyah();
    }
  }, [ayahPool, rollNewAyah]);

  const updateWheel = useCallback(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const cards = sc.querySelectorAll<HTMLElement>("[data-wheel-card]");
    const r = sc.getBoundingClientRect();
    const scH = sc.clientHeight;
    const scCenter = r.top + scH / 2;
    cards.forEach((card) => {
      const cr = card.getBoundingClientRect();
      const cardCenter = cr.top + cr.height / 2;
      const dist = (cardCenter - scCenter) / (scH / 2);
      const clamped = Math.max(-1.4, Math.min(1.4, dist));
      const rotateX = -clamped * 38;
      const scale = 1 - Math.abs(clamped) * 0.12;
      const translateZ = -Math.abs(clamped) * 80;
      card.style.transform = `translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
    });
  }, []);

  useEffect(() => {
    if (!scrollerRef.current) return;
    const sc = scrollerRef.current;
    if (revealedAyahs.length === 0) {
      sc.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
    }
    requestAnimationFrame(updateWheel);
  }, [revealedAyahs.length, currentAyah, updateWheel]);

  useEffect(() => {
    updateWheel();
    window.addEventListener("resize", updateWheel);
    return () => window.removeEventListener("resize", updateWheel);
  }, [updateWheel]);

  const advanceOne = (
    ref: AyahReference
  ): AyahReference | null => {
    const surahInfo = surahs[ref.surah - 1];
    if (ref.ayah < surahInfo.ayahCount) {
      return { surah: ref.surah, ayah: ref.ayah + 1 };
    }
    if (ref.surah < 114) {
      return { surah: ref.surah + 1, ayah: 1 };
    }
    return null;
  };

  const revealNext = async () => {
    if (!currentAyah || !lastRevealedRef.current) return;

    if (promptOnly) {
      const text = await fetchAyahText(currentAyah.surah, 1);
      const surahInfo = surahs[currentAyah.surah - 1];
      setAyahText(text);
      setPromptOnly(false);
      lastRevealedRef.current = { surah: currentAyah.surah, ayah: 1 };
      if (surahInfo.ayahCount === 1) {
        setRevealedAyahs((prev) => [
          ...prev,
          { surah: currentAyah.surah, ayah: 1, text, isEndOfSurah: true },
        ]);
      }
      return;
    }

    const nextRef = advanceOne(lastRevealedRef.current);
    if (!nextRef) return;

    const text = await fetchAyahText(nextRef.surah, nextRef.ayah);
    const nextSurahInfo = surahs[nextRef.surah - 1];
    lastRevealedRef.current = nextRef;
    setRevealedAyahs((prev) => [
      ...prev,
      {
        surah: nextRef.surah,
        ayah: nextRef.ayah,
        text,
        isEndOfSurah: nextRef.ayah === nextSurahInfo.ayahCount,
      },
    ]);
  };

  const revealRemainingPage = async () => {
    if (!currentAyah || !lastRevealedRef.current) return;

    if (promptOnly) {
      await revealNext();
      return;
    }

    const newRevealed: RevealedAyah[] = [];
    let cursor: AyahReference | null = lastRevealedRef.current;
    for (let i = 0; i < 10; i++) {
      const nextRef = advanceOne(cursor);
      if (!nextRef) break;
      const text = await fetchAyahText(nextRef.surah, nextRef.ayah);
      const surahInfo = surahs[nextRef.surah - 1];
      newRevealed.push({
        surah: nextRef.surah,
        ayah: nextRef.ayah,
        text,
        isEndOfSurah: nextRef.ayah === surahInfo.ayahCount,
      });
      cursor = nextRef;
    }

    if (cursor) lastRevealedRef.current = cursor;
    setRevealedAyahs((prev) => [...prev, ...newRevealed]);
  };

  const getRangeLabel = () => {
    if (range.mode === "juz") return `Juz ${range.juzNumber}`;
    if (range.mode === "surah") {
      if (range.startSurah === range.endSurah)
        return surahs[range.startSurah! - 1].name;
      return `${surahs[range.startSurah! - 1].name} – ${surahs[range.endSurah! - 1].name}`;
    }
    return `Pages ${range.startPage} – ${range.endPage}`;
  };

  const BISMILLAH_DISPLAY = "﷽";

  const stripBismillah = (text: string, surah: number, ayah: number) => {
    if (ayah !== 1 || surah === 1 || surah === 9)
      return { text, hadBismillah: false };
    const normalize = (s: string) =>
      s.replace(/[ً-ٰٟۖ-ۭ]/g, "").replace(/ٱ/g, "ا").replace(/\s/g, "");
    const bismillahBare = normalize("بسم الله الرحمن الرحيم");
    const textBare = normalize(text);
    if (!textBare.startsWith(bismillahBare))
      return { text, hadBismillah: false };
    let consumed = 0;
    let bareCount = 0;
    for (const ch of text) {
      const isDiacriticOrSpace = /[ً-ٰٟۖ-ۭ\s]/.test(ch);
      if (bareCount >= bismillahBare.length && !isDiacriticOrSpace) break;
      consumed += ch.length;
      if (!isDiacriticOrSpace) bareCount++;
    }
    const stripped = text.slice(consumed).trimStart();
    return { text: stripped, hadBismillah: true };
    };

  const currentSurahInfo = currentAyah ? surahs[currentAyah.surah - 1] : null;
  const isLastAyah =
    currentAyah && currentSurahInfo
      ? currentAyah.ayah === currentSurahInfo.ayahCount
      : false;

  return (
    <div className="h-screen bg-white animate-fade-in flex flex-col overflow-hidden">
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between pb-4 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-200">
              {getRangeLabel()}
            </span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full border transition-all duration-200 ${
                showSettings
                  ? "bg-neutral-900 border-neutral-900 text-white"
                  : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300"
              }`}
              aria-label="Settings"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 mb-4 space-y-4 animate-fade-in">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="pr-4">
                <div className="text-sm font-medium text-neutral-800">
                  Hide surah names
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Don't show which surah the ayah is from
                </div>
              </div>
              <input
                type="checkbox"
                checked={hideSurahName}
                onChange={(e) => setHideSurahName(e.target.checked)}
                className="w-5 h-5 accent-neutral-900 shrink-0"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="pr-4">
                <div className="text-sm font-medium text-neutral-800">
                  Test first ayahs
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  When the rolled ayah is the first of a surah, show only the
                  surah name and you guess the ayah
                </div>
              </div>
              <input
                type="checkbox"
                checked={testFirstAyahs}
                onChange={(e) => setTestFirstAyahs(e.target.checked)}
                className="w-5 h-5 accent-neutral-900 shrink-0"
              />
            </label>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center flex-1 animate-fade-in-soft">
            <div className="w-7 h-7 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : (
          <div
            key={currentAyah ? `${currentAyah.surah}:${currentAyah.ayah}` : "x"}
            className="flex flex-col flex-1 min-h-0"
          >
            <div
              ref={scrollerRef}
              onScroll={updateWheel}
              className="reveal-mask scrollbar-hide flex-1 min-h-0 overflow-y-auto -mx-4 px-4"
            >
              <div className="space-y-3 py-12">
                {currentAyah &&
                  (() => {
                    const { text: cleanText, hadBismillah } = !promptOnly
                      ? stripBismillah(
                          ayahText,
                          currentAyah.surah,
                          currentAyah.ayah
                        )
                      : { text: ayahText, hadBismillah: false };
                    return (
                      <div
                        data-wheel-card
                        className="wheel-card"
                      >
                        {hadBismillah && (
                          <div className="text-center mb-3 animate-fade-in-soft">
                            <span
                              className="bismillah-glyph text-3xl text-neutral-700"
                              dir="rtl"
                            >
                              {BISMILLAH_DISPLAY}
                            </span>
                          </div>
                        )}
                        <div className="bg-white rounded-3xl border-2 border-neutral-900/10 p-7 ring-1 ring-neutral-900/5">
                          {!hideSurahName && !promptOnly && (
                            <div className="text-center mb-4 flex items-center justify-center gap-2">
                              <span className="text-xs font-medium text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full">
                                {currentSurahInfo!.nameArabic} —{" "}
                                {currentSurahInfo!.name} : {currentAyah.ayah}
                              </span>
                              {isLastAyah && (
                                <span className="text-xs font-medium text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                  Last ayah
                                </span>
                              )}
                            </div>
                          )}

                          {promptOnly ? (
                            <div className="text-center py-6">
                              <div className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
                                What's the first ayah of
                              </div>
                              <div className="font-quran text-5xl text-neutral-900 mb-1">
                                {currentSurahInfo!.nameArabic}
                              </div>
                              <div className="text-neutral-500 text-sm">
                                {currentSurahInfo!.name}
                              </div>
                            </div>
                          ) : (
                            <p
                              className="font-quran text-3xl leading-[2.4] text-neutral-900 text-right"
                              dir="rtl"
                            >
                              {cleanText}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {revealedAyahs.map((ra, i) => {
                  const { text: cleanText, hadBismillah } = stripBismillah(
                    ra.text,
                    ra.surah,
                    ra.ayah
                  );
                  return (
                    <div
                      key={i}
                      data-wheel-card
                      className="wheel-card animate-slide-up"
                    >
                      {hadBismillah && (
                        <div className="text-center mb-3">
                          {!hideSurahName && (
                            <div className="text-xs uppercase tracking-widest text-neutral-400 mb-1.5">
                              {surahs[ra.surah - 1].nameArabic} —{" "}
                              {surahs[ra.surah - 1].name}
                            </div>
                          )}
                          <span
                            className="bismillah-glyph text-2xl text-neutral-700"
                            dir="rtl"
                          >
                            {BISMILLAH_DISPLAY}
                          </span>
                        </div>
                      )}
                      <div className="bg-white rounded-3xl border border-neutral-200 p-6">
                        {!hideSurahName && (
                          <div className="text-center mb-3 flex items-center justify-center gap-2">
                            <span className="text-xs text-neutral-400">
                              {surahs[ra.surah - 1].nameArabic} : {ra.ayah}
                            </span>
                            {ra.isEndOfSurah && (
                              <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                Last ayah
                              </span>
                            )}
                          </div>
                        )}
                        <p
                          className="font-quran text-2xl leading-[2.2] text-neutral-700 text-right"
                          dir="rtl"
                        >
                          {cleanText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 pt-3">
            <div className="flex gap-3 mb-3">
              <button
                onClick={revealNext}
                className="flex-1 py-3 bg-white hover:bg-neutral-50 text-neutral-700 font-medium rounded-xl border border-neutral-200 transition-all duration-200 active:scale-[0.99]"
              >
                {promptOnly ? "Reveal First Ayah" : "Reveal Next Ayah"}
              </button>
              <button
                onClick={revealRemainingPage}
                className="flex-1 py-3 bg-white hover:bg-neutral-50 text-neutral-700 font-medium rounded-xl border border-neutral-200 transition-all duration-200 active:scale-[0.99]"
              >
                Reveal More (+10)
              </button>
            </div>

            <button
              onClick={rollNewAyah}
              className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xl transition-all duration-200 active:scale-[0.99]"
            >
              Next Random Ayah
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
