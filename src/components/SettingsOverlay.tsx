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
 * Overlays SettingsPanel above whatever screen is mounted. The panel is
 * mounted only while `open` is true so it always starts on the main
 * view; entrance is the panel's own CSS animation. A tap on the
 * transparent backdrop dismisses.
 */
export default function SettingsOverlay({
  open,
  onClose,
  settings,
  actions,
  containerWidth = "max-w-2xl",
}: Props) {
  // Esc closes the overlay while it's mounted. Listener is auto-removed
  // when the component unmounts (open flips to false).
  useKeyboard({ Escape: () => onClose() }, open);
  if (!open) return null;
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close settings"
        className="fixed inset-0 z-40 bg-black/0 animate-fade-in-soft"
      />
      <div
        className="absolute z-50 inset-x-0 px-4 animate-fade-in pointer-events-none"
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
