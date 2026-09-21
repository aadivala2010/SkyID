import type { DataMode } from "@/types/aircraft";

interface StatusBarProps {
  mode: DataMode;
  gpsLabel: string;
  heading?: number;
  preciseOrientation: boolean;
  onEnableMotion: () => void;
}

export function StatusBar({
  mode,
  gpsLabel,
  heading,
  preciseOrientation,
  onEnableMotion,
}: StatusBarProps) {
  return (
    <header className="status-wrap">
      <div className="status-bar glass">
        <span className="brand-mark">
          <span className="brand-wing" />
          SkyID
        </span>
        <span className="status-divider" />
        <span className={`source-badge source-${mode}`}>
          <span className="source-dot" />
          {mode.toUpperCase()}
        </span>
        <span className="gps-label">{gpsLabel}</span>
        <span className="heading-label" title={heading === undefined ? "Heading unavailable" : `Heading ${Math.round(heading)} degrees`}>
          {heading === undefined ? "—°" : `${Math.round(heading).toString().padStart(3, "0")}°`}
        </span>
      </div>
      {!preciseOrientation ? (
        <button className="motion-prompt glass" type="button" onClick={onEnableMotion}>
          Enable precise motion tracking
        </button>
      ) : null}
    </header>
  );
}
