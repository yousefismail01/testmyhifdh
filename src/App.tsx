import { useEffect, useState } from "react";
import RangeSelector, { type SelectedRange } from "./components/RangeSelector";
import QuizScreen from "./components/QuizScreen";
import { usePersistedState } from "./hooks/usePersistedState";

export type Theme = "light" | "dark";
export type FontSize = "sm" | "md" | "lg" | "xl";

export interface Settings {
  theme: Theme;
  fontSize: FontSize;
  hideSurahName: boolean;
  testFirstAyahs: boolean;
  showAyahNumbers: boolean;
}

export interface SettingsActions {
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  setFontSize: React.Dispatch<React.SetStateAction<FontSize>>;
  setHideSurahName: React.Dispatch<React.SetStateAction<boolean>>;
  setTestFirstAyahs: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAyahNumbers: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function App() {
  const [range, setRange] = useState<SelectedRange | null>(null);
  const [visible, setVisible] = useState<"setup" | "quiz">("setup");
  const [transitioning, setTransitioning] = useState(false);

  const [theme, setTheme] = usePersistedState<Theme>("tmh.theme", "light");
  const [fontSize, setFontSize] = usePersistedState<FontSize>(
    "tmh.fontSize",
    "md"
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

  const settings: Settings = {
    theme,
    fontSize,
    hideSurahName,
    testFirstAyahs,
    showAyahNumbers,
  };
  const actions: SettingsActions = {
    setTheme,
    setFontSize,
    setHideSurahName,
    setTestFirstAyahs,
    setShowAyahNumbers,
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    const next = range ? "quiz" : "setup";
    if (next === visible) return;
    setTransitioning(true);
    const t = setTimeout(() => {
      setVisible(next);
      setTransitioning(false);
    }, 200);
    return () => clearTimeout(t);
  }, [range, visible]);

  return (
    <div
      className={`min-h-screen bg-white dark:bg-neutral-950 transition-opacity duration-200 ${
        transitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {visible === "quiz" && range ? (
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
