import type { ObserverPosition } from "@/types/aircraft";

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function calculateBearing(
  from: Pick<ObserverPosition, "latitude" | "longitude">,
  to: Pick<ObserverPosition, "latitude" | "longitude">,
): number {
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const y = Math.sin(deltaLongitude) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLongitude);

  return normalizeHeading(toDegrees(Math.atan2(y, x)));
}

export function calculateDistance(
  from: Pick<ObserverPosition, "latitude" | "longitude">,
  to: Pick<ObserverPosition, "latitude" | "longitude">,
): number {
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function calculateAngularDifference(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

export function calculateSignedAngularDifference(
  target: number,
  reference: number,
): number {
  return ((target - reference + 540) % 360) - 180;
}

export function calculateElevationAngle(
  aircraftAltitudeMeters: number,
  horizontalDistanceMeters: number,
  observerAltitudeMeters = 0,
): number {
  return toDegrees(
    Math.atan2(
      aircraftAltitudeMeters - observerAltitudeMeters,
      Math.max(horizontalDistanceMeters, 1),
    ),
  );
}

export function destinationPoint(
  origin: Pick<ObserverPosition, "latitude" | "longitude">,
  bearingDegrees: number,
  distanceMeters: number,
): Pick<ObserverPosition, "latitude" | "longitude"> {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearing = toRadians(bearingDegrees);
  const latitude = toRadians(origin.latitude);
  const longitude = toRadians(origin.longitude);
  const destinationLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance) +
      Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const destinationLongitude =
    longitude +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
      Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(destinationLatitude),
    );

  return {
    latitude: toDegrees(destinationLatitude),
    longitude: toDegrees(destinationLongitude),
  };
}
