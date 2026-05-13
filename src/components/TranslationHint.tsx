import { getTranslation } from "../data/translations-en";
import { useTranslationReady } from "../hooks/useTranslationReady";

interface Props {
  surah: number;
  ayah: number;
  /** Number of "doses" of the translation to reveal. */
  step: number;
  /** Words per dose. step=1 reveals this many; step=2 reveals 2×; etc. */
  wordsPerStep: number;
  className?: string;
}

/**
 * Progressive translation hint. Renders the first `step * wordsPerStep`
 * words of the ayah's English translation, with a trailing "…" while
 * there's more to reveal. Lazy-loads the translation index on first
 * mount; renders nothing until the data lands.
 */
export default function TranslationHint({
  surah,
  ayah,
  step,
  wordsPerStep,
  className = "",
}: Props) {
  const ready = useTranslationReady();
  if (!ready || step <= 0) return null;
  const text = getTranslation(surah, ayah);
  if (!text) return null;
  const words = text.split(/\s+/);
  const limit = Math.min(words.length, step * wordsPerStep);
  const partial = words.slice(0, limit).join(" ");
  const isFull = limit >= words.length;
  return (
    <p
      lang="en"
      dir="ltr"
      className={`text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 italic text-start ${className}`}
    >
      {partial}
      {!isFull && (
        <span className="text-neutral-400 dark:text-neutral-500"> …</span>
      )}
    </p>
  );
}
