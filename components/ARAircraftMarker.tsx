import type { ScreenPosition } from "@/lib/ar/projection";
import type { RankedAircraft } from "@/lib/aircraft/matching";
import { AircraftIcon, ChevronIcon } from "./Icons";

interface ARAircraftMarkerProps {
  aircraft: RankedAircraft;
  position: ScreenPosition;
  selected: boolean;
  showFlightPath: boolean;
  onSelect: () => void;
}

export function ARAircraftMarker({
  aircraft,
  position,
  selected,
  showFlightPath,
  onSelect,
}: ARAircraftMarkerProps) {
  if (!position.insideView) {
    if (!selected) return null;
    const pointsRight = position.relativeBearing > 0;
    return (
      <button
        className={`out-of-view glass ${pointsRight ? "edge-right" : "edge-left"}`}
        type="button"
        onClick={onSelect}
        aria-label={`${aircraft.callsign ?? aircraft.icao24} is out of view`}
      >
        {!pointsRight ? <ChevronIcon className="arrow-left" width={16} height={16} /> : null}
        <span>AIRCRAFT OUT OF VIEW</span>
        {pointsRight ? <ChevronIcon width={16} height={16} /> : null}
      </button>
    );
  }

  return (
    <button
      className={`aircraft-marker ${selected ? "marker-selected" : "marker-secondary"}`}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      type="button"
      onClick={onSelect}
      aria-label={`Select ${aircraft.callsign ?? aircraft.icao24}`}
    >
      {showFlightPath && selected ? (
        <span
          className="flight-path"
          style={{ rotate: `${(aircraft.heading ?? aircraft.bearing) - aircraft.bearing}deg` }}
        />
      ) : null}
      <span className="marker-icon">
        <AircraftIcon width={selected ? 23 : 17} height={selected ? 23 : 17} />
      </span>
      <span className="marker-label">{aircraft.callsign ?? aircraft.icao24.toUpperCase()}</span>
    </button>
  );
}
