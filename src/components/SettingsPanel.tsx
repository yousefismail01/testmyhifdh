import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Settings, SettingsActions, Theme } from "../App";
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from "../App";
import { LANGUAGE_NAMES } from "../i18n/translations";
import type { Language } from "../i18n/translations";
import { useT } from "../i18n/useT";
import { reciters, getReciter, type ReciterId } from "../data/reciters";

interface Props {
  settings: Settings;
  actions: SettingsActions;
}

/** Settings panel with three views:
 *  - main: per-quiz toggles + entries for "Preferences ›" and "Audio ›"
 *  - preferences: text size, theme, language, reset
 *  - audio: reciter, audio-only, autoplay, volume */
type View = "main" | "preferences" | "audio";
export default function SettingsPanel({ settings, actions }: Props) {
  const t = useT(settings.language);
  const [view, setView] = useState<View>("main");

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xl shadow-neutral-900/5 dark:shadow-neutral-950/40 overflow-hidden">
      <div key={view} className="animate-fade-in-soft space-y-4">
        {view === "main" && (
          <MainView
            settings={settings}
            actions={actions}
            t={t}
            onPreferences={() => setView("preferences")}
            onAudio={() => setView("audio")}
          />
        )}
        {view === "preferences" && (
          <PreferencesView
            settings={settings}
            actions={actions}
            t={t}
            onBack={() => setView("main")}
          />
        )}
        {view === "audio" && (
          <AudioView
            settings={settings}
            actions={actions}
            t={t}
            onBack={() => setView("main")}
          />
        )}
      </div>
    </div>
  );
}

type T = ReturnType<typeof useT>;

function MainView({
  settings,
  actions,
  t,
  onPreferences,
  onAudio,
}: {
  settings: Settings;
  actions: SettingsActions;
  t: T;
  onPreferences: () => void;
  onAudio: () => void;
}) {
  return (
    <>
      <ToggleRow
        title={t("hideSurahNames")}
        desc={t("hideSurahNamesDesc")}
        checked={settings.hideSurahName}
        onChange={actions.setHideSurahName}
      />
      <ToggleRow
        title={t("testFirstAyahs")}
        desc={t("testFirstAyahsDesc")}
        checked={settings.testFirstAyahs}
        onChange={actions.setTestFirstAyahs}
      />
      <ToggleRow
        title={t("showAyahNumbers")}
        desc={t("showAyahNumbersDesc")}
        checked={settings.showAyahNumbers}
        onChange={actions.setShowAyahNumbers}
      />
      <ToggleRow
        title={t("tajweed")}
        desc={t("tajweedDesc")}
        checked={settings.tajweed}
        onChange={actions.setTajweed}
      />
      <ToggleRow
        title={t("showTranslation")}
        desc={t("showTranslationDesc")}
        checked={settings.showTranslation}
        onChange={actions.setShowTranslation}
      />
      <ToggleRow
        title={t("showSimilarPhrases")}
        desc={t("showSimilarPhrasesDesc")}
        checked={settings.showSimilarPhrases}
        onChange={actions.setShowSimilarPhrases}
      />

      <SubpageRow label={t("audio")} onClick={onAudio} />
      <SubpageRow label={t("preferences")} onClick={onPreferences} />
    </>
  );
}

function SubpageRow({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-3 flex items-center justify-between rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {label}
      </span>
      <svg
        className="w-4 h-4 text-neutral-400 dark:text-neutral-500 rtl:rotate-180"
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
  );
}

function PreferencesView({
  settings,
  actions,
  t,
  onBack,
}: {
  settings: Settings;
  actions: SettingsActions;
  t: T;
  onBack: () => void;
}) {
  return (
    <>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors -mt-1 mb-2"
      >
        <svg
          className="w-4 h-4 rtl:rotate-180"
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
        {t("preferences")}
      </button>

      <div className="pt-1">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {t("textSize")}
          </div>
          <div className="font-quran tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
            {settings.fontSize}px
          </div>
        </div>
        <input
          type="range"
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          step={1}
          value={settings.fontSize}
          onChange={(e) => actions.setFontSize(Number(e.target.value))}
          aria-label={t("textSize")}
          className="w-full accent-neutral-900 dark:accent-neutral-100"
        />
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-1">
          <span>{t("textSizeSmall")}</span>
          <span>{t("textSizeLarge")}</span>
        </div>
      </div>

      <Segmented
        label={t("theme")}
        value={settings.theme}
        onChange={(v) => actions.setTheme(v as Theme)}
        options={[
          { value: "light", label: t("themeLight") },
          { value: "dark", label: t("themeDark") },
        ]}
      />

      <Segmented
        label={t("language")}
        value={settings.language}
        onChange={(v) => actions.setLanguage(v as Language)}
        options={[
          { value: "en", label: LANGUAGE_NAMES.en },
          { value: "ar", label: LANGUAGE_NAMES.ar },
          { value: "ur", label: LANGUAGE_NAMES.ur },
        ]}
      />

      <button
        type="button"
        onClick={() => {
          if (window.confirm(t("resetConfirm"))) actions.resetSettings();
        }}
        className="w-full mt-2 px-3 py-2.5 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl transition-colors"
      >
        {t("resetToDefaults")}
      </button>
    </>
  );
}

