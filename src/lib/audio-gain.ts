/**
 * iOS-only audio gain routing. On iOS Safari, HTMLAudioElement.volume
 * is read-only — the OS forces volume to follow the hardware buttons.
 * Web Audio's GainNode, however, *is* JavaScript-controllable on iOS.
 *
 * Strategy: maintain one shared AudioContext + GainNode for the
 * session. Each HTMLAudioElement gets routed through a
 * MediaElementAudioSourceNode → GainNode → destination chain.
 * setGain(0..100) controls the gain on the shared node.
 *
 * Only enabled on iOS — on every other platform `audio.volume` works
 * directly and we don't bother with the Web Audio plumbing.
 *
 * Gotchas:
 *  - AudioContext must be *resumed* inside a user gesture. The first
 *    routeThroughGain call (which happens on the user's play tap)
 *    handles that.
 *  - createMediaElementSource requires CORS. Audio elements must have
 *    crossOrigin="anonymous" before .src is assigned. Tarteel's CDN
 *    sends the necessary headers; if it ever stops, routing fails
 *    silently and the caller falls back to element-level volume
 *    (which is a no-op on iOS but at least doesn't break audio).
 */

export const isIOS: boolean = (() => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPad on iOS 13+ identifies as macOS; distinguish via touch support.
  if (/Mac/.test(ua) && typeof document !== "undefined" && "ontouchend" in document)
    return true;
  return false;
})();

let ctx: AudioContext | null = null;
let gainNode: GainNode | null = null;
const connectedSources = new WeakSet<HTMLMediaElement>();
let currentGain = 1;

function ensureContext(): boolean {
  if (ctx && gainNode) return true;
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    gainNode = ctx.createGain();
    gainNode.gain.value = currentGain;
    gainNode.connect(ctx.destination);
    return true;
  } catch {
    return false;
  }
}

/**
 * Route an audio element's output through the shared GainNode.
 * Returns true on success — caller should rely on setGain() to
 * control volume from then on. Returns false on iOS-not-iOS, no
 * Web Audio support, CORS failure, or any other error.
 */
export function routeThroughGain(audio: HTMLMediaElement): boolean {
  if (!isIOS) return false;
  if (!ensureContext()) return false;
  if (connectedSources.has(audio)) return true;
  try {
    const source = ctx!.createMediaElementSource(audio);
    source.connect(gainNode!);
    connectedSources.add(audio);
    // Resume from suspended if needed (e.g. first call after page
    // load — autoplay policy keeps the context suspended until a
    // user gesture).
    if (ctx!.state === "suspended") {
      void ctx!.resume();
    }
    return true;
  } catch (err) {
    console.warn("Web Audio routing failed", err);
    return false;
  }
}

/** Set the shared gain to a 0–100 volume value. */
export function setGain(volume0to100: number): void {
  currentGain = Math.max(0, Math.min(1, volume0to100 / 100));
  if (gainNode) gainNode.gain.value = currentGain;
}

/** Whether to *use* the gain path (true on iOS regardless of whether
 *  routing has succeeded yet — callers branch on this). */
export const useGainForVolume = isIOS;
