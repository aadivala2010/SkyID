import { calculateSignedAngularDifference } from "@/lib/aircraft/geometry";

export interface ScreenPosition {
  x: number;
  y: number;
  insideView: boolean;
  relativeBearing: number;
  relativeElevation: number;
}

export function calculateRelativeBearing(
  aircraftBearing: number,
  phoneHeading: number,
): number {
  return calculateSignedAngularDifference(aircraftBearing, phoneHeading);
}

export function calculateRelativeElevation(
  aircraftElevation: number,
  phonePitch: number,
): number {
  return aircraftElevation - phonePitch;
}

export function calculateAircraftScreenPosition(
  aircraftBearing: number,
  aircraftElevation: number,
  phoneHeading: number,
  phonePitch: number,
  viewportWidth: number,
  viewportHeight: number,
  horizontalFieldOfView = 58,
  verticalFieldOfView = 48,
): ScreenPosition {
  const relativeBearing = calculateRelativeBearing(aircraftBearing, phoneHeading);
  const relativeElevation = calculateRelativeElevation(aircraftElevation, phonePitch);
  const x = viewportWidth * (0.5 + relativeBearing / horizontalFieldOfView);
  const y = viewportHeight * (0.5 - relativeElevation / verticalFieldOfView);
  const edge = 34;

  return {
    x: Math.min(Math.max(x, edge), viewportWidth - edge),
    y: Math.min(Math.max(y, 104), viewportHeight - 236),
    insideView:
      Math.abs(relativeBearing) <= horizontalFieldOfView / 2 &&
      Math.abs(relativeElevation) <= verticalFieldOfView / 2,
    relativeBearing,
    relativeElevation,
  };
}
