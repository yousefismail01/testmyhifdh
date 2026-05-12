import { useEffect, useMemo } from "react";
import { ensurePageFont, getTajweedRuns } from "../data/quran-tajweed";

interface Props {
  surah: number;
  ayah: number;
  /** Plain Uthmani text (used when tajweed is off). */
  plainText: string;
  /** Optional ayah end marker (e.g. the Arabic-Indic digit). */
  marker?: React.ReactNode;
  /** Whether the marker should be shown. Also strips the tajweed run's
   *  baked-in end-of-ayah glyph when false. */
  showMarker: boolean;
  tajweed: boolean;
  className?: string;
  dir?: "rtl" | "ltr";
}

/**
 * Renders an ayah either as the plain Uthmani text (default) or as a
 * per-page-font tajweed-colored composition (when tajweed is enabled).
 */
export default function AyahText({
  surah,
  ayah,
  plainText,
  marker,
  showMarker,
  tajweed,
  className,
  dir = "rtl",
}: Props) {
  const runs = useMemo(() => {
    if (!tajweed) return [];
    const base = getTajweedRuns(surah, ayah);
    if (showMarker || base.length === 0) return base;
    // The last glyph of the last run is the ayah-end ornament. Strip it
    // (and any trailing whitespace) when the user has turned off markers.
    const last = base[base.length - 1];
    const trimmed = last.t.replace(/.\s*$/u, "");
    if (trimmed === last.t) return base;
    if (trimmed.length === 0) return base.slice(0, -1);
    return [...base.slice(0, -1), { p: last.p, t: trimmed }];
  }, [tajweed, surah, ayah, showMarker]);

  useEffect(() => {
    if (!tajweed) return;
    for (const run of runs) ensurePageFont(run.p);
  }, [tajweed, runs]);

  if (!tajweed || runs.length === 0) {
    return (
      <p className={className} dir={dir}>
        {plainText}
        {showMarker ? marker : null}
      </p>
    );
  }

  // The QPC v4 word data already includes the end-of-ayah marker glyph,
  // so don't duplicate it with the standalone marker prop. The qpc-tajweed
  // class lets dark-mode CSS swap to the font's white-base palette.
  return (
    <p className={`${className ?? ""} qpc-tajweed`.trim()} dir={dir}>
      {runs.map((run, i) => (
        <span
          key={i}
          style={{ fontFamily: `'qpc-v4-p${run.p}'` }}
        >
          {run.t}
        </span>
      ))}
    </p>
  );
}
