import { useT } from "../i18n/useT";
import type { Language } from "../i18n/translations";
import { useKeyboard } from "../hooks/useKeyboard";

interface Props {
  open: boolean;
  onClose: () => void;
  language: Language;
  /** Which screen invoked the help — affects which bindings are shown. */
  context: "home" | "quiz";
}

interface Row {
  keys: string[];
  description: string;
}

/**
 * Modal overlay listing the global keyboard bindings. Triggered by `?`
 * from either the home screen or the quiz screen. The shortcut list
 * stays in this component (rather than in i18n dictionaries) because
 * each binding maps to a real handler in the parent — keeping them
 * together makes drift between docs and code obvious.
 */
export default function KeyboardHelp({
  open,
  onClose,
  language,
  context,
}: Props) {
  const t = useT(language);
  useKeyboard({ Escape: () => onClose(), "?": () => onClose() }, open);
  if (!open) return null;

  const quizRows: Row[] = [
    { keys: ["Space"], description: "Reveal next ayah" },
    { keys: ["Shift", "Space"], description: "Reveal next 10 ayahs" },
    { keys: ["Enter"], description: "Reveal next 10 ayahs" },
    { keys: ["→"], description: "Reveal next ayah" },
    { keys: ["↓"], description: "Reveal next ayah" },
    { keys: ["N"], description: "Next random ayah" },
    { keys: ["R"], description: "Next random ayah" },
    { keys: ["Esc"], description: "Back / close overlay" },
    { keys: ["S"], description: "Toggle settings" },
    { keys: ["T"], description: "Toggle theme" },
    { keys: ["?"], description: "Show this help" },
  ];
  const homeRows: Row[] = [
    { keys: ["1"], description: "Juz tab" },
    { keys: ["2"], description: "Surah tab" },
    { keys: ["3"], description: "Page tab" },
    { keys: ["←", "→"], description: "Switch tabs (when focused)" },
    { keys: ["Enter"], description: "Begin" },
    { keys: ["S"], description: "Toggle settings" },
    { keys: ["T"], description: "Toggle theme" },
    { keys: ["Esc"], description: "Close overlay" },
    { keys: ["?"], description: "Show this help" },
  ];
  const rows = context === "quiz" ? quizRows : homeRows;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/60 animate-fade-in-soft"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kbhelp-title"
        className="fixed z-[80] inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl shadow-neutral-900/20">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="kbhelp-title"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              {t("keyboardShortcuts")}
            </h2>
            <button
              onClick={onClose}
              aria-label={t("cancel")}
              className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {rows.map((row, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-xs text-neutral-600 dark:text-neutral-300">
                  {row.description}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {row.keys.map((k, j) => (
                    <kbd
                      key={j}
                      className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
