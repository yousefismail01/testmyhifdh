import { getTranslation } from "../data/translations-en";
import { useTranslationReady } from "../hooks/useTranslationReady";

interface Props {
  surah: number;
  ayah: number;
}

/**
 * Renders the English translation for an ayah as a muted hint line.
 * Lazy-fetches the translation table on first mount; while it's
 * loading, renders nothing rather than flashing a placeholder.
 *
 * Brackets in the Sahih International text (e.g. "[All] praise…")
 * indicate inserted-for-clarity words and read fine inline — no
 * processing needed.
 */
export default function AyahTranslation({ surah, ayah }: Props) {
  const ready = useTranslationReady();
  if (!ready) return null;
  const text = getTranslation(surah, ayah);
  if (!text) return null;
  return (
    <p
      lang="en"
      dir="ltr"
      className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 italic text-start"
    >
      {text}
    </p>
  );
}
