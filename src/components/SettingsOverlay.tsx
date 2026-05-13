import { useEffect, useState } from "react";
import type { Settings, SettingsActions } from "../App";
import SettingsPanel from "./SettingsPanel";
import { useKeyboard } from "../hooks/useKeyboard";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  actions: SettingsActions;
  /**
   * Tailwind max-width class for the centered content container of the
   * underlying screen. The overlay mirrors this so the panel hangs from
   * the same column the cog button is in — without it, the panel would
   * fly to the viewport edge on wide screens while the cog stays
   * centered with the card.
   */
  containerWidth?: string;
}

/**
 * Overlays SettingsPanel above whatever screen is mounted. The panel
 * resets to its main view every time it opens (via the `mountKey` —
 * SettingsPanel's internal `view` state is keyed off it), and exits
 * with a brief fade-out before unmounting so the close feels
 * intentional instead of cut. A tap on the transparent backdrop
 * dismisses; Esc does too.
 *
 * State machine:
 *   closed  ── open=true ──►  opening (mount, run fade-in)
 *   opening ── animation end ►  open
 *   open    ── open=false ──►  closing (run fade-out)
 *   closing ── timeout ──►  closed (unmount)
 */
const EXIT_MS = 180;

export default function SettingsOverlay({
  open,
  onClose,
  settings,
  actions,
  containerWidth = "max-w-2xl",
}: Props) {
  // `visible` keeps the overlay mounted across the close animation;
  // `closing` flips the entry animation to its exit counterpart.
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  // Animation lifecycle: this effect *intentionally* sets state in
  // response to a prop change so the panel stays mounted for ~EXIT_MS
  // while the fade-out plays before unmounting. The React 19 lint rule
  // can't tell the difference from incidental prop-derived state.
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

  // Esc closes the overlay while it's mounted. Listener is auto-removed
  // when the component unmounts (open flips to false).
  useKeyboard({ Escape: () => onClose() }, open);

  if (!visible) return null;
  const panelAnim = closing ? "animate-fade-out" : "animate-fade-in";
  const backdropAnim = closing ? "animate-fade-out" : "animate-fade-in-soft";

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close settings"
        className={`fixed inset-0 z-40 bg-black/0 ${backdropAnim}`}
      />
      <div
        className={`absolute z-50 inset-x-0 px-4 ${panelAnim} pointer-events-none`}
        style={{ top: "max(4.5rem, calc(env(safe-area-inset-top) + 4rem))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mx-auto w-full ${containerWidth}`}>
          <div className="ms-auto w-full sm:w-96 max-w-full pointer-events-auto">
            <SettingsPanel settings={settings} actions={actions} />
          </div>
        </div>
      </div>
    </>
  );
}
