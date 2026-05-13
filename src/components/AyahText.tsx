import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ensurePageFont, getTajweedRuns } from "../data/quran-tajweed";

interface Props {
  surah: number;
  ayah: number;
  /** When true, render with the QPC v4 colored palette; otherwise the
   *  font's monochrome palette so the text looks like a normal Mushaf. */
  tajweed: boolean;
  /** When false, strip the final glyph (the end-of-ayah ornament) from
   *  the last run so the verse ends cleanly. */
  showMarker: boolean;
  /**
   * Render only the first N words of the ayah. Words within a run are
   * ZWSP-separated; runs in turn split at page boundaries, so we walk
   * runs in order and keep words until the budget is exhausted. Used
   * by the "First word" hint.
   */
  wordLimit?: number;
  /**
   * Zero-based index of the word to highlight (for word-by-word
   * audio playback). When set and within range, an absolutely-
   * positioned gray block slides under the matching word with a CSS
   * transition. -1 / undefined → no highlight.
   */
  highlightWordIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  dir?: "rtl" | "ltr";
}

const ZWSP = "​";

interface HLRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Renders an ayah using the QPC v4 per-page font system. A single font
 * set covers both tajweed-colored and plain-Mushaf rendering — the
 * `tajweed` prop just toggles which CPAL palette of the font is active.
 *
 * When `highlightWordIndex` is set, the run text stays as a single
 * span (so the QPC v4 font's contextual word spacing remains intact)
 * and the active word's bounding rect is measured via the Range API.
 * An absolutely-positioned gray block animates over it via CSS
 * transitions — sliding between words rather than popping in/out, and
 * staying put while audio is between word segments.
 */
export default function AyahText({
  surah,
  ayah,
  tajweed,
  showMarker,
  wordLimit,
  highlightWordIndex,
  className,
  style,
  dir = "rtl",
}: Props) {
  const runs = useMemo(() => {
    const base = getTajweedRuns(surah, ayah);
    let processed = base;
    if (wordLimit !== undefined && wordLimit > 0 && base.length > 0) {
      let remaining = wordLimit;
      const out: typeof base = [];
      for (const run of base) {
        if (remaining <= 0) break;
        const words = run.t.split(ZWSP);
        if (words.length <= remaining) {
          out.push(run);
          remaining -= words.length;
        } else {
          out.push({ p: run.p, t: words.slice(0, remaining).join(ZWSP) });
          remaining = 0;
        }
      }
      processed = out;
    }
    if (showMarker || processed.length === 0) return processed;
    const last = processed[processed.length - 1];
    const trimmed = last.t.replace(/.\s*$/u, "");
    if (trimmed === last.t) return processed;
    if (trimmed.length === 0) return processed.slice(0, -1);
    return [...processed.slice(0, -1), { p: last.p, t: trimmed }];
  }, [surah, ayah, showMarker, wordLimit]);

  useEffect(() => {
    for (const run of runs) ensurePageFont(run.p);
  }, [runs]);

  const classes = [
    className ?? "",
    "qpc-page-text",
    tajweed ? "qpc-tajweed" : "qpc-plain",
  ]
    .filter(Boolean)
    .join(" ");

  if (
    typeof highlightWordIndex !== "number" ||
    highlightWordIndex < 0
  ) {
    return (
      <p className={classes} style={style} dir={dir}>
        {runs.map((run, i) => (
          <span key={i} style={{ fontFamily: `'qpc-v4-p${run.p}'` }}>
            {run.t}
          </span>
        ))}
      </p>
    );
  }

  return (
    <HighlightedRender
      runs={runs}
      classes={classes}
      style={style}
      dir={dir}
      highlightWordIndex={highlightWordIndex}
    />
  );
}

function HighlightedRender({
  runs,
  classes,
  style,
  dir,
  highlightWordIndex,
}: {
  runs: ReturnType<typeof getTajweedRuns>;
  classes: string;
  style?: React.CSSProperties;
  dir: "rtl" | "ltr";
  highlightWordIndex: number;
}) {
  const containerRef = useRef<HTMLParagraphElement | null>(null);
  const runRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [hl, setHl] = useState<HLRect | null>(null);

  // Per-run char ranges for each word. Words are ZWSP-separated; we
  // record [start, end) into the run's full text so the Range API
  // can select exactly the word's characters without disturbing
  // glyph shaping.
  const charRanges = useMemo(
    () =>
      runs.map((run) => {
        const ranges: Array<[number, number]> = [];
        let start = 0;
        for (let i = 0; i < run.t.length; i++) {
          if (run.t[i] === ZWSP) {
            ranges.push([start, i]);
            start = i + 1;
          }
        }
        ranges.push([start, run.t.length]);
        return ranges;
      }),
    [runs]
  );

  // Cumulative word-start index per run.
  const runStartIdx = useMemo(() => {
    const acc: number[] = [];
    let n = 0;
    for (const cr of charRanges) {
      acc.push(n);
      n += cr.length;
    }
    return acc;
  }, [charRanges]);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const measure = () => {
      // Find which run owns the active word.
      let runIdx = -1;
      let localIdx = -1;
      for (let i = 0; i < runStartIdx.length; i++) {
        const start = runStartIdx[i];
        const end =
          i + 1 < runStartIdx.length ? runStartIdx[i + 1] : Infinity;
        if (highlightWordIndex >= start && highlightWordIndex < end) {
          runIdx = i;
          localIdx = highlightWordIndex - start;
          break;
        }
      }
      if (runIdx < 0) return;
      const span = runRefs.current[runIdx];
      if (!span || !span.firstChild) return;
      const textNode = span.firstChild;
      if (textNode.nodeType !== Node.TEXT_NODE) return;
      const cr = charRanges[runIdx][localIdx];
      if (!cr) return;
      try {
        const range = document.createRange();
        range.setStart(textNode, cr[0]);
        range.setEnd(textNode, cr[1]);
        const rect = range.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        setHl({
          top: rect.top - rootRect.top,
          left: rect.left - rootRect.left,
          width: rect.width,
          height: rect.height,
        });
        range.detach?.();
      } catch {
        /* range API unavailable / text node mutated mid-measure */
      }
    };
    measure();
    window.addEventListener("resize", measure);
    let cancelled = false;
    if ("fonts" in document) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
    };
  }, [highlightWordIndex, runs, runStartIdx, charRanges]);

  return (
    <p
      ref={containerRef}
      className={`${classes} relative`}
      style={style}
      dir={dir}
    >
      {hl && (
        <span
          aria-hidden
          className="absolute pointer-events-none rounded-md"
          style={{
            top: hl.top,
            left: hl.left,
            width: hl.width,
            height: hl.height,
            backgroundColor: "rgba(115, 115, 115, 0.22)",
            transition:
              "top 260ms cubic-bezier(0.4,0,0.2,1), left 260ms cubic-bezier(0.4,0,0.2,1), width 260ms cubic-bezier(0.4,0,0.2,1), height 260ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      )}
      {runs.map((run, runIdx) => (
        <span
          key={runIdx}
          ref={(el) => {
            runRefs.current[runIdx] = el;
          }}
          style={{ fontFamily: `'qpc-v4-p${run.p}'` }}
        >
          {run.t}
        </span>
      ))}
    </p>
  );
}
