import { useEffect, useRef, useState } from "react";
import {
  getReciter,
  loadReciterSegments,
  getCachedReciterSegments,
  type ReciterId,
  type AyahSegment,
} from "../data/reciters";
import { takeAudioFocus, releaseAudioFocus } from "../lib/audio-focus";

interface Props {
  surah: number;
  ayah: number;
  reciter: ReciterId;
  ariaLabel?: string;
  /** Visual size — "lg" is used in audio-only mode as the prompt's main affordance. */
  size?: "default" | "lg";
  /** If true, start playback automatically once on mount. */
  autoPlay?: boolean;
  /** Playback volume, 0–100. Applied at element creation and live-updated. */
  volume?: number;
  /** Playback speed multiplier. 1.0 = normal. */
  playbackSpeed?: number;
  /** When true, looping plays the ayah repeatedly. */
  loop?: boolean;
  /** Called whenever the playback position changes (for word highlighting). */
  onTimeUpdate?: (currentTimeSec: number) => void;
}

/**
 * Module-level audio-focus holder. Whichever AyahAudioButton is
 * currently playing registers a `stop()` closure here; starting any
 * other button calls that closure first so the previous ayah silences
 * before the new one begins. Single-track UX, no overlapping playback.
 */
// Audio-focus helpers live in lib/audio-focus.ts so they can be shared
// between this component and the QuizScreen hint snippet without
// triggering React Fast Refresh warnings (which fire when a component
// file also exports non-component helpers).

/**
 * Play/pause button for a single ayah's recitation. Handles both
 * delivery modes:
 *
 *   "ayah"   — load the per-ayah MP3, play start to end.
 *   "surah"  — load the whole-surah MP3 once per surah, seek to the
 *              ayah's `from` timestamp on play, and stop when
 *              currentTime crosses `to`. Segment data is fetched on
 *              demand and cached per reciter.
 *
 * Only one ayah can play across the app at a time (see audio-focus
 * holder above). Switching reciter mid-listen tears the current audio
 * element down so the next click loads a fresh one with the right URL.
 */
