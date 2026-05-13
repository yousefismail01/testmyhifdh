import { useState } from "react";
import { surahs, juzData } from "../data/quran-meta";
import type { Settings, SettingsActions } from "../App";
import SettingsOverlay from "./SettingsOverlay";
import JuzCustomizer from "./JuzCustomizer";
import { useT } from "../i18n/useT";
import { useDragSelect } from "../hooks/useDragSelect";
import { useKeyboard } from "../hooks/useKeyboard";
import {
  type RangeMode,
  type SelectedRange,
  getSelectedJuzs,
} from "../types/range";

export type { RangeMode, SelectedRange };

interface Props {
  onStart: (range: SelectedRange) => void;
  settings: Settings;
  actions: SettingsActions;
  /**
   * Last range chosen by the user. Used to re-seed picker state so the
   * back button on the quiz screen doesn't lose their selection.
   */
  initialRange?: SelectedRange | null;
}

export default function RangeSelector({
  onStart,
  settings,
  actions,
  initialRange,
}: Props) {
  const t = useT(settings.language);
  // Seed picker state from the previous range (if any) on first mount.
  // After mount we ignore further changes to initialRange so user edits
  // in the picker aren't clobbered when App updates lastRange.
  const seedMode: RangeMode = (() => {
    if (!initialRange) return "juz";
    // Custom mode falls back to juz so the picker tabs render meaningfully.
    return initialRange.mode === "custom" ? "juz" : initialRange.mode;
  })();
  const seedJuzs: number[] = initialRange
    ? getSelectedJuzs(initialRange)
    : [30];

  const [mode, setMode] = useState<RangeMode>(seedMode);
  const [selectedJuzs, setSelectedJuzs] = useState<Set<number>>(
    () => new Set(seedJuzs.length > 0 ? seedJuzs : [30])
  );
  const [startSurah, setStartSurah] = useState(initialRange?.startSurah ?? 1);
  const [endSurah, setEndSurah] = useState(initialRange?.endSurah ?? 1);
  const [startAyah, setStartAyah] = useState(initialRange?.startAyah ?? 1);
  const [endAyah, setEndAyah] = useState(initialRange?.endAyah ?? 7);
  const [startPage, setStartPage] = useState(initialRange?.startPage ?? 1);
  const [endPage, setEndPage] = useState(initialRange?.endPage ?? 20);
  const [showSettings, setShowSettings] = useState(false);
  const [customizing, setCustomizing] = useState<number[] | null>(null);
  // Anchor for two-tap range fill on the juz grid. First tap on an
  // unselected juz sets the anchor and adds that juz; a second tap on
  // another unselected juz unions every juz between the anchor and the
  // tap into the selection. Tapping a selected juz deselects it and
  // clears the anchor.
  const [juzAnchor, setJuzAnchor] = useState<number | null>(null);

  const toggleJuz = (n: number) => {
    setSelectedJuzs((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        // Tap on a selected juz → deselect. Empty selection is allowed;
        // the Begin / Customize buttons disable when nothing is picked.
        next.delete(n);
        setJuzAnchor(null);
        return next;
      }
      // Tap on an unselected juz.
      if (juzAnchor === null) {
        next.add(n);
        setJuzAnchor(n);
        return next;
      }
      // Anchor exists → fill range, union into existing selection.
      const lo = Math.min(juzAnchor, n);
      const hi = Math.max(juzAnchor, n);
      for (let j = lo; j <= hi; j++) next.add(j);
      setJuzAnchor(null);
      return next;
    });
  };
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

  const startSurahInfo = surahs[startSurah - 1];
  const endSurahInfo = surahs[endSurah - 1];
  const effectiveStartAyah = Math.min(startAyah, startSurahInfo.ayahCount);
  const effectiveEndAyah = Math.min(
    Math.max(
      endAyah,
      startSurah === endSurah ? effectiveStartAyah : 1
    ),
    endSurahInfo.ayahCount
  );

  const handleStart = () => {
    if (mode === "juz") {
      if (sortedJuzs.length === 0) return;
      onStart({ mode, juzNumbers: sortedJuzs });
    } else if (mode === "surah") {
      const finalEndSurah = Math.max(startSurah, endSurah);
      onStart({
        mode,
        startSurah,
        endSurah: finalEndSurah,
        startAyah: effectiveStartAyah,
        endAyah: effectiveEndAyah,
      });
    } else {
      onStart({
        mode,
        startPage,
        endPage: Math.max(startPage, endPage),
      });
    }
  };

  // Keyboard shortcuts on the home screen.
  //   1/2/3        switch to juz / surah / page tab
  //   Enter        Begin (when not focused on an input)
  //   t            toggle theme
  //   s            toggle settings overlay
  //   Escape       close settings overlay (if open)
  useKeyboard(
    {
      Enter: () => handleStart(),
      "1": () => setMode("juz"),
      "2": () => setMode("surah"),
      "3": () => setMode("page"),
      t: () =>
        actions.setTheme(settings.theme === "dark" ? "light" : "dark"),
      s: () => setShowSettings((v) => !v),
      Escape: () => {
        if (customizing !== null) setCustomizing(null);
        else if (showSettings) setShowSettings(false);
      },
    },
    customizing === null
  );

  const tabs: { value: RangeMode; label: string }[] = [
    { value: "juz", label: t("tabJuz") },
    { value: "surah", label: t("tabSurah") },
    { value: "page", label: t("tabPage") },
  ];

  return (
    <div
      className="relative min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center p-4 animate-fade-in"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <SettingsOverlay
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        actions={actions}
        containerWidth="max-w-lg"
      />
      {customizing !== null && (
        <JuzCustomizer
          juzNumbers={customizing}
          language={settings.language}
          onCancel={() => setCustomizing(null)}
          onApply={(customAyahs) => {
            const juzs = customizing;
            setCustomizing(null);
            onStart({
              mode: "custom",
              juzNumbers: juzs,
              customAyahs,
            });
          }}
        />
      )}
      <div
        className="absolute z-50 inset-x-0 px-4 flex justify-center pointer-events-none"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="w-full max-w-lg flex justify-end gap-2 pointer-events-auto">
          <button
            onClick={() =>
              actions.setTheme(settings.theme === "dark" ? "light" : "dark")
            }
            className="p-2 rounded-full border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300 transition-all duration-200"
            aria-label={
              settings.theme === "dark"
                ? t("switchToLight")
                : t("switchToDark")
            }
          >
            {settings.theme === "dark" ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="4" strokeWidth={2} />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
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

      <div className="w-full max-w-lg">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
            {t("appTitle")}
          </h1>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2 tracking-wide">
            {t("appTagline")}
          </p>
        </div>

        <div
          className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 animate-slide-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setMode(tab.value)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  mode === tab.value
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div key={mode} className="animate-fade-in-soft">
            {mode === "juz" && (
              <div>
                <div className="flex items-baseline justify-between mb-3 gap-3">
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    {t("selectJuz")}
                  </label>
                  <div className="flex items-baseline gap-3">
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                      {sortedJuzs.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJuzs(new Set());
                        setJuzAnchor(null);
                      }}
                      disabled={sortedJuzs.length === 0}
                      className="text-[11px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {t("clearAll")}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1.5 select-none touch-none">
                  {juzData.map((j) => {
                    const isSelected = selectedJuzs.has(j.number);
                    const isAnchor = juzAnchor === j.number;
                    return (
                      <button
                        key={j.number}
                        type="button"
                        {...bindJuzDrag(j.number)}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
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
                  onClick={() => setCustomizing(sortedJuzs)}
                  disabled={sortedJuzs.length === 0}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t("customizeRange")}
                  <svg
                    className="w-3.5 h-3.5"
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
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                      {t("fromSurah")}
                    </label>
                    <select
                      value={startSurah}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setStartSurah(v);
                        if (endSurah < v) setEndSurah(v);
                        setStartAyah(1);
                      }}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                    >
                      {surahs.map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.name} — {s.nameArabic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
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
                      className="w-full px-3 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                      {t("toSurah")}
                    </label>
                    <select
                      value={endSurah}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setEndSurah(v);
                        setEndAyah(surahs[v - 1].ayahCount);
                      }}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                    >
                      {surahs
                        .filter((s) => s.number >= startSurah)
                        .map((s) => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.name} — {s.nameArabic}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                      {t("ayah")}
                    </label>
                    <input
                      type="number"
                      min={
                        startSurah === endSurah ? effectiveStartAyah : 1
                      }
                      max={endSurahInfo.ayahCount}
                      value={effectiveEndAyah}
                      onChange={(e) =>
                        setEndAyah(
                          Math.max(
                            startSurah === endSurah
                              ? effectiveStartAyah
                              : 1,
                            Math.min(
                              endSurahInfo.ayahCount,
                              Number(e.target.value)
                            )
                          )
                        )
                      }
                      className="w-full px-3 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === "page" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                    {t("fromPage")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={startPage}
                    onChange={(e) =>
                      setStartPage(
                        Math.max(1, Math.min(604, Number(e.target.value)))
                      )
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
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
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={mode === "juz" && sortedJuzs.length === 0}
            className="w-full mt-6 py-3.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium rounded-xl transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("begin")}
          </button>
        </div>

        <p
          className="text-center text-neutral-300 dark:text-neutral-600 text-xs mt-8 animate-fade-in-soft"
          style={{ animationDelay: "200ms" }}
        >
          {t("rangeFooter")}
        </p>
      </div>
    </div>
  );
}
