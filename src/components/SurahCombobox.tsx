import { useEffect, useMemo, useRef, useState } from "react";
import { surahs, type SurahInfo } from "../data/quran-meta";
import { useT } from "../i18n/useT";
import type { Language } from "../i18n/translations";

interface Props {
  value: number;
  onChange: (surahNumber: number) => void;
  language: Language;
  /** Only show surahs with `number >= minSurah` (used by the "to" picker). */
  minSurah?: number;
  /** Accessible label string. */
  ariaLabel?: string;
}

/**
 * Type-to-filter surah picker. Click to open; type to filter by surah
 * number, English name, or Arabic name; ↑/↓ to navigate; Enter to
 * confirm; Esc to close.
 *
 * Replaces the native `<select>` of 114 entries — scanning that list
 * is the worst UX wart of the home screen, especially on desktop.
 */
export default function SurahCombobox({
  value,
  onChange,
  language,
  minSurah = 1,
  ariaLabel,
}: Props) {
  const t = useT(language);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Source list filtered by minSurah + query (case-insensitive substring
  // match on Arabic / English name and exact-or-prefix match on number).
  const filtered = useMemo<SurahInfo[]>(() => {
    const q = query.trim().toLowerCase();
    const eligible = surahs.filter((s) => s.number >= minSurah);
    if (!q) return eligible;
    return eligible.filter((s) => {
      if (String(s.number).startsWith(q)) return true;
      if (s.name.toLowerCase().includes(q)) return true;
      if (s.nameArabic.includes(query.trim())) return true;
      return false;
    });
  }, [query, minSurah]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // When opened, focus the input and reset active index to current value.
  /* eslint-disable react-hooks/exhaustive-deps */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const idx = filtered.findIndex((s) => s.number === value);
    setActiveIdx(idx >= 0 ? idx : 0);
    // Intentionally only re-runs when `open` flips — opening should
    // snap the highlight to the currently-selected surah once; afterwards
    // arrow keys take over.
  }, [open]);
  /* eslint-enable react-hooks/exhaustive-deps */
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep activeIdx in range as `filtered` shrinks with typing.
  useEffect(() => {
    if (activeIdx >= filtered.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIdx(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIdx]);

  // Scroll the active row into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${activeIdx}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const commit = (s: SurahInfo) => {
    onChange(s.number);
    setOpen(false);
    setQuery("");
  };

  const current = surahs[value - 1];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all text-left flex items-center justify-between gap-2"
      >
        <span className="truncate">
          {language === "en"
            ? `${current.number}. ${current.name} — ${current.nameArabic}`
            : `${current.number}. ${current.nameArabic} — ${current.name}`}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform shrink-0 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl shadow-neutral-900/10 dark:shadow-neutral-950/40 overflow-hidden animate-fade-in-soft">
          <div className="p-2 border-b border-neutral-100 dark:border-neutral-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(0, i - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const pick = filtered[activeIdx];
                  if (pick) commit(pick);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                  setQuery("");
                }
              }}
              placeholder={t("searchSurahPlaceholder")}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
              {t("noResults")}
            </div>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-64 overflow-y-auto scrollbar-hide"
            >
              {filtered.map((s, i) => {
                const isActive = i === activeIdx;
                const isCurrent = s.number === value;
                return (
                  <li
                    key={s.number}
                    role="option"
                    aria-selected={isCurrent}
                    data-idx={i}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => commit(s)}
                    className={`flex items-center justify-between gap-3 px-3 py-2 cursor-pointer text-sm ${
                      isActive
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    } ${isCurrent ? "font-medium" : ""}`}
                  >
                    <span className="text-neutral-400 dark:text-neutral-500 tabular-nums w-8 shrink-0">
                      {s.number}
                    </span>
                    <span className="flex-1 text-neutral-800 dark:text-neutral-200 truncate">
                      {language === "en" ? s.name : s.nameArabic}
                    </span>
                    <span
                      className="text-xs text-neutral-400 dark:text-neutral-500 truncate"
                      dir={language === "en" ? "rtl" : "ltr"}
                    >
                      {language === "en" ? s.nameArabic : s.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
