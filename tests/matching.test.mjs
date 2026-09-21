import test from "node:test";
import assert from "node:assert/strict";
import { isWithinAimingCone } from "../lib/aircraft/geometry.ts";
import { calculateRearCameraPitch } from "../lib/sensors/orientationMath.ts";

test("rear camera pitch distinguishes the ground from the sky", () => {
  assert.equal(calculateRearCameraPitch(0), -90);
  assert.ok(Math.abs(calculateRearCameraPitch(90)) < 0.001);
  assert.equal(calculateRearCameraPitch(180), 90);
  assert.ok(Math.abs(calculateRearCameraPitch(0, 90)) < 0.001);
  assert.ok(calculateRearCameraPitch(0, 135) > 44.9);
});

test("aircraft only matches inside the aiming cone", () => {
  assert.equal(isWithinAimingCone(3, 4, true, false), true);
  assert.equal(isWithinAimingCone(20, 4, true, false), false);
  assert.equal(isWithinAimingCone(3, 20, true, false), false);
  assert.equal(isWithinAimingCone(3, 4, false, false), false);
  assert.equal(isWithinAimingCone(3, 4, true, true), false);
});
