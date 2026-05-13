import type { Settings, SettingsActions, Theme } from "../App";
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from "../App";
import { LANGUAGE_NAMES } from "../i18n/translations";
import type { Language } from "../i18n/translations";
import { useT } from "../i18n/useT";

interface Props {
  settings: Settings;
  actions: SettingsActions;
  /** When true, hides quiz-specific toggles. */
  compact?: boolean;
}

export default function SettingsPanel({ settings, actions, compact }: Props) {
  const t = useT(settings.language);
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 animate-fade-in">
      {!compact && (
        <>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="pr-4">
              <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {t("hideSurahNames")}
              </div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {t("hideSurahNamesDesc")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.hideSurahName}
              onChange={(e) => actions.setHideSurahName(e.target.checked)}
              className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="pr-4">
              <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {t("testFirstAyahs")}
              </div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {t("testFirstAyahsDesc")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.testFirstAyahs}
              onChange={(e) => actions.setTestFirstAyahs(e.target.checked)}
              className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="pr-4">
              <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {t("showAyahNumbers")}
              </div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {t("showAyahNumbersDesc")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showAyahNumbers}
              onChange={(e) => actions.setShowAyahNumbers(e.target.checked)}
              className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="pr-4">
              <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {t("tajweed")}
              </div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                {t("tajweedDesc")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.tajweed}
              onChange={(e) => actions.setTajweed(e.target.checked)}
              className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
            />
          </label>
        </>
      )}

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

      <div className="pt-1">
        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
          {t("theme")}
        </div>
        <div className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-1">
          {(["light", "dark"] as const).map((th) => (
            <button
              key={th}
              onClick={() => actions.setTheme(th as Theme)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                settings.theme === th
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              {th === "light" ? t("themeLight") : t("themeDark")}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1">
        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
          {t("language")}
        </div>
        <div className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-1">
          {(["en", "ar", "ur"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => actions.setLanguage(lang as Language)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                settings.language === lang
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              {LANGUAGE_NAMES[lang]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
