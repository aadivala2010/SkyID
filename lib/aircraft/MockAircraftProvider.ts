import type { Aircraft } from "@/types/aircraft";
import type { AircraftProvider } from "./AircraftProvider";
import { destinationPoint, normalizeHeading } from "./geometry";

const MOCKS = [
  {
    icao24: "a1b842",
    callsign: "UA 1842",
    bearing: 182,
    distance: 19_956,
    altitude: 10_363,
    heading: 248,
    velocity: 241,
    origin: "EWR",
    destination: "DEN",
    registration: "N37427",
    aircraftType: "Boeing 737-9",
    drift: 0.018,
  },
  {
    icao24: "a0527c",
    callsign: "AA 527",
    bearing: 158,
    distance: 29_129,
    altitude: 8_687,
    heading: 211,
    velocity: 226,
    origin: "PHL",
    destination: "ORD",
    registration: "N917AN",
    aircraftType: "Airbus A321neo",
    drift: -0.014,
  },
  {
    icao24: "a0d903",
    callsign: "DL 903",
    bearing: 218,
    distance: 34_923,
    altitude: 11_887,
    heading: 72,
    velocity: 252,
    origin: "JFK",
    destination: "SEA",
    registration: "N503DN",
    aircraftType: "Airbus A350-900",
    drift: 0.011,
  },
  {
    icao24: "a6b214",
    callsign: "B6 214",
    bearing: 114,
    distance: 44_000,
    altitude: 9_450,
    heading: 330,
    velocity: 218,
    origin: "BOS",
    destination: "MCO",
    registration: "N965JT",
    aircraftType: "Airbus A321",
    drift: -0.008,
  },
] as const;

const STARTED_AT = Date.now();

export class MockAircraftProvider implements AircraftProvider {
  constructor(private readonly bearingOffset = 0) {}

  async getNearbyAircraft(latitude: number, longitude: number): Promise<Aircraft[]> {
    const elapsedSeconds = (Date.now() - STARTED_AT) / 1000;

    return MOCKS.map((mock, index) => {
      const bearing = normalizeHeading(
        mock.bearing + this.bearingOffset + elapsedSeconds * mock.drift,
      );
      const breathingDistance = mock.distance + Math.sin(elapsedSeconds / 18 + index) * 320;
      const point = destinationPoint({ latitude, longitude }, bearing, breathingDistance);

      return {
        ...point,
        icao24: mock.icao24,
        callsign: mock.callsign,
        altitude: mock.altitude,
        heading: normalizeHeading(mock.heading + elapsedSeconds * mock.drift * 0.18),
        velocity: mock.velocity,
        onGround: false,
        origin: mock.origin,
        destination: mock.destination,
        registration: mock.registration,
        aircraftType: mock.aircraftType,
        updatedAt: Date.now(),
      };
    });
  }
}
