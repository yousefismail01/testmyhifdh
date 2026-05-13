import { useEffect, useState } from "react";
import {
  isTranslationReady,
  loadTranslation,
  subscribeTranslationReady,
} from "../data/translations-en";

/**
 * Returns `true` once the English translation JSON has loaded. Kicks
 * off the fetch on first mount; subsequent mounts share the same
 * in-flight promise (same pattern as useTajweedReady).
 */
export function useTranslationReady(): boolean {
  const [ready, setReady] = useState<boolean>(isTranslationReady);

  useEffect(() => {
    if (isTranslationReady()) return;
    void loadTranslation();
    return subscribeTranslationReady(() => setReady(true));
  }, []);

  return ready;
}
