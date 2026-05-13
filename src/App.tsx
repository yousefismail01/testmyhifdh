import { useEffect, useState } from "react";
import RangeSelector, { type SelectedRange } from "./components/RangeSelector";
import QuizScreen from "./components/QuizScreen";
import { usePersistedState } from "./hooks/usePersistedState";
import type { Language } from "./i18n/translations";
import { isRTL } from "./i18n/translations";
import { loadTajweed } from "./data/quran-tajweed";
import { loadTranslation } from "./data/translations-en";
import { loadSimilar } from "./data/similar-ayahs";
import {
  loadReciterWords,
  loadReciterSegments,
  getReciter,
  type ReciterId,
} from "./data/reciters";

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
  reciter: ReciterId;
  /** Hide the prompt's Arabic text — the user listens to recite. */
  audioOnly: boolean;
  /** Start audio playback automatically whenever a new ayah rolls. */
  autoPlay: boolean;
  /** Output volume for ayah playback, 0–100. */
  volume: number;
  /** Playback rate multiplier, 0.5–2.0 (1.0 = normal). */
  playbackSpeed: number;
  /** When true, the audio loops the current ayah indefinitely. */
  loop: boolean;
  /** When true, only roll ayahs that have a known mutashabihat pair. */
  mutashabihatMode: boolean;
  /** Show English translation beneath each ayah as a hint. */
  showTranslation: boolean;
  /** Show "this ayah has similar wording in X:Y" cross-references. */
  showSimilarPhrases: boolean;
}

export interface SettingsActions {
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  setFontSize: React.Dispatch<React.SetStateAction<FontSize>>;
  setHideSurahName: React.Dispatch<React.SetStateAction<boolean>>;
  setTestFirstAyahs: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAyahNumbers: React.Dispatch<React.SetStateAction<boolean>>;
  setTajweed: React.Dispatch<React.SetStateAction<boolean>>;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  setReciter: React.Dispatch<React.SetStateAction<ReciterId>>;
  setAudioOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoPlay: React.Dispatch<React.SetStateAction<boolean>>;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  setPlaybackSpeed: React.Dispatch<React.SetStateAction<number>>;
  setLoop: React.Dispatch<React.SetStateAction<boolean>>;
  setMutashabihatMode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowTranslation: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSimilarPhrases: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [reciter, setReciter] = usePersistedState<ReciterId>(
    "tmh.reciter",
    "husary"
  );
  const [audioOnly, setAudioOnly] = usePersistedState(
    "tmh.audioOnly",
    false
  );
  const [autoPlay, setAutoPlay] = usePersistedState("tmh.autoPlay", false);
  const [volume, setVolume] = usePersistedState<number>("tmh.volume", 100);
  const [playbackSpeed, setPlaybackSpeed] = usePersistedState<number>(
    "tmh.playbackSpeed",
    1
  );
  const [loop, setLoop] = usePersistedState<boolean>("tmh.loop", false);
  const [mutashabihatMode, setMutashabihatMode] = usePersistedState<boolean>(
    "tmh.mutashabihatMode",
    false
  );
  const [showTranslation, setShowTranslation] = usePersistedState(
    "tmh.showTranslation",
    false
  );
  const [showSimilarPhrases, setShowSimilarPhrases] = usePersistedState(
    "tmh.showSimilarPhrases",
    false
  );

  const settings: Settings = {
    theme,
    fontSize,
    hideSurahName,
    testFirstAyahs,
    showAyahNumbers,
    tajweed,
    language,
    reciter,
    audioOnly,
    autoPlay,
    volume,
    playbackSpeed,
    loop,
    mutashabihatMode,
    showTranslation,
    showSimilarPhrases,
  };
  const actions: SettingsActions = {
    setTheme,
    setFontSize,
    setHideSurahName,
    setTestFirstAyahs,
    setShowAyahNumbers,
    setTajweed,
    setLanguage,
    setReciter,
    setAudioOnly,
    setAutoPlay,
    setVolume,
    setPlaybackSpeed,
    setLoop,
    setMutashabihatMode,
    setShowTranslation,
    setShowSimilarPhrases,
    resetSettings: () => {
      setTheme("light");
      setFontSize(FONT_SIZE_DEFAULT);
      setHideSurahName(false);
      setTestFirstAyahs(true);
      setShowAyahNumbers(true);
      setTajweed(false);
      setLanguage("en");
      setReciter("husary");
      setAudioOnly(false);
      setAutoPlay(false);
      setVolume(100);
      setPlaybackSpeed(1);
      setLoop(false);
      setMutashabihatMode(false);
      setShowTranslation(false);
      setShowSimilarPhrases(false);
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

  // Pre-warm the translation file only if the user already has the
  // "show translation" setting on. Otherwise it'd be ~290 KB gzipped
  // of bandwidth they may never use; the file lazy-loads from the
  // AyahTranslation component the moment they enable the toggle.
  useEffect(() => {
    if (showTranslation) void loadTranslation();
  }, [showTranslation]);

  // Similar-ayahs is small (~24 KB gzipped). Pre-warm when enabled,
  // same pattern.
  useEffect(() => {
    if (showSimilarPhrases) void loadSimilar();
  }, [showSimilarPhrases]);

  // Pre-warm the active reciter's word-timing and (for surah-mode
  // reciters) segment tables. The segment fetch is critical on iOS
  // Safari: startSurahMode reads from the cache *synchronously* to
  // keep the audio.play() call inside the user gesture — an awaited
  // promise after the click loses the gesture and silently rejects.
  useEffect(() => {
    void loadReciterWords(reciter);
    if (getReciter(reciter).mode === "surah") {
      void loadReciterSegments(reciter);
    }
  }, [reciter]);

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
