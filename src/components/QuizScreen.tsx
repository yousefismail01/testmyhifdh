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
import type { Settings, SettingsActions, FontSize } from "../App";
import SettingsPanel from "./SettingsPanel";
import { juzData } from "../data/quran-meta";

interface Props {
  range: SelectedRange;
  onBack: () => void;
  onRangeChange: (r: SelectedRange) => void;
  settings: Settings;
  actions: SettingsActions;
}

function RangePopover({
  current,
  onApply,
  onClose,
}: {
  current: SelectedRange;
  onApply: (r: SelectedRange) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState(current.mode);
  const [juzNumber, setJuzNumber] = useState(current.juzNumber ?? 30);
  const [startSurah, setStartSurah] = useState(current.startSurah ?? 1);
  const [endSurah, setEndSurah] = useState(current.endSurah ?? 1);
  const [startAyah, setStartAyah] = useState(current.startAyah ?? 1);
  const [endAyah, setEndAyah] = useState(
    current.endAyah ?? surahs[(current.endSurah ?? 1) - 1].ayahCount
  );
  const [startPage, setStartPage] = useState(current.startPage ?? 1);
  const [endPage, setEndPage] = useState(current.endPage ?? 20);

  const startSurahInfo = surahs[startSurah - 1];
  const endSurahInfo = surahs[endSurah - 1];
  const effectiveStartAyah = Math.max(
    1,
    Math.min(startAyah, startSurahInfo.ayahCount)
  );
  const effectiveEndAyah = Math.max(
    startSurah === endSurah ? effectiveStartAyah : 1,
    Math.min(endAyah, endSurahInfo.ayahCount)
  );

  const apply = () => {
    if (mode === "juz") onApply({ mode, juzNumber });
    else if (mode === "surah")
      onApply({
        mode,
        startSurah,
        endSurah: Math.max(startSurah, endSurah),
        startAyah: effectiveStartAyah,
        endAyah: effectiveEndAyah,
      });
    else
      onApply({
        mode,
        startPage,
        endPage: Math.max(startPage, endPage),
      });
    onClose();
  };

  const tabs = [
    { value: "juz" as const, label: "Juz" },
    { value: "surah" as const, label: "Surah" },
    { value: "page" as const, label: "Page" },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 mb-4 animate-fade-in">
      <div className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setMode(tab.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              mode === tab.value
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "juz" && (
        <div className="grid grid-cols-6 gap-1">
          {juzData.map((j) => (
            <button
              key={j.number}
              onClick={() => setJuzNumber(j.number)}
              className={`py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                juzNumber === j.number
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                  : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              }`}
            >
              {j.number}
            </button>
          ))}
        </div>
      )}

      {mode === "surah" && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                From Surah
              </label>
              <select
                value={startSurah}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setStartSurah(v);
                  if (endSurah < v) {
                    setEndSurah(v);
                    setEndAyah(surahs[v - 1].ayahCount);
                  }
                  setStartAyah(1);
                }}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                {surahs.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                Ayah
              </label>
              <input
                type="number"
                min={1}
                max={startSurahInfo.ayahCount}
                value={effectiveStartAyah}
                onChange={(e) =>
                  setStartAyah(
                    Math.max(
                      1,
                      Math.min(
                        startSurahInfo.ayahCount,
                        Number(e.target.value)
                      )
                    )
                  )
                }
                className="w-full px-2 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                To Surah
              </label>
              <select
                value={endSurah}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setEndSurah(v);
                  setEndAyah(surahs[v - 1].ayahCount);
                }}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              >
                {surahs
                  .filter((s) => s.number >= startSurah)
                  .map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="w-20">
              <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                Ayah
              </label>
              <input
                type="number"
                min={startSurah === endSurah ? effectiveStartAyah : 1}
                max={endSurahInfo.ayahCount}
                value={effectiveEndAyah}
                onChange={(e) =>
                  setEndAyah(
                    Math.max(
                      startSurah === endSurah ? effectiveStartAyah : 1,
                      Math.min(endSurahInfo.ayahCount, Number(e.target.value))
                    )
                  )
                }
                className="w-full px-2 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
          </div>
        </div>
      )}

      {mode === "page" && (
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
              From Page
            </label>
            <input
              type="number"
              min={1}
              max={604}
              value={startPage}
              onChange={(e) =>
                setStartPage(Math.max(1, Math.min(604, Number(e.target.value))))
              }
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
              To Page
            </label>
            <input
              type="number"
              min={startPage}
              max={604}
              value={endPage}
              onChange={(e) =>
                setEndPage(
                  Math.max(startPage, Math.min(604, Number(e.target.value)))
                )
              }
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={onClose}
          className="flex-1 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={apply}
          className="flex-1 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
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
  onRangeChange,
  settings,
  actions,
}: Props) {
  const { fontSize, hideSurahName, testFirstAyahs, showAyahNumbers } = settings;
  const [ayahPool, setAyahPool] = useState<AyahReference[]>([]);
  const [currentAyah, setCurrentAyah] = useState<AyahReference | null>(null);
  const [ayahText, setAyahText] = useState("");
  const [revealedAyahs, setRevealedAyahs] = useState<RevealedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const lastRevealedRef = useRef<AyahReference | null>(null);

  const sizes = FONT_SIZES[fontSize];
  const [showSettings, setShowSettings] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
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
      const base = getSurahRange(range.startSurah!, range.endSurah!);
      r = {
        startSurah: base.startSurah,
        startAyah: range.startAyah ?? base.startAyah,
        endSurah: base.endSurah,
        endAyah: range.endAyah ?? base.endAyah,
      };
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
        // Tighter focus zone: cards reach full rotation closer to focus,
        // so every card visible in the viewport noticeably curves rather
        // than just the topmost extreme.
        const dist = (centers[i] - focusY) / (scH / 3.5);
        const clamped = Math.max(-1.4, Math.min(1.4, dist));
        const rotateX = -clamped * 55;
        const scale = 1 - Math.abs(clamped) * 0.18;
        const translateZ = -Math.abs(clamped) * 100;
        // Hinge cards at the edge nearest the focus point so adjacent cards
        // stay visually connected at their shared edges.
        card.style.transformOrigin =
          dist < 0 ? "center bottom" : dist > 0 ? "center top" : "center";
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
      const sName = surahs[range.startSurah! - 1].name;
      const eName = surahs[range.endSurah! - 1].name;
      const sCount = surahs[range.startSurah! - 1].ayahCount;
      const eCount = surahs[range.endSurah! - 1].ayahCount;
      const sA = range.startAyah ?? 1;
      const eA = range.endAyah ?? eCount;
      const sPartial = sA > 1;
      const ePartial = eA < eCount;
      if (range.startSurah === range.endSurah) {
        if (!sPartial && !ePartial) return sName;
        if (sA === eA) return `${sName} ${sA}`;
        return `${sName} ${sA}-${eA}`;
      }
      const sLabel = sPartial ? `${sName} ${sA}` : sName;
      const eLabel = ePartial ? `${eName} ${eA}` : eName;
      void sCount;
      return `${sLabel} – ${eLabel}`;
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
            <button
              onClick={() => {
                setShowRangePicker((v) => !v);
                if (!showRangePicker) setShowSettings(false);
              }}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                showRangePicker
                  ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900"
                  : "text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300"
              }`}
              aria-label="Change range"
            >
              {getRangeLabel()}
              <svg
                className={`w-3 h-3 transition-transform ${showRangePicker ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                setShowSettings((v) => !v);
                if (!showSettings) setShowRangePicker(false);
              }}
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

        {showRangePicker && (
          <RangePopover
            current={range}
            onApply={onRangeChange}
            onClose={() => setShowRangePicker(false)}
          />
        )}

        {showSettings && (
          <div className="mb-4">
            <SettingsPanel settings={settings} actions={actions} />
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
