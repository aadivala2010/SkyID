import type { ObserverPosition } from "@/types/aircraft";

interface DesktopSimulatorProps {
  heading: number;
  pitch: number;
  location: ObserverPosition;
  trafficOffset: number;
  onHeadingChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  onLocationChange: (value: ObserverPosition) => void;
  onTrafficOffsetChange: (value: number) => void;
}

export function DesktopSimulator({
  heading,
  pitch,
  location,
  trafficOffset,
  onHeadingChange,
  onPitchChange,
  onLocationChange,
  onTrafficOffsetChange,
}: DesktopSimulatorProps) {
  return (
    <aside className="desktop-simulator glass-strong" aria-label="Desktop sensor simulator">
      <div className="simulator-header">
        <div>
          <p className="eyebrow">DESKTOP LAB</p>
          <h2>Sensor simulator</h2>
        </div>
        <span>Demo only</span>
      </div>
      <label>
        <span>Heading <strong>{Math.round(heading)}°</strong></span>
        <input type="range" min="0" max="359" value={heading} onChange={(event) => onHeadingChange(Number(event.target.value))} />
      </label>
      <label>
        <span>Pitch <strong>{Math.round(pitch)}°</strong></span>
        <input type="range" min="-30" max="50" value={pitch} onChange={(event) => onPitchChange(Number(event.target.value))} />
      </label>
      <label>
        <span>Traffic position <strong>{trafficOffset > 0 ? "+" : ""}{trafficOffset}°</strong></span>
        <input type="range" min="-90" max="90" value={trafficOffset} onChange={(event) => onTrafficOffsetChange(Number(event.target.value))} />
      </label>
      <div className="coordinate-grid">
        <label>
          <span>Latitude</span>
          <input type="number" step="0.001" value={location.latitude} onChange={(event) => onLocationChange({ ...location, latitude: Number(event.target.value) })} />
        </label>
        <label>
          <span>Longitude</span>
          <input type="number" step="0.001" value={location.longitude} onChange={(event) => onLocationChange({ ...location, longitude: Number(event.target.value) })} />
        </label>
      </div>
    </aside>
  );
}
