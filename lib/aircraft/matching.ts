import type { Aircraft, ObserverPosition } from "@/types/aircraft";
import {
  calculateAngularDifference,
  calculateBearing,
  calculateDistance,
  calculateElevationAngle,
  isWithinAimingCone,
} from "./geometry";

export interface RankedAircraft extends Aircraft {
  bearing: number;
  distance: number;
  elevation: number;
  horizontalDifference: number;
  verticalDifference: number;
  score: number;
}

export function isPointingAtAircraft(candidate: RankedAircraft | undefined): boolean {
  return Boolean(candidate && isWithinAimingCone(
    candidate.horizontalDifference,
    candidate.verticalDifference,
    candidate.altitude !== undefined,
    Boolean(candidate.onGround),
  ));
}

export function rankAircraftCandidates(
  aircraft: Aircraft[],
  observer: ObserverPosition,
  phoneHeading?: number,
  phonePitch = 0,
): RankedAircraft[] {
  return aircraft
    .filter((candidate) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude))
    .map((candidate) => {
      const bearing = calculateBearing(observer, candidate);
      const distance = calculateDistance(observer, candidate);
      const elevation = candidate.altitude
        ? calculateElevationAngle(candidate.altitude, distance, observer.altitude)
        : 0;
      const horizontalDifference =
        phoneHeading === undefined ? 180 : calculateAngularDifference(phoneHeading, bearing);
      const verticalDifference = Math.abs(phonePitch - elevation);
      const headingConsistency =
        candidate.heading === undefined
          ? 0.5
          : 1 - calculateAngularDifference(candidate.heading, bearing) / 180;

      const horizontalFit = Math.max(0, 1 - horizontalDifference / 55);
      const verticalFit = Math.max(0, 1 - verticalDifference / 38);
      const distanceFit = Math.max(0, 1 - distance / 90_000);
      const score =
        (phoneHeading === undefined ? 0 : horizontalFit * 0.48) +
        verticalFit * 0.24 +
        distanceFit * 0.17 +
        (candidate.onGround ? 0 : 0.07) +
        headingConsistency * 0.04;

      return {
        ...candidate,
        bearing,
        distance,
        elevation,
        horizontalDifference,
        verticalDifference,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function getMatchLabel(
  candidate: RankedAircraft | undefined,
  runnerUp: RankedAircraft | undefined,
): "BEST MATCH" | "LIKELY MATCH" | "NEARBY" {
  if (!candidate || candidate.horizontalDifference > 30 || candidate.verticalDifference > 24) {
    return "NEARBY";
  }
  if (
    candidate.horizontalDifference <= 9 &&
    candidate.verticalDifference <= 11 &&
    (!runnerUp || candidate.score - runnerUp.score >= 0.1)
  ) {
    return "BEST MATCH";
  }
  return "LIKELY MATCH";
}
