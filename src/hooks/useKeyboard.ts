import { useEffect, useRef } from "react";

type Handler = (e: KeyboardEvent) => void;

export interface ShortcutMap {
  /** Single-key bindings; the key string matches `KeyboardEvent.key`. */
  [key: string]: Handler;
}

/**
 * Global keyboard handler. Skips events whose target is a form element
 * (input/textarea/select/contenteditable) so the user can still type
 * juz numbers, ayah counts, etc. Listeners are scoped to the lifetime
 * of the calling component.
 *
 * `enabled` lets callers conditionally turn the listener off (e.g.
 * disable the quiz shortcuts while an overlay owns the keys). The map
 * is stored in a ref so each render's fresh closures stay current
 * without re-binding the event listener.
 */
export function useKeyboard(map: ShortcutMap, enabled = true) {
  const mapRef = useRef(map);
  // Mirror the latest map into the ref after render. The keydown
  // handler reads from the ref so closures stay current without the
  // event listener being rebound every render.
  useEffect(() => {
    mapRef.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      // Match the literal key first (lets callers bind " ", "Enter",
      // "Escape", "ArrowRight", etc.). Fall back to a lower-case alias
      // so single-letter bindings don't need to spell out both cases.
      const handler =
        mapRef.current[e.key] ?? mapRef.current[e.key.toLowerCase()];
      if (handler) handler(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
