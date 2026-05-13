import { useEffect, useState } from "react";
import type { Language } from "../i18n/translations";
import { useT } from "../i18n/useT";
import { useKeyboard } from "../hooks/useKeyboard";

interface Props {
  open: boolean;
  onClose: () => void;
  value: number;
  onChange: (v: number) => void;
  language: Language;
  /** Tailwind max-width that matches the underlying screen's content
   *  column — the popover anchors to the trigger via that column. */
  containerWidth?: string;
}

const EXIT_MS = 180;

/**
 * Compact popover with a single volume slider. Mirrors SettingsOverlay's
 * mount/animation/close lifecycle so the entrance feels consistent with
 * the rest of the chrome. Mute (slider at 0) shows the muted icon; any
 * non-zero level shows a speaker.
 */
export default function VolumeOverlay({
  open,
  onClose,
  value,
  onChange,
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
          <div className="ms-auto w-full sm:w-72 max-w-full pointer-events-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-xl shadow-neutral-900/5 dark:shadow-neutral-950/40">
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {t("volume")}
                </div>
                <div className="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
                  {value}%
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                aria-label={t("volume")}
                className="w-full accent-neutral-900 dark:accent-neutral-100"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
