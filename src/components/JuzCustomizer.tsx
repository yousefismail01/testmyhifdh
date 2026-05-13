import { useMemo, useState } from "react";
import {
  surahs,
  getJuzsSurahs,
  type AyahReference,
  type JuzSurahSegment,
} from "../data/quran-meta";
import type { Language } from "../i18n/translations";
import { useT } from "../i18n/useT";
import { localizeNumber } from "../types/range";
import { useDragSelect } from "../hooks/useDragSelect";
import { useKeyboard } from "../hooks/useKeyboard";

interface Props {
  /** Sorted-ascending list of juz numbers to customize. */
  juzNumbers: number[];
  language: Language;
  onCancel: () => void;
  onApply: (customAyahs: AyahReference[]) => void;
}

type View =
  | { kind: "surahs" }
  | { kind: "ayahs"; surah: number };

/**
 * Customize a juz down to the individual ayah. View stack:
 *
 *   surahs ──► drill into a surah ──► ayahs
 *
 * Selection state lives in a flat Map<surah, Set<ayah>> seeded with every
 * ayah of the juz. The surah row carries a checkbox that toggles the whole
 * surah segment (within juz bounds) plus a drill-arrow into the ayah picker.
 *
 * Ayah picker behavior, matching the user's request "when you select two
 * ayah it selects everything in between, but you can still uncheck specific
 * ayahs if desired":
 *   - Tap an unselected ayah:
 *       • If no anchor is set, select that ayah and mark it as the anchor.
 *       • If an anchor exists, fill every ayah between anchor and the tap
 *         (inclusive); the prior surah selection is replaced. Clear anchor.
 *   - Tap a selected ayah: deselect it. Clear anchor.
 *   - "Select all" / "Clear" buttons operate on the visible surah segment.
 */
