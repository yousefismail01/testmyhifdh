/**
 * Single-track audio focus. Whoever last started playback registers a
 * `stop()` closure here; the next thing that wants to play calls
 * `takeAudioFocus`, which silences the previous holder first.
 *
 * Currently used by AyahAudioButton and the QuizScreen hint snippet
 * to make sure only one ayah recitation is audible at a time.
 */
type Holder = { stop: () => void };

let currentHolder: Holder | null = null;

export function takeAudioFocus(holder: Holder) {
  if (currentHolder && currentHolder !== holder) currentHolder.stop();
  currentHolder = holder;
}

export function releaseAudioFocus(holder: Holder) {
  if (currentHolder === holder) currentHolder = null;
}
