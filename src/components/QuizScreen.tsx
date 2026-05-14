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
  localizeNumber,
} from "../types/range";
import { useDragSelect } from "../hooks/useDragSelect";
import { useKeyboard } from "../hooks/useKeyboard";
import { useTajweedReady } from "../hooks/useTajweedReady";
import type { Settings, SettingsActions } from "../App";
import SettingsOverlay from "./SettingsOverlay";
import AyahText from "./AyahText";
import JuzCustomizer from "./JuzCustomizer";
import KeyboardHelp from "./KeyboardHelp";
import SurahCombobox from "./SurahCombobox";
import AudioOverlay from "./AudioOverlay";
import VolumeIcon from "./VolumeIcon";
import HintButton from "./HintButton";
import KbdHint from "./KbdHint";
import AyahAudioButton from "./AyahAudioButton";
import { takeAudioFocus, releaseAudioFocus } from "../lib/audio-focus";
import {
  routeThroughGain,
  setGain,
  useGainForVolume,
} from "../lib/audio-gain";
import AyahTranslation from "./AyahTranslation";
import TranslationHint from "./TranslationHint";
// QuizSidebar removed — hint card and similar-verses now render
// inline beneath the reveal stream / each ayah card on every
// breakpoint.
import AyahSimilarHint from "./AyahSimilarHint";
import { getSimilarAyahs, isSimilarReady, loadSimilar } from "../data/similar-ayahs";
import {
  getReciter,
  loadReciterSegments,
  getCachedReciterSegments,
  loadReciterWordsForSurah,
  getCachedWordTimings,
} from "../data/reciters";
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
      <div
        role="tablist"
        className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-1 mb-4"
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          const idx = tabs.findIndex((tt) => tt.value === mode);
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const next = (idx + dir + tabs.length) % tabs.length;
          setMode(tabs[next].value);
          e.preventDefault();
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={mode === tab.value}
            tabIndex={mode === tab.value ? 0 : -1}
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
              <SurahCombobox
                value={startSurah}
                onChange={(v) => {
                  setStartSurah(v);
                  if (endSurah < v) {
                    setEndSurah(v);
                    setEndAyah(surahs[v - 1].ayahCount);
                  }
                  setStartAyah(1);
                }}
                language={language}
                ariaLabel={t("fromSurah")}
              />
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
              <SurahCombobox
                value={endSurah}
                onChange={(v) => {
                  setEndSurah(v);
                  setEndAyah(surahs[v - 1].ayahCount);
                }}
                language={language}
                minSurah={startSurah}
                ariaLabel={t("toSurah")}
              />
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
    reciter,
    audioOnly,
    autoPlay,
    volume,
    playbackSpeed,
    loop,
    mutashabihatMode,
    showTranslation,
    showSimilarPhrases,
  } = settings;
  const t = useT(language);
  const [currentAyah, setCurrentAyah] = useState<AyahReference | null>(null);
  const [revealedAyahs, setRevealedAyahs] = useState<RevealedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const tajweedReady = useTajweedReady();
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
  const [showHelp, setShowHelp] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  // Word-by-word highlight state. Keyed by the surah:ayah being played
  // so we can swap highlights between the prompt and revealed cards.
  const [highlightedAyahKey, setHighlightedAyahKey] = useState<string | null>(
    null
  );
  const [highlightedWordIdx, setHighlightedWordIdx] = useState<number>(-1);
  // A version counter that bumps whenever word-timing data lands for
  // a surah we care about — used to re-render so resolveWordIndex
  // picks up the newly-loaded data.
  const [wordsLoadVersion, setWordsLoadVersion] = useState(0);
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

  // Trigger the similar-ayahs fetch when the user enables mutashabihat
  // mode — the pool filter needs the index loaded to work. Cheap (~24
  // KB gzipped) so we can do it whenever the toggle flips on.
  useEffect(() => {
    if (mutashabihatMode) void loadSimilar();
  }, [mutashabihatMode]);
  const [similarReady, setSimilarReady] = useState<boolean>(isSimilarReady);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!mutashabihatMode) return;
    if (isSimilarReady()) {
      setSimilarReady(true);
      return;
    }
    let cancelled = false;
    void loadSimilar().then(() => {
      if (!cancelled) setSimilarReady(isSimilarReady());
    });
    return () => {
      cancelled = true;
    };
  }, [mutashabihatMode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const ayahPool = useMemo<AyahReference[]>(() => {
    // Build the raw pool, then strip:
    //   (a) the last ayah of any surah — nothing to reveal next, and the
    //       reveal step would have to cross into the following surah which
    //       changes the context.
    //   (b) the last ayah of the user's selected range — if it got rolled
    //       the reveal buttons would be disabled instantly (atRangeEnd
    //       fires) so there'd be nothing to recite.
    //   (c) when mutashabihatMode is on AND the similar index is loaded,
    //       only ayahs with at least one recorded similar verse pass.
    const isRangeEnd = (a: AyahReference) =>
      a.surah === rangeBounds.endSurah && a.ayah === rangeBounds.endAyah;
    const hasSimilar = (a: AyahReference) =>
      getSimilarAyahs(a.surah, a.ayah).length > 0;
    const promptable = (a: AyahReference) => {
      if (a.ayah >= surahs[a.surah - 1].ayahCount) return false;
      if (isRangeEnd(a)) return false;
      if (mutashabihatMode && similarReady && !hasSimilar(a)) return false;
      return true;
    };

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
  }, [range, rangeBounds, mutashabihatMode, similarReady]);

  const warmFontsFor = (ref: AyahReference) => {
    for (const run of getTajweedRuns(ref.surah, ref.ayah)) {
      ensurePageFont(run.p);
    }
  };

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

  // Progressive on-demand hints. Each counter represents how many "doses"
  // of that hint the user has unlocked for the NEXT ayah (the one
  // they're trying to recite from memory). All reset on every roll and
  // on every reveal — the "next ayah" pointer shifts after a reveal, so
  // the hint cycle restarts for the new target.
  //   firstWord — how many leading words to show
  //   audio     — step count; each step plays 1.5s longer
  //   translation — how many word-chunks to show (8 words per chunk)
  const HINT_AUDIO_STEP_MS = 1500;
  const HINT_TRANSLATION_WORDS_PER_STEP = 8;
  const [hintFirstWordCount, setHintFirstWordCount] = useState(0);
  const [hintAudioStep, setHintAudioStep] = useState(0);
  const [hintTranslationStep, setHintTranslationStep] = useState(0);
  const [hintMenuOpen, setHintMenuOpen] = useState(false);
  // Which hint type was last triggered. Long-press on the Hint button
  // cycles to the next type and fires it immediately, skipping the
  // menu — power users can drill faster.
  type HintType = "firstWord" | "audio" | "translation";
  const [lastHintType, setLastHintType] = useState<HintType>("firstWord");

  const resetHints = () => {
    setHintFirstWordCount(0);
    setHintAudioStep(0);
    setHintTranslationStep(0);
    setHintMenuOpen(false);
    setLastHintType("firstWord");
  };

  const resetHighlight = () => {
    setHighlightedAyahKey(null);
    setHighlightedWordIdx(-1);
  };
  const snippetAudioRef = useRef<HTMLAudioElement | null>(null);
  // Incremented on every audio-hint click so a slow segment fetch can
  // detect that a newer click superseded it and abort instead of
  // creating a second Audio element.
  const snippetVersionRef = useRef(0);
  const snippetHolderRef = useRef<{ stop: () => void }>({
    stop: () => {
      const a = snippetAudioRef.current;
      if (a && !a.paused) a.pause();
    },
  });

  /**
   * Audio-hint snippet of the *next* ayah (the verse the user is trying
   * to recite). Duration grows on each press (step * HINT_AUDIO_STEP_MS),
   * up to the ayah's natural end. Surah-mode reciters seek into their
   * whole-surah file and pause at toMs (or duration cap, whichever
   * comes first). Coordinated with the main AyahAudioButton via the
   * shared audio-focus holder so the two can't overlap.
   */
  // Synchronous on purpose: audio.play() must stay inside the user
  // gesture for iOS Safari to allow playback. Segment data is read
  // from the cache; if cold, we still play (from t=0) and seek when
  // the async fetch resolves. App.tsx pre-warms segments on reciter
  // change, so the cold path is rare.
  const playAudioHint = (step: number) => {
    if (!hintTarget) return;
    takeAudioFocus(snippetHolderRef.current);
    const prev = snippetAudioRef.current;
    if (prev) {
      prev.pause();
      prev.src = "";
      prev.remove();
      snippetAudioRef.current = null;
    }
    const myVersion = ++snippetVersionRef.current;
    const info = getReciter(reciter);
    const url = info.audioUrl(hintTarget.surah, hintTarget.ayah);

    // DOM-mounted audio element for iOS Safari reliability.
    const a = document.createElement("audio");
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    a.src = url;
    // Element volume on non-iOS; Web Audio GainNode on iOS.
    if (useGainForVolume) {
      a.volume = 1;
      setGain(volume);
    } else {
      a.volume = Math.max(0, Math.min(1, volume / 100));
    }
    a.style.position = "absolute";
    a.style.width = "1px";
    a.style.height = "1px";
    a.style.opacity = "0";
    a.style.pointerEvents = "none";
    document.body.appendChild(a);
    routeThroughGain(a);
    snippetAudioRef.current = a;

    const applyBounds = (fromMs: number, toMs: number) => {
      if (myVersion !== snippetVersionRef.current) return;
      const requestedMs = step * HINT_AUDIO_STEP_MS;
      const stopAtMs = Math.min(fromMs + requestedMs, toMs);
      const stopAt = stopAtMs / 1000;
      if (a.readyState >= 1) {
        a.currentTime = fromMs / 1000;
      } else {
        a.addEventListener("loadedmetadata", () => {
          a.currentTime = fromMs / 1000;
        });
      }
      a.addEventListener("timeupdate", () => {
        if (a.currentTime >= stopAt) {
          a.pause();
          releaseAudioFocus(snippetHolderRef.current);
        }
      });
      a.addEventListener("ended", () =>
        releaseAudioFocus(snippetHolderRef.current)
      );
    };

    if (info.mode === "surah") {
      const cached = getCachedReciterSegments(reciter);
      if (cached) {
        const seg = cached[`${hintTarget.surah}:${hintTarget.ayah}`];
        applyBounds(seg ? seg[0] : 0, seg ? seg[1] : Infinity);
      } else {
        // Cold start — apply bounds when segments arrive. Until then
        // the snippet plays from the surah start; pre-warming makes
        // this nearly impossible to hit in practice.
        void loadReciterSegments(reciter).then((segs) => {
          const seg = segs[`${hintTarget.surah}:${hintTarget.ayah}`];
          applyBounds(seg ? seg[0] : 0, seg ? seg[1] : Infinity);
        });
      }
    } else {
      applyBounds(0, Infinity);
    }

    a.load();
    a.play().catch((err) => {
      console.warn("audio snippet play failed", err);
      releaseAudioFocus(snippetHolderRef.current);
    });
  };

  // Stop any in-flight snippet when the ayah changes.
  useEffect(() => {
    return () => {
      const a = snippetAudioRef.current;
      if (a) {
        a.pause();
        a.src = "";
        a.remove();
        snippetAudioRef.current = null;
      }
    };
  }, [currentAyah]);

  const rollNewAyah = useCallback(() => {
    if (ayahPool.length === 0) return;
    setLoading(true);
    setRevealedAyahs([]);
    const picked = pickWeightedRandomAyah(ayahPool);
    warmFontsFor(picked);
    // Pre-warm the next-ayah's QPC v4 font too. That's the hint target
    // before any reveal happens; starting the fetch *now* (instead of
    // in a post-render useEffect) gives the woff2 the longest possible
    // head-start. By the time the user looks at the prompt and clicks
    // Hint, the font has usually landed and the first click renders a
    // word immediately rather than a spinner.
    const nextForHint = advanceOne(picked);
    if (nextForHint) warmFontsFor(nextForHint);
    setCurrentAyah(picked);
    lastRevealedRef.current = picked;
    setPromptOnly(testFirstAyahs && picked.ayah === 1);
    resetHints();
    resetHighlight();
    setLoading(false);
  }, [ayahPool, testFirstAyahs]);

  // Auto-roll a fresh ayah whenever the pool changes (e.g. user picked a
  // new range). Wait for the tajweed data to land first — otherwise
  // AyahText would render empty until the fetch resolves.
  useEffect(() => {
    if (ayahPool.length > 0 && tajweedReady) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      rollNewAyah();
    }
  }, [ayahPool, rollNewAyah, tajweedReady]);

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
      // Reveal moves the next-ayah pointer, so the hint card now
      // belongs to a different target. Tear it down — the user can
      // request a fresh hint if they want one for the new ayah.
      resetHints();
    resetHighlight();
      return;
    }

    const nextRef = advanceOne(lastRevealedRef.current);
    if (!nextRef) return;
    warmFontsFor(nextRef);
    // Look one further ahead — that becomes the new hint target the
    // moment this reveal applies. Same eager-warm rationale as
    // rollNewAyah.
    const afterNext = advanceOne(nextRef);
    if (afterNext) warmFontsFor(afterNext);
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
    resetHints();
    resetHighlight();
  };

  // Whether any modal/overlay owns the keyboard right now. While one is
  // open, only "Escape" (handled by the overlays themselves) should fire.
  const anyOverlayOpen =
    showSettings ||
    showRangePicker ||
    customizing !== null ||
    showHelp ||
    showVolume;

  useKeyboard(
    {
      // Reveal next ayah on Space or right/down arrow.
      " ": (e) => {
        e.preventDefault();
        if (!atRangeEnd) revealNext();
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
        if (!atRangeEnd) revealNext();
      },
      h: () => setHintMenuOpen((v) => !v),
      n: () => rollNewAyah(),
      r: () => rollNewAyah(),
      Escape: () => onBack(),
      Backspace: () => onBack(),
      s: () => {
        const next = !showSettings;
        setShowSettings(next);
        if (next) {
          setShowRangePicker(false);
          setShowVolume(false);
        }
      },
      t: () =>
        actions.setTheme(settings.theme === "dark" ? "light" : "dark"),
      "?": () => setShowHelp(true),
    },
    !anyOverlayOpen
  );

  // When an overlay is open, Escape closes it (highest priority first).
  useKeyboard(
    {
      Escape: () => {
        if (showHelp) setShowHelp(false);
        else if (customizing !== null) setCustomizing(null);
        else if (showVolume) setShowVolume(false);
        else if (showRangePicker) setShowRangePicker(false);
        else if (showSettings) setShowSettings(false);
      },
    },
    anyOverlayOpen
  );

  const getRangeLabel = () => {
    const n = (x: number) => localizeNumber(x, language);
    const juzWord = t("juzLabel");
    if (range.mode === "juz")
      return formatJuzList(getSelectedJuzs(range), language, juzWord);
    if (range.mode === "custom") {
      const count = range.customAyahs?.length ?? 0;
      const juzs = getSelectedJuzs(range);
      const base =
        juzs.length > 0
          ? formatJuzList(juzs, language, juzWord)
          : t("customLabel");
      return `${base} · ${n(count)}`;
    }
    if (range.mode === "surah") {
      // For non-English UIs prefer the Arabic surah name; the dropdowns
      // still let the user pick by transliteration, but the pill should
      // feel native once the range is locked in.
      const surahName = (s: number) =>
        language === "en"
          ? surahs[s - 1].name
          : surahs[s - 1].nameArabic;
      const sName = surahName(range.startSurah!);
      const eName = surahName(range.endSurah!);
      const eCount = surahs[range.endSurah! - 1].ayahCount;
      const sA = range.startAyah ?? 1;
      const eA = range.endAyah ?? eCount;
      const sPartial = sA > 1;
      const ePartial = eA < eCount;
      if (range.startSurah === range.endSurah) {
        if (!sPartial && !ePartial) return sName;
        if (sA === eA) return `${sName} ${n(sA)}`;
        return `${sName} ${n(sA)}-${n(eA)}`;
      }
      const sLabel = sPartial ? `${sName} ${n(sA)}` : sName;
      const eLabel = ePartial ? `${eName} ${n(eA)}` : eName;
      return `${sLabel} – ${eLabel}`;
    }
    return `${t("pagesLabel")} ${n(range.startPage!)} – ${n(range.endPage!)}`;
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

  // The setting `audioOnly` says "hide the prompt's text so the user
  // listens to recite". Once they've revealed past it (i.e. they've
  // checked themselves), the test is over — the prompt card reverts
  // to a regular text card. The setting stays on for the *next* roll.
  // Same idea as how promptOnly resets to false the moment the first
  // reveal happens.
  const effectiveAudioOnly = audioOnly && revealedAyahs.length === 0;

  /**
   * The ayah that hints target: the verse the user is *currently
   * trying to recite from memory*. That's:
   *   - In promptOnly mode (test first ayahs): the rolled ayah itself,
   *     whose text is hidden behind the surah-name prompt.
   *   - Otherwise: the ayah immediately following the last shown one.
   * Null if there's nothing to recite next (atRangeEnd, no current
   * ayah, etc.) — in which case the hint menu is disabled.
   */
  const hintTarget: AyahReference | null = (() => {
    if (!currentAyah) return null;
    if (promptOnly) return currentAyah;
    if (atRangeEnd) return null;
    if (!lastShown) return null;
    return advanceOne(lastShown);
  })();

  // Lazy-fetch per-surah word-timing slices for the active reciter as
  // ayahs come into play. The "interesting" surahs are the prompt's
  // and (if the user has revealed forward) any surahs reached by the
  // reveal stream. We trigger fetches here and bump a version counter
  // when they land so resolveWordIndex picks them up.
  const interestingSurahs = useMemo(() => {
    const s = new Set<number>();
    if (currentAyah) s.add(currentAyah.surah);
    for (const r of revealedAyahs) s.add(r.surah);
    return Array.from(s);
  }, [currentAyah, revealedAyahs]);
  const interestingSurahsKey = interestingSurahs.join(",");

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let cancelled = false;
    for (const s of interestingSurahs) {
      // Skip if already cached (single-ayah probe is enough — the
      // whole-surah slice loads atomically).
      if (getCachedWordTimings(reciter, s, 1) !== null) continue;
      void loadReciterWordsForSurah(reciter, s).then(() => {
        if (!cancelled) setWordsLoadVersion((v) => v + 1);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [reciter, interestingSurahsKey]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Resolve the word index for an audio playback time (in seconds) on
  // a given ayah. Returns -1 if no match (no data yet, or `timeSec`
  // falls in a gap between word segments).
  const resolveWordIndex = (
    surahNumber: number,
    ayahNumber: number,
    timeSec: number
  ): number => {
    const segs = getCachedWordTimings(reciter, surahNumber, ayahNumber);
    if (!segs) return -1;
    // wordsLoadVersion is read here so this closure invalidates each
    // time fresh data lands and the next timeupdate finds it.
    void wordsLoadVersion;
    const ms = timeSec * 1000;
    for (let i = 0; i < segs.length; i++) {
      const [from, to] = segs[i];
      if (ms >= from && ms <= to) return i;
    }
    return -1;
  };

  // Page numbers the hint target lives on (1-3 entries; usually 1).
  // Pre-warmed inline in rollNewAyah/revealNext; this effect is a
  // safety net for cases where hintTarget changes from outside those
  // paths.
  const hintTargetPages: number[] = hintTarget
    ? Array.from(
        new Set(
          getTajweedRuns(hintTarget.surah, hintTarget.ayah).map((r) => r.p)
        )
      )
    : [];
  const hintTargetPagesKey = hintTargetPages.join(",");
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    for (const p of hintTargetPages) ensurePageFont(p);
  }, [hintTargetPagesKey]);
  /* eslint-enable react-hooks/exhaustive-deps */

  /**
   * Ensures the QPC v4 font for the hint target's page(s) has actually
   * finished loading before resolving. The click handler awaits this
   * before incrementing the first-word counter so the box only opens
   * once the AyahText can render visibly. Without this, font-display:
   * block leaves the first click rendering an invisible block and the
   * user clicks again to "fix" it.
   */
  const ensureHintFontsReady = async () => {
    if (typeof document === "undefined" || !("fonts" in document)) return;
    if (hintTargetPages.length === 0) return;
    await Promise.all(
      hintTargetPages.map((p) =>
        document.fonts.load(`16px "qpc-v4-p${p}"`).catch(() => undefined)
      )
    );
  };

  // Screen-reader-only announcement that flips with each new prompt or
  // when the user reaches the end of the range. Uses surah names + ayah
  // numbers (not the QPC PUA glyphs, which don't have a sensible spoken
  // form). Kept short so VoiceOver / NVDA don't talk over the user.
  const liveAnnouncement = (() => {
    if (atRangeEnd) return t("endOfRange");
    if (!currentAyah || !currentSurahInfo) return "";
    return `${currentSurahInfo.name} ${currentAyah.ayah}`;
  })();

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
        containerWidth="max-w-2xl lg:max-w-3xl"
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
      <KeyboardHelp
        open={showHelp}
        onClose={() => setShowHelp(false)}
        language={language}
        context="quiz"
      />
      <AudioOverlay
        open={showVolume}
        onClose={() => setShowVolume(false)}
        settings={settings}
        actions={actions}
        language={language}
        containerWidth="max-w-2xl lg:max-w-3xl"
      />
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>
      <div className="max-w-2xl lg:max-w-3xl mx-auto w-full px-4 pt-4 pb-4 flex flex-col flex-1 min-h-0">
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
                const next = !showRangePicker;
                setShowRangePicker(next);
                if (next) {
                  setShowSettings(false);
                  setShowVolume(false);
                }
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
                const next = !showVolume;
                setShowVolume(next);
                if (next) {
                  setShowSettings(false);
                  setShowRangePicker(false);
                }
              }}
              className={`p-2 rounded-full border transition-all duration-200 ${
                showVolume
                  ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300"
              }`}
              aria-label={t("volume")}
            >
              <VolumeIcon level={volume} />
            </button>
            <button
              onClick={() => {
                const next = !showSettings;
                setShowSettings(next);
                if (next) {
                  setShowRangePicker(false);
                  setShowVolume(false);
                }
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

        {/* Range picker overlay — absolute-positioned so opening it
            doesn't push the reveal reel down. Anchors below the header
            via the same `top` offset as the other panels and inherits
            the screen's content-column max-width. */}
        {showRangePicker && (
          <>
            <button
              type="button"
              onClick={() => setShowRangePicker(false)}
              aria-label="Close range picker"
              className="fixed inset-0 z-40 bg-black/0 animate-fade-in-soft"
            />
            <div
              className="absolute z-50 inset-x-0 px-4 animate-fade-in pointer-events-none"
              style={{
                top: "max(4.5rem, calc(env(safe-area-inset-top) + 4rem))",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto w-full max-w-2xl lg:max-w-3xl pointer-events-auto lg:flex lg:justify-end">
                <div className="w-full lg:max-w-md">
                  <RangePopover
                    current={range}
                    onApply={onRangeChange}
                    onClose={() => setShowRangePicker(false)}
                    onCustomize={(juzs) => setCustomizing(juzs)}
                    language={language}
                  />
                </div>
              </div>
            </div>
          </>
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
                          {!promptOnly && !effectiveAudioOnly && (
                            <div className="text-center mb-4 flex items-center justify-center gap-2">
                              {!hideSurahName && (
                                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                                  {currentSurahInfo!.nameArabic} —{" "}
                                  {currentSurahInfo!.name} : {currentAyah.ayah}
                                </span>
                              )}
                              {isLastAyah && (
                                <span className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/60">
                                  {t("lastAyah")}
                                </span>
                              )}
                              <AyahAudioButton
                                key={`${currentAyah.surah}:${currentAyah.ayah}:${reciter}`}
                                surah={currentAyah.surah}
                                ayah={currentAyah.ayah}
                                reciter={reciter}
                                autoPlay={autoPlay}
                                volume={volume}
                                playbackSpeed={playbackSpeed}
                                loop={loop}
                                onTimeUpdate={(sec) => {
                                  // Sticky behavior: only update on a
                                  // positive match. Gaps between word
                                  // segments leave the previous word
                                  // highlighted so the slide animation
                                  // looks continuous.
                                  const idx = resolveWordIndex(
                                    currentAyah.surah,
                                    currentAyah.ayah,
                                    sec
                                  );
                                  if (idx < 0) return;
                                  const key = `${currentAyah.surah}:${currentAyah.ayah}`;
                                  setHighlightedAyahKey((p) =>
                                    p === key ? p : key
                                  );
                                  setHighlightedWordIdx((p) =>
                                    p === idx ? p : idx
                                  );
                                }}
                                ariaLabel={t("playAyah")}
                              />
                            </div>
                          )}

                          {effectiveAudioOnly ? (
                            <div className="flex flex-col items-center gap-4 py-6">
                              {!hideSurahName && (
                                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                                  {currentSurahInfo!.nameArabic} —{" "}
                                  {currentSurahInfo!.name} : {currentAyah.ayah}
                                </div>
                              )}
                              <AyahAudioButton
                                key={`${currentAyah.surah}:${currentAyah.ayah}:${reciter}`}
                                surah={currentAyah.surah}
                                ayah={currentAyah.ayah}
                                reciter={reciter}
                                size="lg"
                                autoPlay={autoPlay}
                                volume={volume}
                                playbackSpeed={playbackSpeed}
                                loop={loop}
                                ariaLabel={t("playAyah")}
                              />
                              <div className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                                {t("listenAndRecite")}
                              </div>
                              {isLastAyah && (
                                <span className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/60">
                                  {t("lastAyah")}
                                </span>
                              )}
                            </div>
                          ) : promptOnly ? (
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
                            <>
                              <AyahText
                                surah={currentAyah.surah}
                                ayah={currentAyah.ayah}
                                showMarker={showAyahNumbers}
                                tajweed={tajweed}
                                highlightWordIndex={
                                  highlightedAyahKey ===
                                  `${currentAyah.surah}:${currentAyah.ayah}`
                                    ? highlightedWordIdx
                                    : undefined
                                }
                                className="font-quran leading-[2.4] text-neutral-800 dark:text-neutral-200 text-right"
                                style={ayahStyle}
                              />
                              {/* Translation rides inline under every
                                  ayah card on every breakpoint. Similar
                                  verses still surface in the wide-screen
                                  sidebar instead of inline. */}
                              {showTranslation && (
                                <AyahTranslation
                                  surah={currentAyah.surah}
                                  ayah={currentAyah.ayah}
                                />
                              )}
                              {showSimilarPhrases && (
                                <AyahSimilarHint
                                  surah={currentAyah.surah}
                                  ayah={currentAyah.ayah}
                                  language={language}
                                />
                              )}
                            </>
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
                        {audioOnly && i === revealedAyahs.length - 1 ? (
                          // Audio-only mode: the newly-revealed ayah is the
                          // active "next test" — render a big play button
                          // and hide the text. Once the user reveals past
                          // it, this card will lose the `last revealed`
                          // condition and render as a regular text card.
                          <div className="flex flex-col items-center gap-4 py-6">
                            {!hideSurahName && (
                              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                                {surahs[ra.surah - 1].nameArabic} —{" "}
                                {surahs[ra.surah - 1].name} : {ra.ayah}
                              </div>
                            )}
                            <AyahAudioButton
                              key={`${ra.surah}:${ra.ayah}:${reciter}`}
                              surah={ra.surah}
                              ayah={ra.ayah}
                              reciter={reciter}
                              size="lg"
                              autoPlay={autoPlay}
                              volume={volume}
                              playbackSpeed={playbackSpeed}
                              loop={loop}
                              ariaLabel={t("playAyah")}
                            />
                            <div className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                              {t("listenAndRecite")}
                            </div>
                            {ra.isEndOfSurah && (
                              <span className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-900/60">
                                {t("lastAyah")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="text-center mb-3 flex items-center justify-center gap-2">
                              {!hideSurahName && (
                                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                  {surahs[ra.surah - 1].nameArabic} : {ra.ayah}
                                </span>
                              )}
                              {ra.isEndOfSurah && (
                                <span className="text-[10px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/60">
                                  {t("lastAyah")}
                                </span>
                              )}
                              <AyahAudioButton
                                surah={ra.surah}
                                ayah={ra.ayah}
                                reciter={reciter}
                                autoPlay={
                                  autoPlay && i === revealedAyahs.length - 1
                                }
                                volume={volume}
                                playbackSpeed={playbackSpeed}
                                loop={loop}
                                onTimeUpdate={(sec) => {
                                  const idx = resolveWordIndex(
                                    ra.surah,
                                    ra.ayah,
                                    sec
                                  );
                                  if (idx < 0) return;
                                  const key = `${ra.surah}:${ra.ayah}`;
                                  setHighlightedAyahKey((p) =>
                                    p === key ? p : key
                                  );
                                  setHighlightedWordIdx((p) =>
                                    p === idx ? p : idx
                                  );
                                }}
                                ariaLabel={t("playAyah")}
                              />
                            </div>
                            <AyahText
                              surah={ra.surah}
                              ayah={ra.ayah}
                              showMarker={showAyahNumbers}
                              tajweed={tajweed}
                              highlightWordIndex={
                                highlightedAyahKey ===
                                `${ra.surah}:${ra.ayah}`
                                  ? highlightedWordIdx
                                  : undefined
                              }
                              className="font-quran leading-[2.2] text-neutral-800 dark:text-neutral-200 text-right"
                              style={ayahStyle}
                            />
                            {showTranslation && (
                              <AyahTranslation
                                surah={ra.surah}
                                ayah={ra.ayah}
                              />
                            )}
                            {showSimilarPhrases && (
                              <AyahSimilarHint
                                surah={ra.surah}
                                ayah={ra.ayah}
                                language={language}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </Fragment>
                  );
                })}

                {/* Hint card — content describes the NEXT ayah the user
                    is trying to recite. Each hint type grows on
                    repeated presses (more words / longer audio / more
                    translation). Hidden until at least one hint has
                    been requested. Placed at the tail of the reveal
                    stream so it sits where the user's eyes are. */}
                {hintTarget &&
                  (hintFirstWordCount > 0 || hintTranslationStep > 0) && (
                    <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-3xl border border-amber-200/60 dark:border-amber-900/40 p-5 animate-fade-in-soft">
                      <div className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-1.5">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z" />
                        </svg>
                        {t("hint")}
                      </div>
                      {hintFirstWordCount > 0 && (
                        <AyahText
                          surah={hintTarget.surah}
                          ayah={hintTarget.ayah}
                          showMarker={false}
                          tajweed={tajweed}
                          wordLimit={hintFirstWordCount}
                          className="font-quran leading-[2.4] text-neutral-800 dark:text-neutral-200 text-right"
                          style={ayahStyle}
                        />
                      )}
                      {hintTranslationStep > 0 && (
                        <TranslationHint
                          surah={hintTarget.surah}
                          ayah={hintTarget.ayah}
                          step={hintTranslationStep}
                          wordsPerStep={HINT_TRANSLATION_WORDS_PER_STEP}
                          className={
                            hintFirstWordCount > 0 ? "mt-3" : ""
                          }
                        />
                      )}
                    </div>
                  )}

                {atRangeEnd && (
                  <div className="text-center text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 pt-2 pb-4 animate-fade-in-soft">
                    {t("endOfRange")}
                  </div>
                )}
              </div>
            </div>


            <div className="shrink-0 pt-3 relative">
              {hintMenuOpen && hintTarget && (
                <div
                  className="absolute bottom-full inset-x-0 mb-2 grid grid-cols-3 gap-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-900/10 dark:shadow-neutral-950/40 p-2 animate-fade-in-soft z-30"
                  role="menu"
                >
                  <button
                    role="menuitem"
                    onClick={async () => {
                      // Close the menu immediately for snappy feedback,
                      // but defer the count increment until the QPC v4
                      // font for the hint target has actually loaded.
                      // Otherwise the AyahText would render invisibly
                      // (font-display: block) and the user would feel
                      // the click "did nothing" until they clicked
                      // again. In practice this await resolves
                      // synchronously once the font has been pre-warmed
                      // by rollNewAyah/revealNext.
                      setHintMenuOpen(false);
                      await ensureHintFontsReady();
                      setHintFirstWordCount((c) => c + 1);
                    }}
                    className="py-2 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    {hintFirstWordCount === 0
                      ? t("hintFirstWord")
                      : `${t("hintFirstWord")} +`}
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      const next = hintAudioStep + 1;
                      setHintAudioStep(next);
                      void playAudioHint(next);
                      setHintMenuOpen(false);
                    }}
                    className="py-2 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    {hintAudioStep === 0
                      ? t("hintAudio")
                      : `${t("hintAudio")} +`}
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setHintTranslationStep((s) => s + 1);
                      setHintMenuOpen(false);
                    }}
                    className="py-2 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    {hintTranslationStep === 0
                      ? t("hintTranslation")
                      : `${t("hintTranslation")} +`}
                  </button>
                </div>
              )}
              <div className="flex gap-3 mb-3">
                <HintButton
                  disabled={!hintTarget}
                  active={hintMenuOpen}
                  label={t("hint")}
                  trailing={<KbdHint label="H" />}
                  onTap={() => setHintMenuOpen((v) => !v)}
                  onLongPress={async () => {
                    if (!hintTarget) return;
                    // Cycle to the next hint type and fire it directly.
                    const order: HintType[] = [
                      "firstWord",
                      "audio",
                      "translation",
                    ];
                    const nextIdx =
                      (order.indexOf(lastHintType) + 1) % order.length;
                    const next = order[nextIdx];
                    setLastHintType(next);
                    setHintMenuOpen(false);
                    if (next === "firstWord") {
                      await ensureHintFontsReady();
                      setHintFirstWordCount((c) => c + 1);
                    } else if (next === "audio") {
                      const step = hintAudioStep + 1;
                      setHintAudioStep(step);
                      void playAudioHint(step);
                    } else {
                      setHintTranslationStep((s) => s + 1);
                    }
                  }}
                />
                <button
                  onClick={revealNext}
                  disabled={atRangeEnd}
                  className="flex-1 py-3 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
                >
                  {promptOnly ? t("revealFirstAyah") : t("revealNextAyah")}
                  <KbdHint label="Space" />
                </button>
              </div>

              <button
                onClick={rollNewAyah}
                className="w-full py-3.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium rounded-xl transition-all duration-200 active:scale-[0.99] inline-flex items-center justify-center gap-2"
              >
                {t("nextRandomAyah")}
                <KbdHint label="N" inverted />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
