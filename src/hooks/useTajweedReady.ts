import { useEffect, useState } from "react";
import {
  isTajweedReady,
  loadTajweed,
  subscribeTajweedReady,
} from "../data/quran-tajweed";

/**
 * Returns `true` once the tajweed JSON has loaded (or failed). Triggers
 * the fetch on first mount of any component that uses it; subsequent
 * mounts share the same in-flight promise.
 */
export function useTajweedReady(): boolean {
  const [ready, setReady] = useState<boolean>(isTajweedReady);

  useEffect(() => {
    if (isTajweedReady()) return;
    void loadTajweed();
    const unsubscribe = subscribeTajweedReady(() => setReady(true));
    return unsubscribe;
  }, []);

  return ready;
}
