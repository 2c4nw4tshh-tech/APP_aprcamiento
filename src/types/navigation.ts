export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteResult {
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  etaMinutes: number;
  distanceKm: number;
  steps: RouteStep[];
}