export default function JuzCustomizer({
  juzNumbers,
  language,
  onCancel,
  onApply,
}: Props) {
  const t = useT(language);
  const { segments, coveredAyahs } = useMemo(
    () => getJuzsSurahs(juzNumbers),
    [juzNumbers]
  );

  // Initialize selection: every ayah actually covered by the chosen juz(s).
  // For consecutive juzs this matches the segment span; for a non-consecutive
  // pick (e.g. juz 1 + juz 3) the segment span covers in-between ayahs but
  // they start unchecked so the user must opt them in.
  const [selection, setSelection] = useState<Map<number, Set<number>>>(() => {
    const m = new Map<number, Set<number>>();
    for (const seg of segments) {
      const covered = coveredAyahs.get(seg.surah);
      m.set(seg.surah, covered ? new Set(covered) : new Set());
    }
    return m;
  });

  const [view, setView] = useState<View>({ kind: "surahs" });
  const [anchor, setAnchor] = useState<number | null>(null);

  const totalSelected = useMemo(() => {
    let n = 0;
    for (const set of selection.values()) n += set.size;
    return n;
  }, [selection]);

  const segmentBySurah = useMemo(() => {
    const m = new Map<number, JuzSurahSegment>();
    for (const seg of segments) m.set(seg.surah, seg);
    return m;
  }, [segments]);

  const toggleSurah = (surahNumber: number) => {
    const seg = segmentBySurah.get(surahNumber);
    if (!seg) return;
    setSelection((prev) => {
      const next = new Map(prev);
      const current = next.get(surahNumber) ?? new Set<number>();
      const segSize = seg.segmentCount;
      if (current.size === segSize) {
        // All selected → clear.
        next.set(surahNumber, new Set());
      } else {
        const filled = new Set<number>();
        for (let a = seg.startAyah; a <= seg.endAyah; a++) filled.add(a);
        next.set(surahNumber, filled);
      }
      return next;
    });
  };

  const handleAyahTap = (surahNumber: number, ayah: number) => {
    setSelection((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(surahNumber) ?? []);
      if (current.has(ayah)) {
        // Deselect single ayah, drop anchor.
        current.delete(ayah);
        next.set(surahNumber, current);
        setAnchor(null);
      } else if (anchor === null) {
        // Set new anchor; select only this ayah.
        current.add(ayah);
        next.set(surahNumber, current);
        setAnchor(ayah);
      } else {
        // Fill range between anchor and this tap; replace surah selection.
        const seg = segmentBySurah.get(surahNumber);
        if (!seg) return prev;
        const lo = Math.min(anchor, ayah);
        const hi = Math.max(anchor, ayah);
        const filled = new Set<number>();
        for (let a = lo; a <= hi; a++) {
          if (a >= seg.startAyah && a <= seg.endAyah) filled.add(a);
        }
        next.set(surahNumber, filled);
        setAnchor(null);
      }
      return next;
    });
  };

  const setAyahAt = (
    surahNumber: number,
    ayah: number,
    selected: boolean
  ) => {
    setSelection((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(surahNumber) ?? []);
      if (selected) current.add(ayah);
      else current.delete(ayah);
      next.set(surahNumber, current);
      return next;
    });
    setAnchor(null);
  };

  const selectAllInSurah = (surahNumber: number) => {
    const seg = segmentBySurah.get(surahNumber);
    if (!seg) return;
    setSelection((prev) => {
      const next = new Map(prev);
      const filled = new Set<number>();
      for (let a = seg.startAyah; a <= seg.endAyah; a++) filled.add(a);
      next.set(surahNumber, filled);
      return next;
    });
    setAnchor(null);
  };

  const clearSurah = (surahNumber: number) => {
    setSelection((prev) => {
      const next = new Map(prev);
      next.set(surahNumber, new Set());
      return next;
    });
    setAnchor(null);
  };

  const applyAndStart = () => {
    const flat: AyahReference[] = [];
    for (const seg of segments) {
      const set = selection.get(seg.surah);
      if (!set) continue;
      const sorted = Array.from(set).sort((a, b) => a - b);
      for (const a of sorted) flat.push({ surah: seg.surah, ayah: a });
    }
    if (flat.length === 0) return;
    onApply(flat);
  };

  const openAyahView = (surahNumber: number) => {
    setAnchor(null);
    setView({ kind: "ayahs", surah: surahNumber });
  };

  const backToSurahs = () => {
    setAnchor(null);
    setView({ kind: "surahs" });
  };

  // Keyboard shortcuts:
  //   Escape       Step back (ayah view → surah list → cancel) — same
  //                semantics as tapping the back arrow in the header.
  //   Enter        Apply (begin with the current selection), when the
  //                surah list is showing and at least one ayah is
  //                selected. In the ayah view Enter steps back to the
  //                surah list — matching the back-button affordance.
  useKeyboard({
    Escape: () => {
      if (view.kind === "ayahs") backToSurahs();
      else onCancel();
    },
    Enter: () => {
      if (view.kind === "ayahs") backToSurahs();
      else if (totalSelected > 0) applyAndStart();
    },
  });

  return (
    <div
      className="fixed inset-0 z-[60] bg-white dark:bg-neutral-950 animate-fade-in flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-4 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 shrink-0">
          <button
            onClick={view.kind === "ayahs" ? backToSurahs : onCancel}
            className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t("back")}
          </button>
          <div className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate px-2">
            {view.kind === "surahs"
              ? (() => {
                  const n = (x: number) => localizeNumber(x, language);
                  const word = t("juzLabel");
                  if (juzNumbers.length === 1) return `${word} ${n(juzNumbers[0])}`;
                  if (juzNumbers.length <= 3)
                    return `${word} ${juzNumbers.map(n).join(", ")}`;
                  return `${word} ${juzNumbers.slice(0, 2).map(n).join(", ")} +${n(
                    juzNumbers.length - 2
                  )}`;
                })()
              : language === "en"
              ? surahs[view.surah - 1].name
              : surahs[view.surah - 1].nameArabic}
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums w-12 text-right">
            {totalSelected}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide -mx-4 px-4">
          {view.kind === "surahs" ? (
            <SurahsList
              segments={segments}
              selection={selection}
              onToggle={toggleSurah}
              onDrill={openAyahView}
            />
          ) : (
            <AyahGrid
              segment={segmentBySurah.get(view.surah)!}
              selected={selection.get(view.surah) ?? new Set()}
              anchor={anchor}
              onTap={(a) => handleAyahTap(view.surah, a)}
              setAyah={(a, sel) => setAyahAt(view.surah, a, sel)}
              onSelectAll={() => selectAllInSurah(view.surah)}
              onClear={() => clearSurah(view.surah)}
              hint={t("tapTwoHint")}
              selectAllLabel={t("selectAll")}
              clearLabel={t("clearAll")}
            />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 pt-3 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={applyAndStart}
            disabled={totalSelected === 0}
            className="flex-1 py-3 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-xl transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {t("begin")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SurahsList({
  segments,
  selection,
  onToggle,
  onDrill,
}: {
  segments: JuzSurahSegment[];
  selection: Map<number, Set<number>>;
  onToggle: (surah: number) => void;
  onDrill: (surah: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {segments.map((seg) => {
        const info = surahs[seg.surah - 1];
        const set = selection.get(seg.surah) ?? new Set<number>();
        const count = set.size;
        const total = seg.segmentCount;
        const allSelected = count === total;
        const noneSelected = count === 0;
        return (
          <div
            key={seg.surah}
            className="flex items-stretch gap-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => onToggle(seg.surah)}
              className="flex items-center gap-3 px-4 py-3 flex-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              aria-label={`Toggle ${info.name}`}
            >
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                  allSelected
                    ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100"
                    : noneSelected
                    ? "border-neutral-300 dark:border-neutral-600"
                    : "bg-neutral-400 dark:bg-neutral-500 border-neutral-400 dark:border-neutral-500"
                }`}
                aria-hidden
              >
                {allSelected && (
                  <svg
                    className="w-3 h-3 text-white dark:text-neutral-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {!allSelected && !noneSelected && (
                  <span className="w-2 h-0.5 bg-white dark:bg-neutral-900" />
                )}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {info.number}. {info.name}
                </span>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                  {seg.startAyah}–{seg.endAyah} · {count}/{total}
                </span>
              </span>
            </button>
            <button
              onClick={() => onDrill(seg.surah)}
              className="px-4 flex items-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              aria-label={`Drill into ${info.name}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AyahGrid({
  segment,
  selected,
  anchor,
  onTap,
  setAyah,
  onSelectAll,
  onClear,
  hint,
  selectAllLabel,
  clearLabel,
}: {
  segment: JuzSurahSegment;
  selected: Set<number>;
  anchor: number | null;
  onTap: (ayah: number) => void;
  setAyah: (ayah: number, selected: boolean) => void;
  onSelectAll: () => void;
  onClear: () => void;
  hint: string;
  selectAllLabel: string;
  clearLabel: string;
}) {
  const ayahs: number[] = [];
  for (let a = segment.startAyah; a <= segment.endAyah; a++) ayahs.push(a);
  const bindDrag = useDragSelect<number>({
    items: ayahs,
    isSelected: (a) => selected.has(a),
    onTap,
    setItem: setAyah,
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
        {hint}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onSelectAll}
          className="flex-1 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          {selectAllLabel}
        </button>
        <button
          onClick={onClear}
          className="flex-1 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          {clearLabel}
        </button>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 select-none touch-none">
        {ayahs.map((a) => {
          const isSelected = selected.has(a);
          const isAnchor = anchor === a;
          return (
            <button
              key={a}
              type="button"
              {...bindDrag(a)}
              className={`py-2.5 rounded-lg text-xs font-medium tabular-nums transition-all duration-150 ${
                isAnchor
                  ? "ring-2 ring-amber-400 dark:ring-amber-300 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                  : isSelected
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                  : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              }`}
            >
              {a}
            </button>
          );
        })}
      </div>
    </div>
  );
}
