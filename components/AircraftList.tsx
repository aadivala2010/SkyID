import type { RankedAircraft } from "@/lib/aircraft/matching";
import type { DistanceUnit } from "@/types/aircraft";
import { formatDistance } from "./AircraftInfoCard";
import { AircraftIcon, CloseIcon } from "./Icons";

interface AircraftListProps {
  open: boolean;
  aircraft: RankedAircraft[];
  selectedIcao?: string;
  distanceUnit: DistanceUnit;
  onSelect: (icao24: string) => void;
  onClose: () => void;
}

export function AircraftList({
  open,
  aircraft,
  selectedIcao,
  distanceUnit,
  onSelect,
  onClose,
}: AircraftListProps) {
  if (!open) return null;

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="bottom-sheet glass-strong"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aircraft-list-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">CURRENT AIRSPACE</p>
            <h2 id="aircraft-list-title">Nearby aircraft</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close aircraft list">
            <CloseIcon width={20} height={20} />
          </button>
        </div>
        <div className="aircraft-list">
          {aircraft.length === 0 ? <p className="sheet-empty">No aircraft are currently in range.</p> : null}
          {aircraft.map((candidate, index) => (
            <button
              className={`aircraft-row ${candidate.icao24 === selectedIcao ? "row-selected" : ""}`}
              key={candidate.icao24}
              type="button"
              onClick={() => onSelect(candidate.icao24)}
            >
              <span className="row-aircraft-icon"><AircraftIcon width={19} height={19} /></span>
              <span className="row-main">
                <strong>{candidate.callsign ?? candidate.icao24.toUpperCase()}</strong>
                <small>{candidate.aircraftType ?? "Aircraft type unavailable"}</small>
              </span>
              <span className="row-distance">
                {formatDistance(candidate.distance, distanceUnit)}
                {index === 0 ? <small>best geometry</small> : null}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
