export interface LatLng {
  lat: number;
  lng: number;
}

export type TurnType =
  | "turn-left"
  | "turn-right"
  | "straight"
  | "roundabout"
  | "arrive"
  | "depart"
  | "merge"
  | "fork-left"
  | "fork-right"
  | "u-turn";

export type TravelMode = "driving" | "walking" | "cycling";

export interface UserLocation extends LatLng {
  bearing: number;
  speed: number;
  accuracy: number;
  timestamp: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuverType?: TurnType;
  streetName?: string;
  coordinate?: LatLng;
}

export interface RouteResult {
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  etaMinutes: number;
  distanceKm: number;
  steps: RouteStep[];
  isEstimated?: boolean;
  alternativeGeometries?: Array<[number, number][]>;
}

export type NavigationState =
  | "idle"
  | "searching"
  | "destination_selected"
  | "calculating_route"
  | "route_available"
  | "navigation_active"
  | "updating_position"
  | "rerouting"
  | "location_unavailable"
  | "destination_reached"
  | "error_recoverable";

export interface RouteProgress {
  currentStepIndex: number;
  distanceToNextManeuver: number;
  distanceRemaining: number;
  durationRemaining: number;
  eta: Date;
  isOffRoute: boolean;
}