import type { Aircraft } from "@/types/aircraft";

export async function getNearbyAircraft(latitude: number, longitude: number): Promise<Aircraft[]> {
  // Precise coordinates stay in the browser for matching; the server only needs an approximate search area.
  const params = new URLSearchParams({
    lat: latitude.toFixed(2),
    lon: longitude.toFixed(2),
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
