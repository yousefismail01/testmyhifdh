import { useEffect, useMemo } from "react";
import { ensurePageFont, getTajweedRuns } from "../data/quran-tajweed";

interface Props {
  surah: number;
  ayah: number;
  /** Plain Uthmani text (used when tajweed is off). */
  plainText: string;
  /** Optional ayah end marker (e.g. the Arabic-Indic digit). */
  marker?: React.ReactNode;
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
  tajweed,
  className,
  dir = "rtl",
}: Props) {
  const runs = useMemo(
    () => (tajweed ? getTajweedRuns(surah, ayah) : []),
    [tajweed, surah, ayah]
  );

  useEffect(() => {
    if (!tajweed) return;
    for (const run of runs) ensurePageFont(run.p);
  }, [tajweed, runs]);

  if (!tajweed || runs.length === 0) {
    return (
      <p className={className} dir={dir}>
        {plainText}
        {marker}
      </p>
    );
  }

  // The QPC v4 word data already includes the end-of-ayah marker glyph,
  // so don't duplicate it with the standalone marker prop.
  return (
    <p className={className} dir={dir}>
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
