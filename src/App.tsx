import { useEffect, useState } from "react";
import RangeSelector, { type SelectedRange } from "./components/RangeSelector";
import QuizScreen from "./components/QuizScreen";
import { usePersistedState } from "./hooks/usePersistedState";

export type Theme = "light" | "dark";
export type FontSize = "sm" | "md" | "lg" | "xl";

export default function App() {
  const [range, setRange] = useState<SelectedRange | null>(null);
  const [visible, setVisible] = useState<"setup" | "quiz">("setup");
  const [transitioning, setTransitioning] = useState(false);

  const [theme, setTheme] = usePersistedState<Theme>("tmh.theme", "light");
  const [fontSize, setFontSize] = usePersistedState<FontSize>(
    "tmh.fontSize",
    "md"
  );

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
          theme={theme}
          setTheme={setTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      ) : (
        <RangeSelector onStart={setRange} />
      )}
    </div>
  );
}
