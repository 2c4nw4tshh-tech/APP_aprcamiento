export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

export function openInMaps(lat: number, lng: number, label = "Parking") {
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
  if (isIOS) {
    window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(label)}`);
  } else {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  }
}
