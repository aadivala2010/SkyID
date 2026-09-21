import type { Aircraft } from "@/types/aircraft";

export async function getNearbyAircraft(latitude: number, longitude: number): Promise<Aircraft[]> {
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
