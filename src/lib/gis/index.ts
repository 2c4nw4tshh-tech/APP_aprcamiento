export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function haversineMeters(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): number {
  return haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function minutesAgo(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

export function spotExpiresAt(hours = 2): Date {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

export type NavigationProvider = "google" | "waze" | "apple";

export function getNavigationUrl(
  provider: NavigationProvider,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  label = "Parking",
): string {
  const originCoords = `${origin.lat},${origin.lng}`;
  const destinationCoords = `${destination.lat},${destination.lng}`;
  if (provider === "waze") {
    return `https://waze.com/ul?ll=${encodeURIComponent(destinationCoords)}&from=${encodeURIComponent(originCoords)}&navigate=yes`;
  }
  if (provider === "apple") {
    return `https://maps.apple.com/?saddr=${encodeURIComponent(originCoords)}&daddr=${encodeURIComponent(destinationCoords)}&q=${encodeURIComponent(label)}&dirflg=d`;
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originCoords)}&destination=${encodeURIComponent(destinationCoords)}`;
}

export function getCountdownMinutes(dateValue?: string | Date | null): number {
  if (!dateValue) return 0;
  const target = new Date(dateValue).getTime();
  const now = Date.now();
  if (Number.isNaN(target) || target <= now) return 0;
  return Math.max(0, Math.ceil((target - now) / 60000));
}

export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "Ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

