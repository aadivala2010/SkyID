export interface Aircraft {
  icao24: string;
  callsign?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  heading?: number;
  velocity?: number;
  onGround?: boolean;
  origin?: string;
  destination?: string;
  registration?: string;
  aircraftType?: string;
  updatedAt?: number;
}

export interface ObserverPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export type DataMode = "demo" | "live";
export type DistanceUnit = "mi" | "km";
export type AltitudeUnit = "ft" | "m";
