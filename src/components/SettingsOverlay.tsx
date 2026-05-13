import type { Settings, SettingsActions } from "../App";
import SettingsPanel from "./SettingsPanel";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  actions: SettingsActions;
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
}: Props) {
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
        className="absolute z-50 animate-fade-in start-4 end-4 sm:start-auto sm:w-96"
        style={{ top: "max(4.5rem, calc(env(safe-area-inset-top) + 4rem))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <SettingsPanel settings={settings} actions={actions} />
      </div>
    </>
  );
}
