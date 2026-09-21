import type { Aircraft } from "@/types/aircraft";
import type { AircraftProvider } from "./AircraftProvider";

export class LiveAircraftProvider implements AircraftProvider {
  async getNearbyAircraft(latitude: number, longitude: number): Promise<Aircraft[]> {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
    });
    const response = await fetch(`/api/aircraft?${params}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Live aircraft data is unavailable.");
    }

    const data = (await response.json()) as { aircraft?: Aircraft[] };
    return data.aircraft ?? [];
  }
}