function AudioView({
  settings,
  actions,
  t,
  onBack,
}: {
  settings: Settings;
  actions: SettingsActions;
  t: T;
  onBack: () => void;
}) {
  return (
    <>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors -mt-1 mb-2"
      >
        <svg
          className="w-4 h-4 rtl:rotate-180"
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
        {t("audio")}
      </button>

      <ReciterDropdown
        label={t("reciter")}
        value={settings.reciter}
        onChange={actions.setReciter}
        language={settings.language}
      />

      <ToggleRow
        title={t("audioOnly")}
        desc={t("audioOnlyDesc")}
        checked={settings.audioOnly}
        onChange={actions.setAudioOnly}
      />
      <ToggleRow
        title={t("autoPlay")}
        desc={t("autoPlayDesc")}
        checked={settings.autoPlay}
        onChange={actions.setAutoPlay}
      />

      <div className="pt-1">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {t("volume")}
          </div>
          <div className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
            {settings.volume}%
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={settings.volume}
          onChange={(e) => actions.setVolume(Number(e.target.value))}
          aria-label={t("volume")}
          className="w-full accent-neutral-900 dark:accent-neutral-100"
        />
      </div>
    </>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div className="pe-4">
        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {title}
        </div>
        <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
          {desc}
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
      />
    </label>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="pt-1">
      <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
        {label}
      </div>
      <div className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              value === opt.value
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Reciter picker rendered as a button-style dropdown. Custom-built so
 * it matches the rest of the panel chrome (a native <select> ignores
 * Tailwind styling and looks foreign in dark mode). Closes on outside
 * click and Esc. Arrow-key nav over the list while open.
 */
function ReciterDropdown({
  label,
  value,
  onChange,
  language,
}: {
  label: string;
  value: ReciterId;
  onChange: (v: ReciterId) => void;
  language: Language;
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  // Portal-positioned list rect, computed from the trigger on open.
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const current = getReciter(value);

  // Recompute list position when opening, on resize, and on scroll —
  // the panel is in a position:absolute overlay so any of those can
  // shift the trigger relative to the viewport.
  const recompute = () => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  useLayoutEffect(() => {
    if (!open) return;
    recompute();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onReflow = () => recompute();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open]);

  // Click outside closes — check both trigger and the portaled list.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // Snap the active index to the current selection when opening.
  /* eslint-disable react-hooks/exhaustive-deps */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setActiveIdx(Math.max(0, reciters.findIndex((r) => r.id === value)));
  }, [open]);
  /* eslint-enable react-hooks/exhaustive-deps */
  /* eslint-enable react-hooks/set-state-in-effect */

  const commit = (id: ReciterId) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="pt-1">
      <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
        {label}
      </div>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
      >
        <span className="truncate">{current.name[language]}</span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform shrink-0 ${
            open ? "rotate-180" : ""
          }`}
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
      {open &&
        rect &&
        createPortal(
          <ul
            ref={(el) => {
              listRef.current = el;
              // Focus the list so keyboard nav works immediately.
              el?.focus();
            }}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(reciters.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                commit(reciters[activeIdx].id);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              zIndex: 100,
            }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl shadow-neutral-900/20 dark:shadow-neutral-950/60 overflow-hidden animate-fade-in-soft focus:outline-none"
          >
            {reciters.map((r, i) => {
              const isActive = i === activeIdx;
              const isCurrent = r.id === value;
              return (
                <li
                  key={r.id}
                  role="option"
                  aria-selected={isCurrent}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => commit(r.id)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
                    isActive
                      ? "bg-neutral-100 dark:bg-neutral-800"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  } ${
                    isCurrent
                      ? "font-medium text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <span className="flex-1 truncate">{r.name[language]}</span>
                  {isCurrent && (
                    <svg
                      className="w-3.5 h-3.5 text-neutral-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
