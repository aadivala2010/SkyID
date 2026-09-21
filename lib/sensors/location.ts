import type { ObserverPosition } from "@/types/aircraft";

export interface LocationReading extends ObserverPosition {
  accuracy: number;
  timestamp: number;
}

export function watchLocation(
  onReading: (reading: LocationReading) => void,
  onError: (error: GeolocationPositionError | Error) => void,
): () => void {
  if (!("geolocation" in navigator)) {
    onError(new Error("Location is not supported by this browser."));
    return () => undefined;
  }

  const watchId = navigator.geolocation.watchPosition(
    ({ coords, timestamp }) =>
      onReading({
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: coords.altitude ?? 0,
        accuracy: coords.accuracy,
        timestamp,
      }),
    onError,
    { enableHighAccuracy: true, maximumAge: 5_000, timeout: 12_000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
