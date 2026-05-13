/**
 * Speaker icon whose silhouette adapts to the current volume level.
 *   muted (0)    — speaker with X
 *   low (1–33)   — speaker, 1 wave
 *   mid (34–66)  — speaker, 2 waves
 *   high (67+)   — speaker, 3 waves (full SVG)
 */
export default function VolumeIcon({
  level,
  className = "w-4 h-4",
}: {
  level: number;
  className?: string;
}) {
  if (level === 0) {
    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5L6 9H2v6h4l5 4V5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M23 9l-6 6m0-6l6 6"
        />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5L6 9H2v6h4l5 4V5z"
      />
      {level > 0 && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.54 8.46a5 5 0 010 7.07"
        />
      )}
      {level > 33 && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19.07 4.93a10 10 0 010 14.14"
        />
      )}
    </svg>
  );
}