export default function AyahAudioButton({
  surah,
  ayah,
  reciter,
  ariaLabel,
  size = "default",
  autoPlay = false,
  volume = 100,
  playbackSpeed = 1,
  loop = false,
  onTimeUpdate,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // For surah-mode reciters: the start (seconds) and stop (seconds)
  // for the current ayah within the surah-wide MP3. Used both by the
  // timeupdate listener to halt at the ayah boundary and by the
  // replay path to seek back to the ayah start when the user presses
  // play after it has already ended.
  const fromSecRef = useRef<number | null>(null);
  const stopAtRef = useRef<number | null>(null);

  const holderRef = useRef<{ stop: () => void }>({
    stop: () => {
      const a = audioRef.current;
      if (a && !a.paused) a.pause();
    },
  });

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

  // Live-apply volume changes to a currently-loaded audio element.
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = Math.max(0, Math.min(1, volume / 100));
  }, [volume]);

  // Live-apply speed + loop too.
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = Math.max(0.25, Math.min(4, playbackSpeed));
  }, [playbackSpeed]);
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.loop = loop;
  }, [loop]);

  // Reciter changed mid-flight: tear down so the next click builds a
  // fresh element with the new URL / segment data.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.src = "";
    audioRef.current = null;
    fromSecRef.current = null;
    stopAtRef.current = null;
    setPlaying(false);
    setLoading(false);
    releaseAudioFocus(holderRef.current);
  }, [reciter]);

  // (Autoplay effect is installed further down, after start*Mode are
  // declared — function const TDZ. We don't use a ref guard here: the
  // setTimeout/clearTimeout pair below makes StrictMode's double-effect
  // safe, and remounting (new surah:ayah key) is the only signal we
  // need to fire again.)

  const buildAyahAudio = (): HTMLAudioElement => {
    const info = getReciter(reciter);
    const a = new Audio(info.audioUrl(surah, ayah));
    a.preload = "none";
    a.volume = Math.max(0, Math.min(1, volume / 100));
    a.playbackRate = Math.max(0.25, Math.min(4, playbackSpeed));
    a.loop = loop;
    if (onTimeUpdate) {
      a.addEventListener("timeupdate", () => onTimeUpdate(a.currentTime));
    }
    a.addEventListener("ended", () => {
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
    });
    a.addEventListener("pause", () => {
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
    return a;
  };

  const startAyahMode = () => {
    // Claim audio focus FIRST so the previous holder's stop() runs
    // before we create our element. This guarantees the old audio is
    // paused before the new one begins, with no race window.
    takeAudioFocus(holderRef.current);
    const a = buildAyahAudio();
    audioRef.current = a;
    setLoading(true);
    a.play().catch(() => {
      setLoading(false);
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
    });
  };

  // Important: this function is intentionally synchronous so the
  // `audio.play()` call below stays inside the user gesture. iOS
  // Safari voids the gesture after any awaited promise — even one
  // that resolves immediately — and silently rejects subsequent play
  // calls. Segment data is read from the cache synchronously (it's
  // pre-warmed in App.tsx on reciter change); only the cold-start
  // path defers seek+stop setup until the async load resolves.
  const startSurahMode = () => {
    takeAudioFocus(holderRef.current);
    setLoading(true);
    const info = getReciter(reciter);
    const a = buildAyahAudio();
    a.src = info.audioUrl(surah, ayah);
    audioRef.current = a;

    const applySegments = (segs: Record<string, AyahSegment>) => {
      const seg = segs[`${surah}:${ayah}`];
      if (!seg) return;
      const [fromMs, toMs] = seg;
      fromSecRef.current = fromMs / 1000;
      stopAtRef.current = toMs / 1000;
      // Seek to the ayah's start. If metadata is already loaded we
      // can do it inline; otherwise wait for it.
      if (a.readyState >= 1) {
        a.currentTime = fromMs / 1000;
      } else {
        const onLoaded = () => {
          a.currentTime = fromMs / 1000;
          a.removeEventListener("loadedmetadata", onLoaded);
        };
        a.addEventListener("loadedmetadata", onLoaded);
      }
      a.addEventListener("timeupdate", () => {
        const stopAt = stopAtRef.current;
        if (stopAt != null && a.currentTime >= stopAt) {
          a.pause();
          // Keep stopAtRef set so the next play() still halts at the
          // ayah boundary; the replay path will seek back to fromSec.
          setPlaying(false);
          releaseAudioFocus(holderRef.current);
        }
      });
    };

    const cached = getCachedReciterSegments(reciter);
    if (cached) {
      applySegments(cached);
    } else {
      // Cold start — fetch lazily and apply when ready. The audio will
      // start from t=0 (i.e. the surah's first ayah) for a brief
      // moment until segments arrive; pre-warming in App.tsx makes
      // this practically never happen.
      void loadReciterSegments(reciter).then(applySegments);
    }

    a.play().catch(() => {
      setLoading(false);
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
    });
  };

  // Auto-play when the setting is on. Schedules one micro-tick so any
  // reciter-change teardown effect can run first, and so React's
  // StrictMode double-invoke is safely cancelled by the cleanup before
  // the timer fires.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!autoPlay) return;
    const id = window.setTimeout(() => {
      // Don't override an audio element already created by a manual
      // click — let the user keep control if they started playback
      // themselves.
      if (audioRef.current) return;
      const info = getReciter(reciter);
      if (info.mode === "ayah") startAyahMode();
      else startSurahMode();
    }, 0);
    return () => window.clearTimeout(id);
  }, [autoPlay, reciter]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const toggle = () => {
    // Already have an element — toggle pause/resume.
    if (audioRef.current && playing) {
      audioRef.current.pause();
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
      return;
    }
    if (audioRef.current && !playing) {
      const a = audioRef.current;
      // Claim audio focus FIRST so any other audio playing right now
      // is paused before we resume — latest play call wins.
      takeAudioFocus(holderRef.current);
      // Replay-from-end handling:
      //   Ayah-mode: if the file has hit its natural end, rewind to 0.
      //   Surah-mode: if currentTime is at or past the ayah's stop
      //     boundary, seek back to the ayah's fromMs so the click
      //     actually replays THIS ayah rather than playing the next
      //     ayah from the same surah-wide MP3.
      if (a.ended) {
        a.currentTime = 0;
      } else if (
        stopAtRef.current !== null &&
        fromSecRef.current !== null &&
        a.currentTime >= stopAtRef.current
      ) {
        a.currentTime = fromSecRef.current;
      }
      a.play().catch(() => {
        setPlaying(false);
        releaseAudioFocus(holderRef.current);
      });
      setPlaying(true);
      return;
    }
    // First click: kick off the appropriate flow. Both functions are
    // synchronous so audio.play() stays inside the user gesture —
    // critical for mobile Safari.
    const info = getReciter(reciter);
    if (info.mode === "ayah") startAyahMode();
    else startSurahMode();
  };

  const isLg = size === "lg";
  const btnClass = isLg
    ? "inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 transition-all duration-150 shadow-lg shadow-neutral-900/10"
    : "inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors";
  const iconClass = isLg ? "w-8 h-8" : "w-3.5 h-3.5";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel ?? "Play ayah"}
      aria-pressed={playing}
      className={btnClass}
    >
      {loading ? (
        <svg
          className={`${iconClass} animate-spin`}
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
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
