import { useEffect, useState } from "react";
import RangeSelector, { type SelectedRange } from "./components/RangeSelector";
import QuizScreen from "./components/QuizScreen";
import { usePersistedState } from "./hooks/usePersistedState";
import type { Language } from "./i18n/translations";
import { isRTL } from "./i18n/translations";
import { loadTajweed } from "./data/quran-tajweed";

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
  resetSettings: () => void;
}

export default function App() {
  const [range, setRange] = useState<SelectedRange | null>(null);
  // The last range applied via Begin/Apply. Survives the quiz→home
  // transition so RangeSelector can re-seed its picker state and the
  // user doesn't have to reselect their juzs after going back.
  const [lastRange, setLastRange] = useState<SelectedRange | null>(null);

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
    true
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
    resetSettings: () => {
      setTheme("light");
      setFontSize(FONT_SIZE_DEFAULT);
      setHideSurahName(false);
      setTestFirstAyahs(true);
      setShowAyahNumbers(true);
      setTajweed(false);
      setLanguage("en");
    },
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

  // Begin fetching the tajweed JSON on app mount so it's likely ready by
  // the time the user clicks Begin. Subsequent calls return the same
  // in-flight promise — no duplicate fetches.
  useEffect(() => {
    void loadTajweed();
  }, []);

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
          onRangeChange={(r) => {
            setRange(r);
            setLastRange(r);
          }}
          settings={settings}
          actions={actions}
        />
      ) : (
        <RangeSelector
          initialRange={lastRange}
          onStart={(r) => {
            setRange(r);
            setLastRange(r);
          }}
          settings={settings}
          actions={actions}
        />
      )}
    </div>
  );
}
