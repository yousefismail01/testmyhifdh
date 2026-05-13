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
   * positioned gray-gradient slides under the matching word with a
   * CSS transition. -1 / undefined → no highlight.
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
 * When `highlightWordIndex` is set, words are wrapped in per-word spans
 * with a `data-word-idx` attribute and a sliding gray-gradient overlay
 * tracks the active one. The overlay is a single absolutely-positioned
 * element that animates its top/left/width/height via CSS transitions —
 * so the highlight slides between words rather than popping in/out, and
 * it stays in place while audio is between word segments (the parent
 * only updates the index when a positive match is found).
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

  // ---- Plain render (no highlighting requested) ----------------------------
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

  // ---- Highlight render: per-word spans + sliding overlay ------------------
  // Words are numbered cumulatively across runs to match the audio
  // segment index. Each word span carries a `data-word-idx` attribute
  // so the layout-effect measurer can find the active one.
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
  const [hl, setHl] = useState<HLRect | null>(null);

  // Precompute cumulative word-start indices per run so each word knows
  // its global position.
  const wordsByRun = useMemo(
    () => runs.map((r) => r.t.split(ZWSP)),
    [runs]
  );
  const runStartIdx = useMemo(() => {
    const acc: number[] = [];
    let n = 0;
    for (const ws of wordsByRun) {
      acc.push(n);
      n += ws.length;
    }
    return acc;
  }, [wordsByRun]);

  // Re-measure the active word's bounding box whenever the index, the
  // viewport, or the font size changes.
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const measure = () => {
      const el = root.querySelector<HTMLElement>(
        `[data-word-idx="${highlightWordIndex}"]`
      );
      if (!el) return;
      const rootRect = root.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setHl({
        top: rect.top - rootRect.top,
        left: rect.left - rootRect.left,
        width: rect.width,
        height: rect.height,
      });
    };
    measure();
    // Re-measure on viewport changes. Font load completion can also
    // shift glyph metrics, so listen to document.fonts.ready as a
    // safety net.
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
  }, [highlightWordIndex, runs]);

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
      {runs.map((run, runIdx) => {
        const words = wordsByRun[runIdx];
        const startIdx = runStartIdx[runIdx];
        return (
          <span
            key={runIdx}
            style={{ fontFamily: `'qpc-v4-p${run.p}'`, position: "relative" }}
          >
            {words.map((w, wi) => (
              <span key={wi}>
                <span data-word-idx={startIdx + wi}>{w}</span>
                {wi < words.length - 1 && ZWSP}
              </span>
            ))}
          </span>
        );
      })}
    </p>
  );
}
