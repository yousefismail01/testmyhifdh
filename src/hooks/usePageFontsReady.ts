import { useEffect, useState } from "react";
import {
  isPageFontReady,
  subscribePageFontReady,
} from "../data/quran-tajweed";

/**
 * Returns true once every page font in `pages` has finished loading.
 * Used by the hint card so we don't render an AyahText block whose
 * QPC v4 glyphs would be invisible (font-display: block) for the first
 * ~100ms after the user clicks.
 */
export function usePageFontsReady(pages: number[]): boolean {
  // String fingerprint so the effect only re-runs when the set of
  // pages actually changes — not on every render.
  const key = pages.join(",");
  const [ready, setReady] = useState<boolean>(() =>
    pages.every(isPageFontReady)
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const list = key ? key.split(",").map((s) => Number(s)) : [];
    const checkReady = () => list.every(isPageFontReady);
    setReady(checkReady());
    if (checkReady()) return;
    const unsubscribe = subscribePageFontReady(() => {
      if (checkReady()) setReady(true);
    });
    return unsubscribe;
  }, [key]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return ready;
}
