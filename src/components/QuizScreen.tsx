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

    const pool = getAyahsInRange(r.startSurah, r.startAyah, r.endSurah, r.endAyah);
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
    <div className="min-h-screen bg-white animate-fade-in">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between py-4 mb-6">
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
          <div className="flex items-center justify-center py-32 animate-fade-in-soft">
            <div className="w-7 h-7 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : (
          <div key={currentAyah ? `${currentAyah.surah}:${currentAyah.ayah}` : "x"}>
            {(() => {
              const { text: cleanText, hadBismillah } =
                currentAyah && !promptOnly
                  ? stripBismillah(ayahText, currentAyah.surah, currentAyah.ayah)
                  : { text: ayahText, hadBismillah: false };
              return (
                <>
                  {hadBismillah && (
                    <div className="text-center mb-6 mt-2 animate-fade-in-soft">
                      <span
                        className="bismillah-glyph text-3xl text-neutral-700"
                        dir="rtl"
                      >
                        {BISMILLAH_DISPLAY}
                      </span>
                    </div>
                  )}
                  <div className="bg-white rounded-3xl border border-neutral-200 p-8 mb-4 animate-slide-up">
                    {currentAyah && !hideSurahName && !promptOnly && (
                      <div className="text-center mb-5 flex items-center justify-center gap-2">
                        <span className="text-xs font-medium text-neutral-600 bg-neutral-50 px-3 py-1 rounded-full border border-neutral-200">
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
                      <div className="text-center py-8">
                        <div className="text-xs uppercase tracking-widest text-neutral-400 mb-4">
                          What's the first ayah of
                        </div>
                        <div className="font-quran text-6xl text-neutral-900 mb-2">
                          {currentSurahInfo!.nameArabic}
                        </div>
                        <div className="text-neutral-500 text-base">
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
                </>
              );
            })()}

            {revealedAyahs.length > 0 && (
              <div className="space-y-3 mb-4">
                {revealedAyahs.map((ra, i) => {
                  const { text: cleanText, hadBismillah } = stripBismillah(
                    ra.text,
                    ra.surah,
                    ra.ayah
                  );
                  return (
                    <div key={i} className="animate-slide-up">
                      {hadBismillah && (
                        <div className="text-center my-5">
                          {!hideSurahName && (
                            <div className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
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
            )}

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
        )}
      </div>
    </div>
  );
}
