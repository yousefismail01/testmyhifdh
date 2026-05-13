import { useRef, type ReactNode } from "react";

interface Props {
  label: string;
  /** Tap: toggle the hint menu open/closed. */
  onTap: () => void;
  /** Long-press (≥ 400ms): cycle through hint types directly. */
  onLongPress: () => void;
  active: boolean;
  disabled: boolean;
  /** Optional trailing content (e.g. a keyboard hint chip). */
  trailing?: ReactNode;
}

const LONG_PRESS_MS = 400;

/**
 * Tap-or-long-press hint button. Pointer-down starts a timer; if it
 * elapses before pointer-up, we treat the gesture as a long-press and
 * cancel the click. Otherwise pointer-up fires the regular tap. Works
 * uniformly across mouse, touch and stylus via PointerEvents.
 */
export default function HintButton({
  label,
  onTap,
  onLongPress,
  active,
  disabled,
  trailing,
}: Props) {
  const timerRef = useRef<number | null>(null);
  const firedLongPressRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={() => {
        firedLongPressRef.current = false;
        clearTimer();
        timerRef.current = window.setTimeout(() => {
          firedLongPressRef.current = true;
          onLongPress();
        }, LONG_PRESS_MS);
      }}
      onPointerUp={() => {
        clearTimer();
        if (!firedLongPressRef.current) onTap();
      }}
      onPointerLeave={clearTimer}
      onPointerCancel={clearTimer}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex-1 py-3 font-medium rounded-xl border transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center gap-2 ${
        active
          ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900"
          : "bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800"
      }`}
      aria-haspopup="menu"
      aria-expanded={active}
    >
      {label}
      {trailing}
    </button>
  );
}
