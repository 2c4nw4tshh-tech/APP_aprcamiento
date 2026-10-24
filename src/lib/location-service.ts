import type { LatLng, UserLocation } from "@/types/navigation";
import { haversineMeters } from "@/lib/gis";

export type LocationPermission = "granted" | "denied" | "prompt" | "unsupported";

export interface LocationServiceCallbacks {
  onLocation: (location: UserLocation) => void;
  onError: (error: GeolocationPositionError) => void;
}

export class BrowserLocationService {
  private watchId: number | null = null;
  private previous: GeolocationPosition | null = null;
  private lastKnown: UserLocation | null = null;
  private callbacks: LocationServiceCallbacks | null = null;
  private active = false;

  async requestPermission(): Promise<LocationPermission> {
    if (typeof navigator === "undefined" || !navigator.geolocation) return "unsupported";
    return new Promise((resolve) => {
      // Call directly in the initiating click handler so browsers can display their permission prompt.
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handlePosition(position);
          resolve("granted");
        },
        (error) => resolve(error.code === error.PERMISSION_DENIED ? "denied" : "prompt"),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      );
    });
  }

  getLastKnownLocation(): UserLocation | null {
    return this.lastKnown;
  }

  start(callbacks: LocationServiceCallbacks): boolean {
    if (typeof navigator === "undefined" || !navigator.geolocation) return false;
    this.callbacks = callbacks;
    this.active = true;
    this.resume();
    return true;
  }

  pause() {
    this.stopWatch();
  }

  resume() {
    this.active = true;
    if (!this.active || this.watchId !== null || typeof navigator === "undefined" || !navigator.geolocation) return;
    this.watchId = navigator.geolocation.watchPosition(
      this.handlePosition,
      (error) => this.callbacks?.onError(error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  }

  stop() {
    this.active = false;
    this.pause();
    this.callbacks = null;
    this.previous = null;
  }

  private stopWatch() {
    if (this.watchId !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.watchId = null;
  }

  private handlePosition = (position: GeolocationPosition) => {
    const previous = this.previous;
    const previousCoordinate = previous && {
      lat: previous.coords.latitude,
      lng: previous.coords.longitude,
    };
    const coordinate: LatLng = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    const elapsedSeconds = previous ? (position.timestamp - previous.timestamp) / 1000 : 0;
    const measuredSpeed = previousCoordinate && elapsedSeconds > 0
      ? haversineMeters(previousCoordinate, coordinate) / elapsedSeconds
      : 0;
    const reportedSpeed = position.coords.speed;
    const speed = reportedSpeed != null && reportedSpeed >= 0 ? reportedSpeed : measuredSpeed;

    if (speed > 60 || measuredSpeed > 60) return;

    const bearing = position.coords.heading != null && Number.isFinite(position.coords.heading)
      ? position.coords.heading
      : previousCoordinate && measuredSpeed > 0.8
        ? this.calculateBearing(previousCoordinate, coordinate)
        : this.lastKnown?.bearing ?? 0;
    const location: UserLocation = {
      ...coordinate,
      bearing,
      speed,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    this.previous = position;
    this.lastKnown = location;
    this.callbacks?.onLocation(location);
  };

  private calculateBearing(from: LatLng, to: LatLng) {
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const longitudeDelta = (to.lng - from.lng) * Math.PI / 180;
    const y = Math.sin(longitudeDelta) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(longitudeDelta);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
}
