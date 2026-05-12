import { useState } from "react";
import { surahs, juzData } from "../data/quran-meta";

export type RangeMode = "surah" | "juz" | "page";

export interface SelectedRange {
  mode: RangeMode;
  startSurah?: number;
  endSurah?: number;
  juzNumber?: number;
  startPage?: number;
  endPage?: number;
}

interface Props {
  onStart: (range: SelectedRange) => void;
}

export default function RangeSelector({ onStart }: Props) {
  const [mode, setMode] = useState<RangeMode>("juz");
  const [juzNumber, setJuzNumber] = useState(30);
  const [startSurah, setStartSurah] = useState(1);
  const [endSurah, setEndSurah] = useState(1);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(20);

  const handleStart = () => {
    if (mode === "juz") {
      onStart({ mode, juzNumber });
    } else if (mode === "surah") {
      onStart({
        mode,
        startSurah,
        endSurah: Math.max(startSurah, endSurah),
      });
    } else {
      onStart({
        mode,
        startPage,
        endPage: Math.max(startPage, endPage),
      });
    }
  };

  const tabs: { value: RangeMode; label: string }[] = [
    { value: "juz", label: "Juz" },
    { value: "surah", label: "Surah" },
    { value: "page", label: "Page" },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-medium text-neutral-900 tracking-tight">
            testmyhifdh
          </h1>
          <p className="text-neutral-400 text-sm mt-2 tracking-wide">
            test your memorization, ayah by ayah
          </p>
        </div>

        <div
          className="bg-white rounded-3xl border border-neutral-200 p-6 animate-slide-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex gap-1 bg-neutral-50 rounded-2xl p-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setMode(tab.value)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  mode === tab.value
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div key={mode} className="animate-fade-in-soft">
            {mode === "juz" && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-3">
                  Select Juz
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {juzData.map((j) => (
                    <button
                      key={j.number}
                      onClick={() => setJuzNumber(j.number)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        juzNumber === j.number
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {j.number}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "surah" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    From
                  </label>
                  <select
                    value={startSurah}
                    onChange={(e) => setStartSurah(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                  >
                    {surahs.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {s.name} — {s.nameArabic}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    To
                  </label>
                  <select
                    value={endSurah}
                    onChange={(e) => setEndSurah(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
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
              </div>
            )}

            {mode === "page" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    From Page
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
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                    To Page
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
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            className="w-full mt-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xl transition-all duration-200 active:scale-[0.99]"
          >
            Begin
          </button>
        </div>

        <p
          className="text-center text-neutral-300 text-xs mt-8 animate-fade-in-soft"
          style={{ animationDelay: "200ms" }}
        >
          Surahs are weighted equally — short surahs roll as often as long ones
        </p>
      </div>
    </div>
  );
}
