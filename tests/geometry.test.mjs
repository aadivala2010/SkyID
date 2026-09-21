import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAngularDifference,
  calculateBearing,
  calculateDistance,
  calculateElevationAngle,
  normalizeHeading,
} from "../lib/aircraft/geometry.ts";

test("heading math wraps around north", () => {
  assert.equal(calculateAngularDifference(359, 1), 2);
  assert.equal(calculateAngularDifference(358, 4), 6);
  assert.equal(normalizeHeading(-1), 359);
});

test("distance, bearing, and elevation remain physically plausible", () => {
  const observer = { latitude: 40.7128, longitude: -74.006 };
  const north = { latitude: 40.8128, longitude: -74.006 };
  const distance = calculateDistance(observer, north);
  assert.ok(distance > 11_000 && distance < 11_200);
  assert.ok(calculateBearing(observer, north) < 0.1);
  assert.ok(calculateElevationAngle(10_000, 20_000) > 26);
});
