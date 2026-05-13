import { useEffect, useState } from "react";
import type { Settings, SettingsActions } from "../App";
import type { Language } from "../i18n/translations";
import { useT } from "../i18n/useT";
import { useKeyboard } from "../hooks/useKeyboard";
import { reciters, getReciter, type ReciterId } from "../data/reciters";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  actions: SettingsActions;
  language: Language;
  /** Tailwind max-width that matches the underlying screen's content
   *  column — the popover anchors to the trigger via that column. */
  containerWidth?: string;
}

const EXIT_MS = 180;
const SPEED_STOPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/**
 * Compact "audio" popover triggered by the speaker icon. Houses every
 * playback-related setting (reciter, audio-only, autoplay, volume,
 * playback speed, loop) so they live close to where they're used. The
 * settings panel's own Audio sub-page was retired in favor of this.
 */
export default function AudioOverlay({
  open,
  onClose,
  settings,
  actions,
  language,
  containerWidth = "max-w-2xl",
}: Props) {
  const t = useT(language);
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      return;
    }
    if (!visible) return;
    setClosing(true);
    const id = window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, EXIT_MS);
    return () => window.clearTimeout(id);
  }, [open, visible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useKeyboard({ Escape: () => onClose() }, open);

  if (!visible) return null;
  const panelAnim = closing ? "animate-fade-out" : "animate-fade-in";
  const backdropAnim = closing ? "animate-fade-out" : "animate-fade-in-soft";
  const currentReciter = getReciter(settings.reciter);

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("cancel")}
        className={`fixed inset-0 z-40 bg-black/0 ${backdropAnim}`}
      />
      <div
        className={`absolute z-50 inset-x-0 px-4 ${panelAnim} pointer-events-none`}
        style={{ top: "max(4.5rem, calc(env(safe-area-inset-top) + 4rem))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mx-auto w-full ${containerWidth}`}>
          <div className="ms-auto w-full sm:w-96 max-w-full pointer-events-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xl shadow-neutral-900/5 dark:shadow-neutral-950/40 space-y-4">
              {/* Reciter */}
              <div>
                <label
                  htmlFor="audio-reciter"
                  className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2"
                >
                  {t("reciter")}
                </label>
                <select
                  id="audio-reciter"
                  value={settings.reciter}
                  onChange={(e) =>
                    actions.setReciter(e.target.value as ReciterId)
                  }
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                >
                  {reciters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name[language]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                  {currentReciter.name[language]}
                </p>
              </div>

              {/* Volume */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {t("volume")}
                  </div>
                  <div className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
                    {settings.volume}%
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={settings.volume}
                  onChange={(e) => actions.setVolume(Number(e.target.value))}
                  aria-label={t("volume")}
                  className="w-full accent-neutral-900 dark:accent-neutral-100"
                />
              </div>

              {/* Playback speed */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {t("playbackSpeed")}
                  </div>
                  <div className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
                    {settings.playbackSpeed.toFixed(2).replace(/\.?0+$/, "")}×
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {SPEED_STOPS.map((s) => {
                    const selected =
                      Math.abs(settings.playbackSpeed - s) < 0.01;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => actions.setPlaybackSpeed(s)}
                        className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          selected
                            ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                            : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        }`}
                      >
                        {s === 1 ? "1×" : `${s}×`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loop + Autoplay + Audio-only toggles */}
              <ToggleRow
                title={t("loop")}
                checked={settings.loop}
                onChange={actions.setLoop}
              />
              <ToggleRow
                title={t("autoPlay")}
                checked={settings.autoPlay}
                onChange={actions.setAutoPlay}
              />
              <ToggleRow
                title={t("audioOnly")}
                checked={settings.audioOnly}
                onChange={actions.setAudioOnly}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ToggleRow({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-neutral-800 dark:text-neutral-200">
        {title}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-neutral-900 dark:accent-neutral-100 shrink-0"
      />
    </label>
  );
}
