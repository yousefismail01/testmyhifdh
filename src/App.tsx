import { useEffect, useState } from "react";
import RangeSelector, { type SelectedRange } from "./components/RangeSelector";
import QuizScreen from "./components/QuizScreen";
import { usePersistedState } from "./hooks/usePersistedState";
import type { Language } from "./i18n/translations";
import { isRTL } from "./i18n/translations";

export type Theme = "light" | "dark";
/** Quran-text font size in CSS pixels. 16–48 inclusive, integer steps. */
export type FontSize = number;
export const FONT_SIZE_MIN = 16;
export const FONT_SIZE_MAX = 48;
export const FONT_SIZE_DEFAULT = 32;

export interface Settings {
  theme: Theme;
  fontSize: FontSize;
  hideSurahName: boolean;
  testFirstAyahs: boolean;
  showAyahNumbers: boolean;
  tajweed: boolean;
  language: Language;
}

export interface SettingsActions {
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  setFontSize: React.Dispatch<React.SetStateAction<FontSize>>;
  setHideSurahName: React.Dispatch<React.SetStateAction<boolean>>;
  setTestFirstAyahs: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAyahNumbers: React.Dispatch<React.SetStateAction<boolean>>;
  setTajweed: React.Dispatch<React.SetStateAction<boolean>>;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
}

export default function App() {
  const [range, setRange] = useState<SelectedRange | null>(null);

  const [theme, setTheme] = usePersistedState<Theme>("tmh.theme", "light");
  const [fontSize, setFontSize] = usePersistedState<FontSize>(
    "tmh.fontSize",
    FONT_SIZE_DEFAULT
  );
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
  const [tajweed, setTajweed] = usePersistedState("tmh.tajweed", false);
  const [language, setLanguage] = usePersistedState<Language>(
    "tmh.language",
    "en"
  );

  const settings: Settings = {
    theme,
    fontSize,
    hideSurahName,
    testFirstAyahs,
    showAyahNumbers,
    tajweed,
    language,
  };
  const actions: SettingsActions = {
    setTheme,
    setFontSize,
    setHideSurahName,
    setTestFirstAyahs,
    setShowAyahNumbers,
    setTajweed,
    setLanguage,
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    const themeColor = theme === "dark" ? "#0a0a0a" : "#ffffff";
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (meta) meta.content = themeColor;

    const iosBar = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (iosBar) {
      iosBar.content = theme === "dark" ? "black-translucent" : "default";
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = isRTL(language) ? "rtl" : "ltr";
  }, [language]);

  // Each screen owns its own entrance animation (animate-fade-in on the
  // root). Swap the rendered tree synchronously when `range` changes —
  // the wrapper used to do its own opacity cross-fade in addition, but
  // that visibly competed with the new screen's mount animation and
  // produced a small flash. Plain unmount + new screen's animation is
  // smoother.
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {range ? (
        <QuizScreen
          range={range}
          onBack={() => setRange(null)}
          onRangeChange={setRange}
          settings={settings}
          actions={actions}
        />
      ) : (
        <RangeSelector
          onStart={setRange}
          settings={settings}
          actions={actions}
        />
      )}
    </div>
  );
}
