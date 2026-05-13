import AyahText from "./AyahText";
import AyahSimilarHint from "./AyahSimilarHint";
import TranslationHint from "./TranslationHint";
import type { AyahReference } from "./../data/quran-meta";
import type { Language } from "../i18n/translations";
import { useT } from "../i18n/useT";

interface Props {
  /** Currently-displayed ayah (prompt or last revealed). Drives the
   *  context shown — similar-verses lookup. Translation rides inline
   *  under each ayah card instead of in the sidebar. */
  lastShown: AyahReference | null;
  /** Next ayah the user is trying to recite. Drives the hint card. */
  hintTarget: AyahReference | null;
  language: Language;
  tajweed: boolean;
  fontSize: number;
  showSimilarPhrases: boolean;
  hintFirstWordCount: number;
  hintTranslationStep: number;
  hintTranslationWordsPerStep: number;
}

/**
 * Wide-screen-only sidebar. Shows context for the ayah the user is
 * currently reading (translation, similar-verse references) and the
 * progressive hint card targeted at the *next* ayah. Hidden on phones
 * and tablets where these elements render inline beneath each card
 * instead.
 */
export default function QuizSidebar({
  lastShown,
  hintTarget,
  language,
  tajweed,
  fontSize,
  showSimilarPhrases,
  hintFirstWordCount,
  hintTranslationStep,
  hintTranslationWordsPerStep,
}: Props) {
  const t = useT(language);
  const hintActive =
    !!hintTarget &&
    (hintFirstWordCount > 0 || hintTranslationStep > 0);
  const hasContext = !!lastShown && showSimilarPhrases;

  if (!hintActive && !hasContext) {
    return (
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:text-center lg:w-80 lg:shrink-0 lg:p-6 lg:text-neutral-400 lg:dark:text-neutral-600">
        <div className="text-xs uppercase tracking-widest leading-relaxed max-w-[14rem]">
          {t("sidebarEmpty")}
        </div>
      </div>
    );
  }

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:gap-4 lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:pe-1 scrollbar-hide"
      aria-label="Context panel"
    >
      {hintActive && hintTarget && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-3xl border border-amber-200/60 dark:border-amber-900/40 p-5 animate-fade-in-soft">
          <div className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-1.5">
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z" />
            </svg>
            {t("hint")}
          </div>
          {hintFirstWordCount > 0 && (
            <AyahText
              surah={hintTarget.surah}
              ayah={hintTarget.ayah}
              showMarker={false}
              tajweed={tajweed}
              wordLimit={hintFirstWordCount}
              className="font-quran leading-[2.4] text-neutral-800 dark:text-neutral-200 text-right"
              style={{ fontSize: `${fontSize}px` }}
            />
          )}
          {hintTranslationStep > 0 && (
            <TranslationHint
              surah={hintTarget.surah}
              ayah={hintTarget.ayah}
              step={hintTranslationStep}
              wordsPerStep={hintTranslationWordsPerStep}
              className={hintFirstWordCount > 0 ? "mt-3" : ""}
            />
          )}
        </div>
      )}

      {hasContext && lastShown && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
            {t("sidebarContext")}
          </div>
          <AyahSimilarHint
            surah={lastShown.surah}
            ayah={lastShown.ayah}
            language={language}
          />
        </div>
      )}
    </aside>
  );
}
