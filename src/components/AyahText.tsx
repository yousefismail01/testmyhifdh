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
  className,
  style,
  dir = "rtl",
}: Props) {
  const runs = useMemo(() => {
    const base = getTajweedRuns(surah, ayah);
    if (showMarker || base.length === 0) return base;
    // The last glyph of the last run is the ayah-end ornament. Strip it
    // (and any trailing whitespace) when the user has turned off markers.
    const last = base[base.length - 1];
    const trimmed = last.t.replace(/.\s*$/u, "");
    if (trimmed === last.t) return base;
    if (trimmed.length === 0) return base.slice(0, -1);
    return [...base.slice(0, -1), { p: last.p, t: trimmed }];
  }, [surah, ayah, showMarker]);

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
