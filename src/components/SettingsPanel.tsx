import { useState } from "react";
import type { Settings, SettingsActions, Theme } from "../App";
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from "../App";
import { LANGUAGE_NAMES } from "../i18n/translations";
import type { Language } from "../i18n/translations";
import { useT } from "../i18n/useT";

interface Props {
  settings: Settings;
  actions: SettingsActions;
}

/** Settings panel with two views:
 *  - main: per-quiz toggles + a "Preferences ›" entry
 *  - preferences: text size, theme, language, reset
 *
 * Audio-related controls (reciter, volume, speed, loop, autoplay,
 * audio-only) live in their own header overlay (AudioOverlay) so they're
 * reachable from the speaker icon, not buried in a sub-page. */
type View = "main" | "preferences";
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
}: {
  settings: Settings;
  actions: SettingsActions;
  t: T;
  onPreferences: () => void;
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
      <ToggleRow
        title={t("mutashabihatMode")}
        desc={t("mutashabihatModeDesc")}
        checked={settings.mutashabihatMode}
        onChange={actions.setMutashabihatMode}
      />

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
