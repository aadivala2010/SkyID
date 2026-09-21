import type { Aircraft } from "@/types/aircraft";

export interface AircraftProvider {
  getNearbyAircraft(latitude: number, longitude: number): Promise<Aircraft[]>;
}
