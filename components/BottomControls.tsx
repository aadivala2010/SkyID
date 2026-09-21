import { ListIcon, RecenterIcon, SettingsIcon } from "./Icons";

interface BottomControlsProps {
  onRecenter: () => void;
  onAircraft: () => void;
  onSettings: () => void;
  aircraftCount: number;
}

export function BottomControls({
  onRecenter,
  onAircraft,
  onSettings,
  aircraftCount,
}: BottomControlsProps) {
  return (
    <nav className="bottom-controls glass" aria-label="SkyID controls">
      <button type="button" onClick={onRecenter}>
        <RecenterIcon width={22} height={22} />
        <span>Recenter</span>
      </button>
      <button type="button" onClick={onAircraft}>
        <span className="control-icon-wrap">
          <ListIcon width={22} height={22} />
          {aircraftCount > 0 ? <span className="count-dot">{aircraftCount}</span> : null}
        </span>
        <span>Aircraft</span>
      </button>
      <button type="button" onClick={onSettings}>
        <SettingsIcon width={22} height={22} />
        <span>Settings</span>
      </button>
    </nav>
  );
}
