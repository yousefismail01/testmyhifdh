import { useEffect, useRef, useState } from "react";
import {
  getReciter,
  loadReciterSegments,
  getCachedReciterSegments,
  type ReciterId,
  type AyahSegment,
} from "../data/reciters";
import { takeAudioFocus, releaseAudioFocus } from "../lib/audio-focus";
import {
  routeThroughGain,
  setGain,
  useGainForVolume,
} from "../lib/audio-gain";

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
  // True only during the brief seek+play of a surah-mode loop-back.
  // The default pause-event cleanup checks this and skips
  // releaseAudioFocus so the looping audio retains focus.
  const loopingRef = useRef(false);
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
        a.remove();
      }
      releaseAudioFocus(holder);
    };
  }, []);

  // Live-apply volume changes. On iOS the audio.volume attribute is
  // read-only — we control loudness via the shared Web Audio gain
  // node instead. On other platforms element.volume works fine.
  useEffect(() => {
    if (useGainForVolume) {
      setGain(volume);
      return;
    }
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
    if (!a) return;
    // Same rationale as buildAyahAudio: surah-mode handles looping
    // manually so we don't let the native attribute replay the
    // whole surah file.
    const info = getReciter(reciter);
    a.loop = info.mode === "ayah" ? loop : false;
  }, [loop, reciter]);

  // Reciter changed mid-flight: tear down so the next click builds a
  // fresh element with the new URL / segment data.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.src = "";
    a.remove();
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
    // Create the element via document.createElement and append to body.
    // iOS Safari is more reliable about playing audio elements that
    // are attached to the DOM than detached `new Audio()` objects.
    const a = document.createElement("audio");
    a.src = info.audioUrl(surah, ayah);
    // preload="auto" lets iOS start fetching as soon as the element
    // is in the DOM and play() is called within the user gesture.
    a.preload = "auto";
    // crossOrigin must be set BEFORE assigning src for the CORS
    // headers to apply on the audio fetch. Required for
    // createMediaElementSource() routing in audio-gain.ts.
    a.crossOrigin = "anonymous";
    // Element-level volume only works on non-iOS. On iOS the slider
    // controls a shared Web Audio GainNode instead (see below).
    if (useGainForVolume) {
      a.volume = 1;
      setGain(volume);
    } else {
      a.volume = Math.max(0, Math.min(1, volume / 100));
    }
    a.playbackRate = Math.max(0.25, Math.min(4, playbackSpeed));
    // Native `loop` only for ayah-mode (one MP3 per verse). For
    // surah-mode the file contains every ayah of the surah —
    // native looping would replay the *whole surah*, not the
    // target ayah. Looping there is handled manually in the surah-
    // mode timeupdate listener by seeking back to fromSec.
    a.loop = info.mode === "ayah" ? loop : false;
    // Hide it visually but keep it in the document tree.
    a.style.position = "absolute";
    a.style.width = "1px";
    a.style.height = "1px";
    a.style.opacity = "0";
    a.style.pointerEvents = "none";
    document.body.appendChild(a);
    // Route through the shared Web Audio GainNode on iOS so the
    // volume slider actually does something. On other platforms this
    // is a no-op (useGainForVolume === false → returns false).
    routeThroughGain(a);
    if (onTimeUpdate) {
      // Throttle to ~10 Hz via rAF. The browser fires `timeupdate`
      // at a higher rate (4–60 Hz, varies); for word highlighting we
      // only need ~10 measurements/sec to look smooth — anything
      // more is wasted React renders + DOM measures.
      let scheduled = false;
      let lastDispatchMs = 0;
      const dispatch = () => {
        scheduled = false;
        const now = performance.now();
        if (now - lastDispatchMs < 90) return; // ~11 Hz cap
        lastDispatchMs = now;
        onTimeUpdate(a.currentTime);
      };
      a.addEventListener("timeupdate", () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(dispatch);
      });
    }
    a.addEventListener("ended", () => {
      // Surah-mode hands its own ended handling in applySegments
      // (loop-back vs cleanup depending on the `loop` setting). We
      // skip the default cleanup here so the loop path can take over
      // without a paused-state flicker.
      if (info.mode === "surah") return;
      setPlaying(false);
      releaseAudioFocus(holderRef.current);
    });
    a.addEventListener("pause", () => {
      // Mid-loop in surah-mode: the audio fired pause because it
      // naturally ended, but we're about to seek+play to keep the
      // ayah looping. Skip cleanup so focus and play-state stay put.
      if (loopingRef.current) return;
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
    // .load() before .play() — iOS Safari is more reliable about
    // initiating playback when load is called explicitly inside the
    // user gesture.
    a.load();
    a.play().catch((err) => {
      // Surface errors in dev tools; on iOS we sometimes see
      // NotAllowedError when the gesture has been voided.
      console.warn("audio play failed", err);
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
        const fromSec = fromSecRef.current;
        if (stopAt == null) return;
        if (a.currentTime < stopAt) return;
        if (loop && fromSec != null) {
          // Looping in surah-mode: rewind to the ayah's start so the
          // same ayah replays. Setting currentTime is enough — the
          // element is still playing.
          a.currentTime = fromSec;
          return;
        }
        a.pause();
        // Keep stopAtRef set so the next play() still halts at the
        // ayah boundary; the replay path will seek back to fromSec.
        setPlaying(false);
        releaseAudioFocus(holderRef.current);
      });
      // Surah-mode `ended` handler: if the audio file naturally ended
      // (last ayah of the surah, timeupdate didn't fire in time), do
      // the loop-back or final cleanup here. Without this, with the
      // native `loop` attribute disabled (we have to disable it so
      // the whole surah doesn't replay), the audio would just stop
      // even when the user has loop turned on.
      a.addEventListener("ended", () => {
        const fromSec = fromSecRef.current;
        if (!loop || fromSec == null) {
          setPlaying(false);
          releaseAudioFocus(holderRef.current);
          return;
        }
        loopingRef.current = true;
        takeAudioFocus(holderRef.current);
        try {
          a.currentTime = fromSec;
        } catch {
          /* setting currentTime can throw if the media is in a
             bad state — fall through to play() which will fail
             gracefully */
        }
        a.play()
          .catch((err) => {
            console.warn("surah-mode loop replay failed", err);
            setPlaying(false);
            releaseAudioFocus(holderRef.current);
          })
          .finally(() => {
            loopingRef.current = false;
          });
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

    a.load();
    a.play().catch((err) => {
      console.warn("audio play failed", err);
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
      a.play().catch((err) => {
        console.warn("audio resume failed", err);
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
