import { useEffect, useMemo } from "react";
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
  className?: string;
  style?: React.CSSProperties;
  dir?: "rtl" | "ltr";
}

/**
 * Renders an ayah using the QPC v4 per-page font system. A single font
 * set covers both tajweed-colored and plain-Mushaf rendering — the
 * `tajweed` prop just toggles which CPAL palette of the font is active.
 */
export default function AyahText({
  surah,
  ayah,
  tajweed,
  showMarker,
  wordLimit,
  className,
  style,
  dir = "rtl",
}: Props) {
  const runs = useMemo(() => {
    const base = getTajweedRuns(surah, ayah);
    let processed = base;
    if (wordLimit !== undefined && wordLimit > 0 && base.length > 0) {
      // Walk runs taking words (split on ZWSP) until we've collected
      // wordLimit. Truncate the last partial run.
      const ZWSP = "​";
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
    // The last glyph of the last run is the ayah-end ornament. Strip it
    // (and any trailing whitespace) when the user has turned off markers.
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
