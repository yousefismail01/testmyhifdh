import type { Settings, SettingsActions, Theme, FontSize } from "../App";

interface Props {
  settings: Settings;
  actions: SettingsActions;
  /** When true, hides quiz-specific toggles. */
  compact?: boolean;
}

export default function SettingsPanel({ settings, actions, compact }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 animate-fade-in">
      {!compact && (
        <>
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
              checked={settings.hideSurahName}
              onChange={(e) => actions.setHideSurahName(e.target.checked)}
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
              checked={settings.testFirstAyahs}
              onChange={(e) => actions.setTestFirstAyahs(e.target.checked)}
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
              checked={settings.showAyahNumbers}
              onChange={(e) => actions.setShowAyahNumbers(e.target.checked)}
              className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="pr-4">
              <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Tajweed
              </div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Render with the QPC v4 tajweed-colored Mushaf font
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
        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
          Text size
        </div>
        <div className="flex gap-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-1">
          {(["sm", "md", "lg", "xl"] as const).map((s) => (
            <button
              key={s}
              onClick={() => actions.setFontSize(s as FontSize)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                settings.fontSize === s
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
              onClick={() => actions.setTheme(t as Theme)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 capitalize ${
                settings.theme === t
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
  );
}
