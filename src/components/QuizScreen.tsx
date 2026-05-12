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
import { usePersistedState } from "../hooks/usePersistedState";
import type { Theme, FontSize } from "../App";

interface Props {
  range: SelectedRange;
  onBack: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
}

const FONT_SIZES: Record<
  FontSize,
  { current: string; revealed: string; bismillah: string }
> = {
  sm: { current: "text-2xl", revealed: "text-xl", bismillah: "text-2xl" },
  md: { current: "text-3xl", revealed: "text-2xl", bismillah: "text-3xl" },
  lg: { current: "text-4xl", revealed: "text-3xl", bismillah: "text-4xl" },
  xl: { current: "text-5xl", revealed: "text-4xl", bismillah: "text-5xl" },
};

interface RevealedAyah {
  surah: number;
  ayah: number;
  text: string;
  isEndOfSurah: boolean;
}

export default function QuizScreen({
  range,
  onBack,
  theme,
  setTheme,
  fontSize,
  setFontSize,
}: Props) {
  const [ayahPool, setAyahPool] = useState<AyahReference[]>([]);
  const [currentAyah, setCurrentAyah] = useState<AyahReference | null>(null);
  const [ayahText, setAyahText] = useState("");
  const [revealedAyahs, setRevealedAyahs] = useState<RevealedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const lastRevealedRef = useRef<AyahReference | null>(null);

  const [hideSurahName, setHideSurahName] = usePersistedState(
    "tmh.hideSurahName",
    false
  );
  const [testFirstAyahs, setTestFirstAyahs] = usePersistedState(
    "tmh.testFirstAyahs",
    false
  );
  const [showAyahNumbers, setShowAyahNumbers] = usePersistedState(
    "tmh.showAyahNumbers",
    true
  );

  const sizes = FONT_SIZES[fontSize];
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

  const rafIdRef = useRef<number | null>(null);
  const updateWheel = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const sc = scrollerRef.current;
      if (!sc) return;
      const cards = sc.querySelectorAll<HTMLElement>("[data-wheel-card]");
      if (cards.length === 0) return;
      const scH = sc.clientHeight;
      const maxScroll = Math.max(0, sc.scrollHeight - scH);
      const progress = maxScroll < 1 ? 0 : sc.scrollTop / maxScroll;
      const scRect = sc.getBoundingClientRect();

      // Use offsetTop (transform-free) to compute each card's natural vertical center
      // within the scroll content, then map to viewport Y.
      const centers: number[] = [];
      cards.forEach((card) => {
        let top = 0;
        let cur: HTMLElement | null = card;
        while (cur && cur !== sc) {
          top += cur.offsetTop;
          cur = cur.offsetParent as HTMLElement | null;
        }
        const naturalCenterInContent = top + card.offsetHeight / 2;
        centers.push(scRect.top + naturalCenterInContent - sc.scrollTop);
      });

      const firstCenter = centers[0];
      const lastCenter = centers[centers.length - 1];
      const focusY = firstCenter + progress * (lastCenter - firstCenter);

      cards.forEach((card, i) => {
        const dist = (centers[i] - focusY) / (scH / 2);
        const clamped = Math.max(-1.6, Math.min(1.6, dist));
        const rotateX = -clamped * 55;
        const scale = 1 - Math.abs(clamped) * 0.22;
        const translateZ = -Math.abs(clamped) * 140;
        card.style.transform = `translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
      });
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

  const showsBismillahHeader = (surah: number, ayah: number): boolean =>
    ayah === 1 && surah !== 1 && surah !== 9;

  const toArabicIndic = (n: number): string =>
    String(n)
      .split("")
      .map((d) => String.fromCharCode(0x0660 + parseInt(d, 10)))
      .join("");

  const renderAyahMarker = (ayahNum: number) => {
    if (!showAyahNumbers) return null;
    // KFGQPC Nastaleeq has digit-sequence ligatures (e.g. a001_a009_a009)
    // that combine the Arabic-Indic digits into the Mushaf rosette ornament.
    // No U+06DD prefix — that draws as a separate empty circle in this font.
    return (
      <span className="font-quran text-neutral-500 dark:text-neutral-400 mx-1">
        {toArabicIndic(ayahNum)}
      </span>
    );
  };

  const currentSurahInfo = currentAyah ? surahs[currentAyah.surah - 1] : null;
  const isLastAyah =
    currentAyah && currentSurahInfo
      ? currentAyah.ayah === currentSurahInfo.ayahCount
      : false;

  return (
    <div className="h-screen bg-white dark:bg-neutral-950 animate-fade-in flex flex-col overflow-hidden">
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between pb-4 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800">
              {getRangeLabel()}
            </span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full border transition-all duration-200 ${
                showSettings
                  ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300"
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
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 mb-4 space-y-4 animate-fade-in">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="pr-4">
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Hide surah names
                </div>
                <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Don't show which surah the ayah is from
                </div>
              </div>
              <input
                type="checkbox"
                checked={hideSurahName}
                onChange={(e) => setHideSurahName(e.target.checked)}
                className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="pr-4">
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Test first ayahs
                </div>
                <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  When the rolled ayah is the first of a surah, show only the
                  surah name and you guess the ayah
                </div>
              </div>
              <input
                type="checkbox"
                checked={testFirstAyahs}
                onChange={(e) => setTestFirstAyahs(e.target.checked)}
                className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="pr-4">
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Show ayah numbers
                </div>
                <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Display an end-of-ayah marker with the ayah number
                </div>
              </div>
              <input
                type="checkbox"
                checked={showAyahNumbers}
                onChange={(e) => setShowAyahNumbers(e.target.checked)}
                className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
              />
            </label>

            <div className="pt-1">
              <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
                Text size
              </div>
              <div className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-1">
                {(["sm", "md", "lg", "xl"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      fontSize === s
                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
                Theme
              </div>
              <div className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-1">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 capitalize ${
                      theme === t
                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center flex-1 animate-fade-in-soft">
            <div className="w-7 h-7 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 rounded-full animate-spin" />
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
              <div className="space-y-4 py-16">
                {currentAyah &&
                  (() => {
                    const hasBismillahHeader =
                      !promptOnly &&
                      showsBismillahHeader(currentAyah.surah, currentAyah.ayah);
                    return (
                      <div
                        data-wheel-card
                        className="wheel-card"
                      >
                        {hasBismillahHeader && (
                          <div className="text-center mb-3 animate-fade-in-soft">
                            <span
                              className={`bismillah-glyph ${sizes.bismillah} text-neutral-700 dark:text-neutral-200`}
                              dir="rtl"
                            >
                              {BISMILLAH_DISPLAY}
                            </span>
                          </div>
                        )}
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl border-2 border-neutral-900/10 dark:border-neutral-100/15 p-7 ring-1 ring-neutral-900/5 dark:ring-neutral-100/10">
                          {!hideSurahName && !promptOnly && (
                            <div className="text-center mb-4 flex items-center justify-center gap-2">
                              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                                {currentSurahInfo!.nameArabic} —{" "}
                                {currentSurahInfo!.name} : {currentAyah.ayah}
                              </span>
                              {isLastAyah && (
                                <span className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/60">
                                  Last ayah
                                </span>
                              )}
                            </div>
                          )}

                          {promptOnly ? (
                            <div className="text-center py-6">
                              <div className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
                                What's the first ayah of
                              </div>
                              <div className="font-quran text-5xl text-neutral-900 dark:text-neutral-100 mb-1">
                                {currentSurahInfo!.nameArabic}
                              </div>
                              <div className="text-neutral-500 dark:text-neutral-400 text-sm">
                                {currentSurahInfo!.name}
                              </div>
                            </div>
                          ) : (
                            <p
                              className={`font-quran ${sizes.current} leading-[2.4] text-neutral-900 dark:text-neutral-100 text-right`}
                              dir="rtl"
                            >
                              {ayahText}
                              {renderAyahMarker(currentAyah.ayah)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {revealedAyahs.map((ra, i) => {
                  const hasBismillahHeader = showsBismillahHeader(
                    ra.surah,
                    ra.ayah
                  );
                  return (
                    <div
                      key={i}
                      data-wheel-card
                      className="wheel-card animate-slide-up"
                    >
                      {hasBismillahHeader && (
                        <div className="text-center mb-3">
                          {!hideSurahName && (
                            <div className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5">
                              {surahs[ra.surah - 1].nameArabic} —{" "}
                              {surahs[ra.surah - 1].name}
                            </div>
                          )}
                          <span
                            className={`bismillah-glyph ${sizes.revealed} text-neutral-700 dark:text-neutral-200`}
                            dir="rtl"
                          >
                            {BISMILLAH_DISPLAY}
                          </span>
                        </div>
                      )}
                      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6">
                        {!hideSurahName && (
                          <div className="text-center mb-3 flex items-center justify-center gap-2">
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">
                              {surahs[ra.surah - 1].nameArabic} : {ra.ayah}
                            </span>
                            {ra.isEndOfSurah && (
                              <span className="text-[10px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/60">
                                Last ayah
                              </span>
                            )}
                          </div>
                        )}
                        <p
                          className={`font-quran ${sizes.revealed} leading-[2.2] text-neutral-700 dark:text-neutral-200 text-right`}
                          dir="rtl"
                        >
                          {ra.text}
                          {renderAyahMarker(ra.ayah)}
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
                className="flex-1 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-200 active:scale-[0.99]"
              >
                {promptOnly ? "Reveal First Ayah" : "Reveal Next Ayah"}
              </button>
              <button
                onClick={revealRemainingPage}
                className="flex-1 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-200 active:scale-[0.99]"
              >
                Reveal More (+10)
              </button>
            </div>

            <button
              onClick={rollNewAyah}
              className="w-full py-3.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium rounded-xl transition-all duration-200 active:scale-[0.99]"
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
