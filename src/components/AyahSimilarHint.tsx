import { surahs } from "../data/quran-meta";
import { getSimilarAyahs } from "../data/similar-ayahs";
import { useSimilarReady } from "../hooks/useSimilarReady";
import type { Language } from "../i18n/translations";
import { useT } from "../i18n/useT";
import { localizeNumber } from "../types/range";

interface Props {
  surah: number;
  ayah: number;
  language: Language;
}

/**
 * Mutashabihat hint chip. Lists references to other ayahs with similar
 * wording — the most common hifz pitfall is "jumping" to a parallel
 * verse, so a quiet "also: 2:163, 47:19, 73:9" callout is a useful
 * teaching aid.
 *
 * Lazy-fetches the similar-ayahs index on first mount; renders nothing
 * until the data lands and nothing when the current ayah has no
 * recorded similar entries.
 */
export default function AyahSimilarHint({ surah, ayah, language }: Props) {
  const ready = useSimilarReady();
  const t = useT(language);
  if (!ready) return null;
  const refs = getSimilarAyahs(surah, ayah);
  if (refs.length === 0) return null;
  const n = (x: number) => localizeNumber(x, language);
  return (
    <div className="mt-3 flex items-start gap-2 text-xs text-neutral-400 dark:text-neutral-500">
      <svg
        className="w-3.5 h-3.5 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 015.656 0l1.415 1.415a4 4 0 010 5.656l-3.535 3.536a4 4 0 01-5.657 0l-1.414-1.414M10.172 13.828a4 4 0 01-5.656 0L3.1 12.414a4 4 0 010-5.657L6.636 3.22a4 4 0 015.657 0l1.414 1.414"
        />
      </svg>
      <span className="leading-relaxed">
        <span className="me-1 uppercase tracking-widest">
          {t("similarPhrases")}:
        </span>
        {refs.map((ref, i) => {
          const [s, a] = ref.split(":").map(Number);
          const surahName =
            language === "en" ? surahs[s - 1].name : surahs[s - 1].nameArabic;
          return (
            <span key={ref}>
              {i > 0 && ", "}
              <span
                className="text-neutral-600 dark:text-neutral-300"
                title={`${surahName} ${a}`}
              >
                {n(s)}:{n(a)}
              </span>
            </span>
          );
        })}
      </span>
    </div>
  );
}
