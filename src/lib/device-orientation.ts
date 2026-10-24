export async function requestDeviceOrientationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return false;

  const orientationEvent = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  if (typeof orientationEvent.requestPermission !== "function") return true;

  try {
    return (await orientationEvent.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

export function getDeviceHeading(event: DeviceOrientationEvent): number | null {
  const compassHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
  if (typeof compassHeading === "number" && Number.isFinite(compassHeading)) {
    return (compassHeading + 360) % 360;
  }

  if (typeof event.alpha !== "number" || !Number.isFinite(event.alpha)) return null;
  const screenAngle = typeof window !== "undefined" ? window.screen.orientation?.angle ?? 0 : 0;
  return (360 - event.alpha + screenAngle + 360) % 360;
}
