/**
 * Tiny keyboard-shortcut chip that only renders on screens wide enough
 * to plausibly have a physical keyboard (≥ md breakpoint). Hidden on
 * phones so the action labels don't get cramped on touch UIs.
 *
 * `inverted` flips the palette for use on dark-background buttons
 * (the "Next random ayah" CTA, etc.).
 */
export default function KbdHint({
  label,
  inverted = false,
}: {
  label: string;
  inverted?: boolean;
}) {
  return (
    <kbd
      aria-hidden
      className={`hidden md:inline-flex items-center justify-center min-w-[1.5em] px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
        inverted
          ? "border-white/30 dark:border-neutral-900/30 text-white/80 dark:text-neutral-900/70"
          : "border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800"
      }`}
    >
      {label}
    </kbd>
  );
}
