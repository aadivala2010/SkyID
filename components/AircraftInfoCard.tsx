import type { RankedAircraft } from "@/lib/aircraft/matching";
import type { AltitudeUnit, DistanceUnit } from "@/types/aircraft";
import { AircraftIcon } from "./Icons";

const AIRLINES: Record<string, string> = {
  UA: "United Airlines",
  UAL: "United Airlines",
  AA: "American Airlines",
  AAL: "American Airlines",
  DL: "Delta Air Lines",
  DAL: "Delta Air Lines",
  B6: "JetBlue",
  JBU: "JetBlue",
};

function airlineFor(callsign?: string) {
  const prefix = callsign?.replace(/\s/g, "").match(/^[A-Z]+/)?.[0];
  return prefix ? AIRLINES[prefix] ?? "Flight" : "Aircraft";
}

export function formatDistance(meters: number, unit: DistanceUnit) {
  const value = unit === "mi" ? meters / 1609.344 : meters / 1000;
  return `${value.toFixed(value < 10 ? 1 : 0)} ${unit}`;
}

export function formatAltitude(meters: number | undefined, unit: AltitudeUnit) {
  if (meters === undefined) return "Altitude unavailable";
  if (unit === "ft") return `${Math.round((meters * 3.28084) / 100) * 100} ft`;
  return `${Math.round(meters / 100) * 100} m`;
}

interface AircraftInfoCardProps {
  aircraft?: RankedAircraft;
  matchLabel: string;
  distanceUnit: DistanceUnit;
  altitudeUnit: AltitudeUnit;
  showAircraftType: boolean;
  candidateCount: number;
  onOpenList: () => void;
}

export function AircraftInfoCard({
  aircraft,
  matchLabel,
  distanceUnit,
  altitudeUnit,
  showAircraftType,
  candidateCount,
  onOpenList,
}: AircraftInfoCardProps) {
  if (!aircraft) {
    return (
      <section className="aircraft-card glass-strong empty-card" aria-live="polite">
        <span className="scan-ring" />
        <div>
          <p className="eyebrow">SCANNING SKY</p>
          <h2>No aircraft nearby</h2>
        </div>
      </section>
    );
  }

  const route = aircraft.origin || aircraft.destination
    ? `${aircraft.origin ?? "Unavailable"} → ${aircraft.destination ?? "Unavailable"}`
    : "Route unavailable";

  return (
    <section className="aircraft-card glass-strong" aria-live="polite">
      <div className="card-topline">
        <span className="match-label">{matchLabel}</span>
        <button className="candidate-count" type="button" onClick={onOpenList}>
          {candidateCount} nearby
        </button>
      </div>
      <div className="flight-identity">
        <span className="airline-icon"><AircraftIcon width={20} height={20} /></span>
        <div>
          <p className="airline-name">{airlineFor(aircraft.callsign)}</p>
          <h2>{aircraft.callsign ?? aircraft.icao24.toUpperCase()}</h2>
        </div>
        <p className="distance-readout">{formatDistance(aircraft.distance, distanceUnit)}</p>
      </div>
      <p className="route-line">{route}</p>
      <div className="flight-facts">
        {showAircraftType ? <span>{aircraft.aircraftType ?? "Type unavailable"}</span> : null}
        <span>{formatAltitude(aircraft.altitude, altitudeUnit)}</span>
        {aircraft.velocity !== undefined ? (
          <span>{Math.round(aircraft.velocity * 1.94384)} kt</span>
        ) : null}
      </div>
    </section>
  );
}
