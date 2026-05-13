/**
 * iOS Safari "unlock" for HTMLAudioElement playback.
 *
 * iOS requires the very first audio.play() call in a session to come
 * from a user gesture against an audio element that already exists in
 * the DOM. Once one element has been "unlocked" this way, subsequent
 * play() calls (including on freshly-created elements) work normally
 * for the rest of the session.
 *
 * Strategy: install a one-shot pointerdown listener on the document.
 * On first interaction, append a tiny silent <audio> element to the
 * body and call .play() on it inside the gesture window. After it
 * resolves we remove the listener so it never fires again.
 *
 * The data URI is a 0.1s silent WAV. Cheap, instant, no network.
 */

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=";

let unlocked = false;

export function installAudioUnlock(): void {
  if (typeof document === "undefined") return;
  if (unlocked) return;

  const handler = () => {
    if (unlocked) {
      cleanup();
      return;
    }
    try {
      const a = document.createElement("audio");
      a.src = SILENT_WAV;
      a.preload = "auto";
      a.muted = false;
      // iOS sometimes needs the element in the DOM tree.
      a.style.position = "absolute";
      a.style.width = "1px";
      a.style.height = "1px";
      a.style.opacity = "0";
      a.style.pointerEvents = "none";
      document.body.appendChild(a);
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          unlocked = true;
        })
          .catch(() => {
            // Even a rejected play() counts as an attempt — iOS often
            // unlocks anyway. Mark unlocked so we don't retry.
            unlocked = true;
          })
          .finally(() => {
            a.pause();
            a.remove();
            cleanup();
          });
      } else {
        unlocked = true;
        a.remove();
        cleanup();
      }
    } catch {
      unlocked = true;
      cleanup();
    }
  };

  const cleanup = () => {
    document.removeEventListener("pointerdown", handler, true);
    document.removeEventListener("touchstart", handler, true);
    document.removeEventListener("click", handler, true);
  };

  document.addEventListener("pointerdown", handler, true);
  document.addEventListener("touchstart", handler, true);
  document.addEventListener("click", handler, true);
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}
