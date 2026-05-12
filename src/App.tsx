import { useEffect, useState } from "react";
import RangeSelector, { type SelectedRange } from "./components/RangeSelector";
import QuizScreen from "./components/QuizScreen";

export default function App() {
  const [range, setRange] = useState<SelectedRange | null>(null);
  const [visible, setVisible] = useState<"setup" | "quiz">("setup");
  const [transitioning, setTransitioning] = useState(false);

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
      className={`min-h-screen bg-white transition-opacity duration-200 ${
        transitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {visible === "quiz" && range ? (
        <QuizScreen range={range} onBack={() => setRange(null)} />
      ) : (
        <RangeSelector onStart={setRange} />
      )}
    </div>
  );
}
