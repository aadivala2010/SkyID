import type { AltitudeUnit, DistanceUnit } from "@/types/aircraft";
import { CloseIcon } from "./Icons";

interface SettingsSheetProps {
  open: boolean;
  distanceUnit: DistanceUnit;
  altitudeUnit: AltitudeUnit;
  showAircraftType: boolean;
  showFlightPath: boolean;
  onDistanceUnitChange: (unit: DistanceUnit) => void;
  onAltitudeUnitChange: (unit: AltitudeUnit) => void;
  onShowAircraftTypeChange: (show: boolean) => void;
  onShowFlightPathChange: (show: boolean) => void;
  onCalibrate: () => void;
  onClose: () => void;
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "segment-active" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button className="settings-row toggle-row" type="button" onClick={() => onChange(!checked)}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className={`switch ${checked ? "switch-on" : ""}`} role="switch" aria-checked={checked}>
        <span />
      </span>
    </button>
  );
}

export function SettingsSheet({
  open,
  distanceUnit,
  altitudeUnit,
  showAircraftType,
  showFlightPath,
  onDistanceUnitChange,
  onAltitudeUnitChange,
  onShowAircraftTypeChange,
  onShowFlightPathChange,
  onCalibrate,
  onClose,
}: SettingsSheetProps) {
  if (!open) return null;

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="bottom-sheet settings-sheet glass-strong"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">SKYID</p>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings">
            <CloseIcon width={20} height={20} />
          </button>
        </div>
        <div className="live-source-row">
          <span className="source-dot" aria-hidden="true" />
          <span><strong>Live aircraft data</strong><small>Nearby positions from adsb.fi</small></span>
        </div>
        <div className="setting-grid">
          <div className="setting-group">
            <span className="setting-label">Distance</span>
            <SegmentedControl
              value={distanceUnit}
              label="Distance units"
              options={[{ value: "mi", label: "Miles" }, { value: "km", label: "Kilometers" }]}
              onChange={onDistanceUnitChange}
            />
          </div>
          <div className="setting-group">
            <span className="setting-label">Altitude</span>
            <SegmentedControl
              value={altitudeUnit}
              label="Altitude units"
              options={[{ value: "ft", label: "Feet" }, { value: "m", label: "Meters" }]}
              onChange={onAltitudeUnitChange}
            />
          </div>
        </div>
        <div className="toggle-group">
          <Toggle
            label="Aircraft type"
            description="Show the model when data is available"
            checked={showAircraftType}
            onChange={onShowAircraftTypeChange}
          />
          <Toggle
            label="Flight path"
            description="Show a short directional guide"
            checked={showFlightPath}
            onChange={onShowFlightPathChange}
          />
        </div>
        <button className="settings-action" type="button" onClick={onCalibrate}>
          <span><strong>Sensor calibration</strong><small>Compass and motion help</small></span>
          <span aria-hidden="true">›</span>
        </button>
        <div className="about-block">
          <strong>About SkyID</strong>
          <p>SkyID compares your phone’s direction with open aircraft positions from <a href="https://adsb.fi" target="_blank" rel="noreferrer">adsb.fi</a> using geometry. It does not use image recognition and never uploads camera footage or stores precise location.</p>
        </div>
      </section>
    </div>
  );
}
