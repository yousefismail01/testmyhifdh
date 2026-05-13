import { useEffect, useRef, useState } from "react";

interface Props {
  surah: number;
  ayah: number;
  ariaLabel?: string;
}

/**
 * Module-level handle to whichever AyahAudioButton is currently playing.
 * Before any button starts playback, it calls `stop()` on the registered
 * holder to silence the previous ayah. The holder is cleared again on
 * pause / end / unmount so the next start doesn't bother calling a
 * stale closure. There's only ever zero or one entry — single-track UX,
 * no playlists.
 */
let currentHolder: { stop: () => void } | null = null;

function takeAudioFocus(holder: { stop: () => void }) {
  if (currentHolder && currentHolder !== holder) currentHolder.stop();
  currentHolder = holder;
}

function releaseAudioFocus(holder: { stop: () => void }) {
  if (currentHolder === holder) currentHolder = null;
}

/**
 * Tiny play/pause button that streams a single ayah from Tarteel's CDN
 * (Husary recitation). The HTMLAudioElement is created lazily on first
 * click so we don't fetch audio you never asked for.
 *
 * Only one ayah can play at a time across the whole app — starting a
 * new one pauses whichever was previously playing via the module-level
 * `currentHolder` above. A new prompt rolling unmounts this component
 * (its key includes surah:ayah); the unmount effect tears the audio
 * element down and releases audio focus.
 */
export default function AyahAudioButton({ surah, ayah, ariaLabel }: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stable per-instance holder reference — registered with the singleton
  // when this button starts playing, cleared when it stops or unmounts.
  const holderRef = useRef<{ stop: () => void }>({
    stop: () => {
      const a = audioRef.current;
      if (a && !a.paused) a.pause();
    },
  });

  // Make sure audio stops if the component is removed mid-playback.
  useEffect(() => {
    const holder = holderRef.current;
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = "";
      }
      releaseAudioFocus(holder);
    };
  }, []);

  const toggle = () => {
    if (audioRef.current && playing) {
      audioRef.current.pause();
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
      return;
    }
    if (audioRef.current && !playing) {
      takeAudioFocus(holderRef.current);
      audioRef.current.play().catch(() => {
        setPlaying(false);
        releaseAudioFocus(holderRef.current);
      });
      setPlaying(true);
      return;
    }
    // First click: create the element. Mahmoud Khalil Al-Husary,
    // Murattal Hafs — the gold-standard recitation for memorization
    // (measured pace, complete vowelization, perfect tajweed). Served
    // by Tarteel's CDN; URL pattern verified against their 6,236-ayah
    // manifest.
    const url = `https://audio-cdn.tarteel.ai/quran/husary/${String(
      surah
    ).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3`;
    const a = new Audio(url);
    a.preload = "none";
    a.addEventListener("ended", () => {
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
    });
    a.addEventListener("pause", () => {
      // Pause fires on both manual pause and end; only flip state if
      // we're not at end (end already fired). Either way the singleton
      // pointer should drop so the next button doesn't shadow-pause us.
      if (!a.ended) setPlaying(false);
      releaseAudioFocus(holderRef.current);
    });
    a.addEventListener("playing", () => {
      setLoading(false);
      setPlaying(true);
    });
    a.addEventListener("waiting", () => setLoading(true));
    a.addEventListener("error", () => {
      setLoading(false);
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
    });
    audioRef.current = a;
    setLoading(true);
    takeAudioFocus(holderRef.current);
    a.play().catch(() => {
      setLoading(false);
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
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
