import { useEffect, useState } from "react";
import {
  isTranslationReadyForSurah,
  loadTranslationForSurah,
  subscribeTranslationReady,
} from "../data/translations-en";

/**
 * Returns `true` once the translation file for the given surah has
 * loaded. Triggers the per-surah fetch on first mount. Re-subscribes
 * when the surah changes.
 */
export function useTranslationReadyForSurah(surah: number): boolean {
  const [ready, setReady] = useState<boolean>(() =>
    isTranslationReadyForSurah(surah)
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isTranslationReadyForSurah(surah)) {
      setReady(true);
      return;
    }
    setReady(false);
    void loadTranslationForSurah(surah);
    return subscribeTranslationReady(() => {
      if (isTranslationReadyForSurah(surah)) setReady(true);
    });
  }, [surah]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return ready;
}
