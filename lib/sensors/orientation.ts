import { normalizeHeading } from "@/lib/aircraft/geometry";

interface IOSDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

type PermissionCapableOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export interface OrientationReading {
  heading: number;
  pitch: number;
  roll: number;
  absolute: boolean;
  accuracy?: number;
}

export function needsOrientationPermission(): boolean {
  if (typeof window === "undefined") return false;
  const constructor = window.DeviceOrientationEvent as PermissionCapableOrientationEvent;
  return typeof constructor?.requestPermission === "function";
}

export async function requestOrientationPermission(): Promise<boolean> {
  const constructor = window.DeviceOrientationEvent as PermissionCapableOrientationEvent;
  if (typeof constructor?.requestPermission !== "function") return true;
  return (await constructor.requestPermission()) === "granted";
}

export function listenToOrientation(
  onReading: (reading: OrientationReading) => void,
): () => void {
  let animationFrame = 0;

  const handleOrientation = (event: DeviceOrientationEvent) => {
    const iosEvent = event as IOSDeviceOrientationEvent;
    if (iosEvent.webkitCompassHeading === undefined && event.alpha === null) return;

    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      const screenAngle = window.screen.orientation?.angle ?? 0;
      const rawHeading =
        iosEvent.webkitCompassHeading ?? 360 - (event.alpha ?? 0) + screenAngle;
      const beta = event.beta ?? 90;

      onReading({
        heading: normalizeHeading(rawHeading),
        pitch: Math.max(-90, Math.min(90, 90 - beta)),
        roll: event.gamma ?? 0,
        absolute: Boolean(event.absolute || iosEvent.webkitCompassHeading !== undefined),
        accuracy: iosEvent.webkitCompassAccuracy,
      });
    });
  };

  window.addEventListener("deviceorientation", handleOrientation, true);
  return () => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("deviceorientation", handleOrientation, true);
  };
}
