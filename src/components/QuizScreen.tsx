import {
  Fragment,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  surahs,
  getAyahsInRange,
  getJuzRange,
  getSurahRange,
  getAyahsInJuzs,
  pickWeightedRandomAyah,
  type AyahReference,
} from "../data/quran-meta";
import {
  type SelectedRange,
  getSelectedJuzs,
  formatJuzList,
} from "../types/range";
import { useDragSelect } from "../hooks/useDragSelect";
import { useKeyboard } from "../hooks/useKeyboard";
import type { Settings, SettingsActions } from "../App";
import SettingsOverlay from "./SettingsOverlay";
import AyahText from "./AyahText";
import JuzCustomizer from "./JuzCustomizer";
import { juzData } from "../data/quran-meta";
import { ensurePageFont, getTajweedRuns } from "../data/quran-tajweed";
import { useT } from "../i18n/useT";

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
  onCustomize,
  language,
}: {
  current: SelectedRange;
  onApply: (r: SelectedRange) => void;
  onClose: () => void;
  onCustomize: (juzs: number[]) => void;
  language: Settings["language"];
}) {
  const t = useT(language);
  // The popover edits juz/surah/page. A custom selection falls back to the
  // juz tab seeded with its origin juz(s) so the user can either re-pick
  // or click Customize again.
  type SimpleMode = "juz" | "surah" | "page";
  const initialMode: SimpleMode =
    current.mode === "custom" ? "juz" : current.mode;
  const [mode, setMode] = useState<SimpleMode>(initialMode);
  const [selectedJuzs, setSelectedJuzs] = useState<Set<number>>(() => {
    const seeds = getSelectedJuzs(current);
    return new Set(seeds.length > 0 ? seeds : [30]);
  });
  // Two-tap range fill: first unselected tap sets an anchor + adds the
  // juz; second unselected tap unions every juz between anchor and tap
  // into the selection. A tap on a selected juz deselects it (and any
  // anchor is cleared).
  const [juzAnchor, setJuzAnchor] = useState<number | null>(null);
  const toggleJuz = (n: number) =>
    setSelectedJuzs((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
        setJuzAnchor(null);
        return next;
      }
      if (juzAnchor === null) {
        next.add(n);
        setJuzAnchor(n);
        return next;
      }
      const lo = Math.min(juzAnchor, n);
      const hi = Math.max(juzAnchor, n);
      for (let j = lo; j <= hi; j++) next.add(j);
      setJuzAnchor(null);
      return next;
    });
  const sortedJuzs = Array.from(selectedJuzs).sort((a, b) => a - b);

  const setJuz = (n: number, selected: boolean) => {
    setSelectedJuzs((prev) => {
      const next = new Set(prev);
      if (selected) next.add(n);
      else next.delete(n);
      return next;
    });
    setJuzAnchor(null);
  };
  const bindJuzDrag = useDragSelect<number>({
    items: juzData.map((j) => j.number),
    isSelected: (n) => selectedJuzs.has(n),
    onTap: toggleJuz,
    setItem: setJuz,
  });
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
    if (mode === "juz") onApply({ mode, juzNumbers: sortedJuzs });
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
    { value: "juz" as const, label: t("tabJuz") },
    { value: "surah" as const, label: t("tabSurah") },
    { value: "page" as const, label: t("tabPage") },
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
        <div>
          <div className="flex items-baseline justify-end gap-3 mb-2">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 tabular-nums">
              {sortedJuzs.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedJuzs(new Set());
                setJuzAnchor(null);
              }}
              disabled={sortedJuzs.length === 0}
              className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {t("clearAll")}
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1 select-none touch-none">
            {juzData.map((j) => {
              const isSelected = selectedJuzs.has(j.number);
              const isAnchor = juzAnchor === j.number;
              return (
                <button
                  key={j.number}
                  type="button"
                  {...bindJuzDrag(j.number)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isAnchor
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 ring-2 ring-amber-400 dark:ring-amber-300"
                      : isSelected
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  }`}
                >
                  {j.number}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              onCustomize(sortedJuzs);
              onClose();
            }}
            disabled={sortedJuzs.length === 0}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("customizeRange")}
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {mode === "surah" && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                {t("fromSurah")}
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
                {t("ayah")}
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
                {t("toSurah")}
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
                {t("ayah")}
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
              {t("fromPage")}
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
              {t("toPage")}
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
          {t("cancel")}
        </button>
        <button
          onClick={apply}
          disabled={mode === "juz" && sortedJuzs.length === 0}
          className="flex-1 py-2 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {t("apply")}
        </button>
      </div>
    </div>
  );
}


interface RevealedAyah {
  surah: number;
  ayah: number;
  isEndOfSurah: boolean;
}

export default function QuizScreen({
  range,
  onBack,
  onRangeChange,
  settings,
  actions,
}: Props) {
  const {
    fontSize,
    hideSurahName,
    testFirstAyahs,
    showAyahNumbers,
    tajweed,
    language,
  } = settings;
  const t = useT(language);
  const [currentAyah, setCurrentAyah] = useState<AyahReference | null>(null);
  const [revealedAyahs, setRevealedAyahs] = useState<RevealedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const lastRevealedRef = useRef<AyahReference | null>(null);

  const ayahStyle: React.CSSProperties = { fontSize: `${fontSize}px` };
  // The Bismillah ligature glyph (﷽) is rendered very wide by most fonts,
  // so we cap it relative to the ayah size — same vertical metric, never
  // wider than ~80% of the ayah's font size — so it never overpowers the
  // verse beneath it.
  const bismillahStyle: React.CSSProperties = {
    fontSize: `${Math.min(36, Math.round(fontSize * 0.8))}px`,
  };
  const [showSettings, setShowSettings] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [customizing, setCustomizing] = useState<number[] | null>(null);
  const [promptOnly, setPromptOnly] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const rangeBounds = useMemo(() => {
    if (range.mode === "juz") {
      const juzs = getSelectedJuzs(range);
      if (juzs.length === 0)
        return { startSurah: 1, startAyah: 1, endSurah: 1, endAyah: 1 };
      if (juzs.length === 1) return getJuzRange(juzs[0]);
      const first = getJuzRange(juzs[0]);
      const last = getJuzRange(juzs[juzs.length - 1]);
      return {
        startSurah: first.startSurah,
        startAyah: first.startAyah,
        endSurah: last.endSurah,
        endAyah: last.endAyah,
      };
    }
    if (range.mode === "surah") {
      const base = getSurahRange(range.startSurah!, range.endSurah!);
      return {
        startSurah: base.startSurah,
        startAyah: range.startAyah ?? base.startAyah,
        endSurah: base.endSurah,
        endAyah: range.endAyah ?? base.endAyah,
      };
    }
    if (range.mode === "custom") {
      // Span the bounds from the first to the last selected ayah. Used by
      // the atRangeEnd indicator on the reveal reel; the actual roll pool
      // is the explicit customAyahs list (see ayahPool below).
      const refs = range.customAyahs ?? [];
      if (refs.length === 0) {
        return {
          startSurah: 1,
          startAyah: 1,
          endSurah: 1,
          endAyah: 1,
        };
      }
      const first = refs[0];
      const last = refs[refs.length - 1];
      return {
        startSurah: first.surah,
        startAyah: first.ayah,
        endSurah: last.surah,
        endAyah: last.ayah,
      };
    }
    const startPage = range.startPage!;
    const endPage = range.endPage!;
    let startSurah = 1;
    let endSurah = 114;
    for (const s of surahs) {
      if (s.startPage <= startPage) startSurah = s.number;
      if (s.startPage <= endPage) endSurah = s.number;
    }
    return {
      startSurah,
      startAyah: 1,
      endSurah,
      endAyah: surahs[endSurah - 1].ayahCount,
    };
  }, [range]);

  const ayahPool = useMemo<AyahReference[]>(() => {
    // Build the raw pool, then strip:
    //   (a) the last ayah of any surah — nothing to reveal next, and the
    //       reveal step would have to cross into the following surah which
    //       changes the context.
    //   (b) the last ayah of the user's selected range — if it got rolled
    //       the reveal buttons would be disabled instantly (atRangeEnd
    //       fires) so there'd be nothing to recite.
    const isRangeEnd = (a: AyahReference) =>
      a.surah === rangeBounds.endSurah && a.ayah === rangeBounds.endAyah;
    const promptable = (a: AyahReference) =>
      a.ayah < surahs[a.surah - 1].ayahCount && !isRangeEnd(a);

    if (range.mode === "custom") {
      return (range.customAyahs ?? []).filter(promptable);
    }
    if (range.mode === "juz") {
      // Union of every selected juz. Handles non-consecutive picks
      // correctly (gap juzs are excluded from the roll pool).
      const juzs = getSelectedJuzs(range);
      return getAyahsInJuzs(juzs).filter(promptable);
    }
    return getAyahsInRange(
      rangeBounds.startSurah,
      rangeBounds.startAyah,
      rangeBounds.endSurah,
      rangeBounds.endAyah
    ).filter(promptable);
  }, [range, rangeBounds]);

  const warmFontsFor = (ref: AyahReference) => {
    for (const run of getTajweedRuns(ref.surah, ref.ayah)) {
      ensurePageFont(run.p);
    }
  };

  const rollNewAyah = useCallback(() => {
    if (ayahPool.length === 0) return;
    setLoading(true);
    setRevealedAyahs([]);
    const picked = pickWeightedRandomAyah(ayahPool);
    warmFontsFor(picked);
    setCurrentAyah(picked);
    lastRevealedRef.current = picked;
    setPromptOnly(testFirstAyahs && picked.ayah === 1);
    setLoading(false);
  }, [ayahPool, testFirstAyahs]);

  // Auto-roll a fresh ayah whenever the pool changes (e.g. user picked a
  // new range). rollNewAyah sets state internally; that's exactly what
  // we want to react to here.
  useEffect(() => {
    if (ayahPool.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      rollNewAyah();
    }
  }, [ayahPool, rollNewAyah]);

  // The mask gradient on .reveal-mask handles the top/bottom fade; no
  // per-card transforms are needed. Keep an empty handler so the onScroll
  // and resize listeners stay wired without effect.
  const updateWheel = useCallback(() => {}, []);

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

  const revealNext = () => {
    if (!currentAyah || !lastRevealedRef.current) return;

    if (promptOnly) {
      const surahInfo = surahs[currentAyah.surah - 1];
      setPromptOnly(false);
      lastRevealedRef.current = { surah: currentAyah.surah, ayah: 1 };
      if (surahInfo.ayahCount === 1) {
        setRevealedAyahs((prev) => [
          ...prev,
          { surah: currentAyah.surah, ayah: 1, isEndOfSurah: true },
        ]);
      }
      return;
    }

    const nextRef = advanceOne(lastRevealedRef.current);
    if (!nextRef) return;
    warmFontsFor(nextRef);
    const nextSurahInfo = surahs[nextRef.surah - 1];
    lastRevealedRef.current = nextRef;
    setRevealedAyahs((prev) => [
      ...prev,
      {
        surah: nextRef.surah,
        ayah: nextRef.ayah,
        isEndOfSurah: nextRef.ayah === nextSurahInfo.ayahCount,
      },
    ]);
  };

  const revealRemainingPage = () => {
    if (!currentAyah || !lastRevealedRef.current) return;

    if (promptOnly) {
      revealNext();
      return;
    }

    const newRevealed: RevealedAyah[] = [];
    let cursor: AyahReference | null = lastRevealedRef.current;
    for (let i = 0; i < 10; i++) {
      const nextRef = advanceOne(cursor);
      if (!nextRef) break;
      warmFontsFor(nextRef);
      const surahInfo = surahs[nextRef.surah - 1];
      newRevealed.push({
        surah: nextRef.surah,
        ayah: nextRef.ayah,
        isEndOfSurah: nextRef.ayah === surahInfo.ayahCount,
      });
      cursor = nextRef;
    }

    if (cursor) lastRevealedRef.current = cursor;
    setRevealedAyahs((prev) => [...prev, ...newRevealed]);
  };

  // Whether any modal/overlay owns the keyboard right now. While one is
  // open, only "Escape" (handled by the overlays themselves) should fire.
  const anyOverlayOpen =
    showSettings || showRangePicker || customizing !== null;

  useKeyboard(
    {
      // Reveal next ayah on Space or right/down arrow. Shift+Space jumps 10.
      " ": (e) => {
        e.preventDefault();
        if (atRangeEnd) return;
        if (e.shiftKey) revealRemainingPage();
        else revealNext();
      },
      ArrowRight: (e) => {
        e.preventDefault();
        if (!atRangeEnd) revealNext();
      },
      ArrowDown: (e) => {
        e.preventDefault();
        if (!atRangeEnd) revealNext();
      },
      Enter: () => {
        if (!atRangeEnd) revealRemainingPage();
      },
      n: () => rollNewAyah(),
      r: () => rollNewAyah(),
      Escape: () => onBack(),
      Backspace: () => onBack(),
      s: () => {
        setShowSettings((v) => !v);
        if (!showSettings) setShowRangePicker(false);
      },
      t: () =>
        actions.setTheme(settings.theme === "dark" ? "light" : "dark"),
    },
    !anyOverlayOpen
  );

  // When an overlay is open, Escape closes it (highest priority first).
  useKeyboard(
    {
      Escape: () => {
        if (customizing !== null) setCustomizing(null);
        else if (showRangePicker) setShowRangePicker(false);
        else if (showSettings) setShowSettings(false);
      },
    },
    anyOverlayOpen
  );

  const getRangeLabel = () => {
    if (range.mode === "juz") return formatJuzList(getSelectedJuzs(range));
    if (range.mode === "custom") {
      const count = range.customAyahs?.length ?? 0;
      const juzs = getSelectedJuzs(range);
      const base = juzs.length > 0 ? formatJuzList(juzs) : t("customLabel");
      return `${base} · ${count}`;
    }
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


  const currentSurahInfo = currentAyah ? surahs[currentAyah.surah - 1] : null;
  const isLastAyah =
    currentAyah && currentSurahInfo
      ? currentAyah.ayah === currentSurahInfo.ayahCount
      : false;

  // True once the user has reached the final ayah of the selected range
  // (either it was the rolled ayah with nothing revealed yet, or they've
  // revealed forward to it). The reveal buttons disable here.
  const lastShown =
    revealedAyahs.length > 0
      ? revealedAyahs[revealedAyahs.length - 1]
      : currentAyah;
  const atRangeEnd =
    !!lastShown &&
    !promptOnly &&
    lastShown.surah === rangeBounds.endSurah &&
    lastShown.ayah === rangeBounds.endAyah;

  // Swipe-right-to-go-back gesture for mobile / PWA. Recorded on touchstart,
  // committed on touchend if the swipe is mostly horizontal, > 70px, and
  // started within the leftmost portion of the viewport so it doesn't fire
  // accidentally while reading.
  const swipeStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.t;
    if (
      dx > 70 &&
      Math.abs(dx) > Math.abs(dy) * 2 &&
      dt < 600 &&
      start.x < window.innerWidth * 0.5
    ) {
      onBack();
    }
  };

  return (
    <div
      className="relative bg-white dark:bg-neutral-950 animate-fade-in flex flex-col overflow-hidden h-dvh"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <SettingsOverlay
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        actions={actions}
      />
      {customizing !== null && (
        <JuzCustomizer
          juzNumbers={customizing}
          language={language}
          onCancel={() => setCustomizing(null)}
          onApply={(customAyahs) => {
            const juzs = customizing;
            setCustomizing(null);
            onRangeChange({
              mode: "custom",
              juzNumbers: juzs,
              customAyahs,
            });
          }}
        />
      )}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-4 flex flex-col flex-1 min-h-0">
        <div className="relative z-50 flex items-center justify-between pb-4 shrink-0">
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
            {t("back")}
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
              aria-label={t("changeRange")}
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
              aria-label={t("settings")}
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
            onCustomize={(juzs) => setCustomizing(juzs)}
            language={language}
          />
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
              <div className="flex flex-col gap-6 pt-12 pb-12">
                {currentAyah &&
                  (() => {
                    const hasBismillahHeader =
                      !promptOnly &&
                      showsBismillahHeader(currentAyah.surah, currentAyah.ayah);
                    return (
                      <>
                        {hasBismillahHeader && (
                          <div className="text-center my-4 animate-fade-in-soft">
                            <span
                              className="bismillah-glyph text-neutral-700 dark:text-neutral-200"
                              style={bismillahStyle}
                              dir="rtl"
                            >
                              {BISMILLAH_DISPLAY}
                            </span>
                          </div>
                        )}
                        <div
                          data-wheel-card
                          className="wheel-card bg-white dark:bg-neutral-900 rounded-3xl border-2 border-neutral-900/10 dark:border-neutral-100/15 p-7 ring-1 ring-neutral-900/5 dark:ring-neutral-100/10"
                        >
                          {!hideSurahName && !promptOnly && (
                            <div className="text-center mb-4 flex items-center justify-center gap-2">
                              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                                {currentSurahInfo!.nameArabic} —{" "}
                                {currentSurahInfo!.name} : {currentAyah.ayah}
                              </span>
                              {isLastAyah && (
                                <span className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/60">
                                  {t("lastAyah")}
                                </span>
                              )}
                            </div>
                          )}

                          {promptOnly ? (
                            <div className="text-center py-6">
                              <div className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
                                {t("whatsFirstAyahOf")}
                              </div>
                              <div className="font-quran text-5xl text-neutral-900 dark:text-neutral-100 mb-1">
                                {currentSurahInfo!.nameArabic}
                              </div>
                              <div className="text-neutral-500 dark:text-neutral-400 text-sm">
                                {currentSurahInfo!.name}
                              </div>
                            </div>
                          ) : (
                            <AyahText
                              surah={currentAyah.surah}
                              ayah={currentAyah.ayah}
                              showMarker={showAyahNumbers}
                              tajweed={tajweed}
                              className="font-quran leading-[2.4] text-neutral-800 dark:text-neutral-200 text-right"
                              style={ayahStyle}
                            />
                          )}
                        </div>
                      </>
                    );
                  })()}

                {revealedAyahs.map((ra, i) => {
                  const hasBismillahHeader = showsBismillahHeader(
                    ra.surah,
                    ra.ayah
                  );
                  return (
                    <Fragment key={i}>
                      {hasBismillahHeader && (
                        <div className="text-center my-4 animate-fade-in-soft">
                          {!hideSurahName && (
                            <div className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5">
                              {surahs[ra.surah - 1].nameArabic} —{" "}
                              {surahs[ra.surah - 1].name}
                            </div>
                          )}
                          <span
                            className="bismillah-glyph text-neutral-700 dark:text-neutral-200"
                            style={bismillahStyle}
                            dir="rtl"
                          >
                            {BISMILLAH_DISPLAY}
                          </span>
                        </div>
                      )}
                      <div
                        data-wheel-card
                        className="wheel-card animate-fade-in-soft bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6"
                      >
                        {!hideSurahName && (
                          <div className="text-center mb-3 flex items-center justify-center gap-2">
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">
                              {surahs[ra.surah - 1].nameArabic} : {ra.ayah}
                            </span>
                            {ra.isEndOfSurah && (
                              <span className="text-[10px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/60">
                                {t("lastAyah")}
                              </span>
                            )}
                          </div>
                        )}
                        <AyahText
                          surah={ra.surah}
                          ayah={ra.ayah}
                          showMarker={showAyahNumbers}
                          tajweed={tajweed}
                          className="font-quran leading-[2.2] text-neutral-800 dark:text-neutral-200 text-right"
                          style={ayahStyle}
                        />
                      </div>
                    </Fragment>
                  );
                })}

                {atRangeEnd && (
                  <div className="text-center text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 pt-2 pb-4 animate-fade-in-soft">
                    {t("endOfRange")}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 pt-3">
            <div className="flex gap-3 mb-3">
              <button
                onClick={revealNext}
                disabled={atRangeEnd}
                className="flex-1 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
              >
                {promptOnly ? t("revealFirstAyah") : t("revealNextAyah")}
              </button>
              <button
                onClick={revealRemainingPage}
                disabled={atRangeEnd}
                className="flex-1 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
              >
                {t("revealMore")}
              </button>
            </div>

            <button
              onClick={rollNewAyah}
              className="w-full py-3.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium rounded-xl transition-all duration-200 active:scale-[0.99]"
            >
              {t("nextRandomAyah")}
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
