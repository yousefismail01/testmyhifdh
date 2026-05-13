import { useEffect, useRef, useState } from "react";

interface Props {
  surah: number;
  ayah: number;
  ariaLabel?: string;
}

/**
 * Tiny play/pause button that streams a single ayah from everyayah.com.
 * The HTMLAudioElement is created lazily on first click so we don't
 * fetch audio you never asked for. A new prompt rolling unmounts this
 * component (its key includes surah:ayah), so we don't have to listen
 * for prop changes to stop playback — the unmount tears the audio
 * element down.
 */
export default function AyahAudioButton({ surah, ayah, ariaLabel }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Make sure audio stops if the component is removed mid-playback.
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = "";
      }
    };
  }, []);

  const toggle = () => {
    if (audioRef.current && playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    if (audioRef.current && !playing) {
      audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
      return;
    }
    // First click: create the element. Mishary Alafasy 128kbps is a
    // good default — gentle pace, complete vowelization, widely loved.
    const url = `https://everyayah.com/data/Alafasy_128kbps/${String(
      surah
    ).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3`;
    const a = new Audio(url);
    a.preload = "none";
    a.addEventListener("ended", () => setPlaying(false));
    a.addEventListener("pause", () => {
      // Pause fires on both manual pause and end; only flip state if
      // we're not at end (end already fired).
      if (!a.ended) setPlaying(false);
    });
    a.addEventListener("playing", () => {
      setLoading(false);
      setPlaying(true);
    });
    a.addEventListener("waiting", () => setLoading(true));
    a.addEventListener("error", () => {
      setLoading(false);
      setPlaying(false);
    });
    audioRef.current = a;
    setLoading(true);
    a.play().catch(() => {
      setLoading(false);
      setPlaying(false);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel ?? "Play ayah"}
      aria-pressed={playing}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      {loading ? (
        <svg
          className="w-3.5 h-3.5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth={3}
            strokeOpacity={0.25}
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </svg>
      ) : playing ? (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
