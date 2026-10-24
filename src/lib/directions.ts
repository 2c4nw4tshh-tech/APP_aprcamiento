import { LatLng, RouteResult, TravelMode, TurnType } from "@/types/navigation";
import { haversineMeters } from "@/lib/gis";

interface MapboxDirectionsResponse {
  routes?: Array<{
    geometry?: RouteResult["geometry"];
    duration?: number;
    distance?: number;
    legs?: Array<{
      steps?: Array<{
        distance?: number;
        duration?: number;
        name?: string;
        maneuver?: {
          instruction?: string;
          type?: string;
          modifier?: string;
          location?: [number, number];
        };
      }>;
    }>;
  }>;
  message?: string;
}

function getManeuverType(type?: string, modifier?: string): TurnType {
  if (type === "arrive") return "arrive";
  if (type === "depart") return "depart";
  if (type === "roundabout" || type === "rotary") return "roundabout";
  if (type === "merge" || type === "on ramp" || type === "off ramp") return "merge";
  if (type === "fork") return modifier?.includes("left") ? "fork-left" : "fork-right";
  if (type === "uturn") return "u-turn";
  if (modifier?.includes("left")) return "turn-left";
  if (modifier?.includes("right")) return "turn-right";
  return "straight";
}

export async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  accessToken: string,
  mode: TravelMode = "driving",
  signal?: AbortSignal,
): Promise<RouteResult> {
  if (!accessToken) throw new Error("Falta configurar el token de Mapbox.");

  const requestController = new AbortController();
  const timeoutId = setTimeout(() => requestController.abort(), 10_000);
  const abortFromCaller = () => requestController.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const params = new URLSearchParams({
    access_token: accessToken,
    geometries: "geojson",
    overview: "full",
    steps: "true",
    language: "es",
    alternatives: "true",
  });
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${mode === "driving" ? "driving-traffic" : mode}/${coordinates}?${params.toString()}`,
      { signal: requestController.signal },
    );
    const payload = await response.json().catch(() => ({})) as MapboxDirectionsResponse;
    if (!response.ok) throw new Error(payload.message ?? "No se pudo calcular la ruta.");

    const route = payload.routes?.[0];
    if (!route?.geometry || !route.duration || !route.distance) {
      throw new Error("Mapbox no encontró una ruta disponible para este destino.");
    }

    return {
      geometry: route.geometry,
      etaMinutes: Math.max(1, Math.ceil(route.duration / 60)),
      distanceKm: route.distance / 1000,
      alternativeGeometries: (payload.routes ?? []).slice(1)
        .flatMap((alternative) => alternative.geometry ? [alternative.geometry.coordinates] : []),
      steps: (route.legs ?? []).flatMap((leg) => leg.steps ?? []).map((step) => ({
        instruction: step.maneuver?.instruction ?? "Continúa por la ruta indicada",
        distanceMeters: step.distance ?? 0,
        durationSeconds: step.duration ?? 0,
        maneuverType: getManeuverType(step.maneuver?.type, step.maneuver?.modifier),
        streetName: step.name || undefined,
        coordinate: step.maneuver?.location
          ? { lng: step.maneuver.location[0], lat: step.maneuver.location[1] }
          : undefined,
      })),
    };
  } catch (error) {
    if (requestController.signal.aborted && !signal?.aborted) {
      throw new Error("La solicitud de ruta tardó demasiado.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

export function createFallbackRoute(origin: LatLng, destination: LatLng): RouteResult {
  const distanceMeters = haversineMeters(origin, destination);
  const distanceKm = distanceMeters / 1000;
  const etaMinutes = Math.max(1, Math.ceil((distanceKm / 30) * 60));

  return {
    geometry: {
      type: "LineString",
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    },
    etaMinutes,
    distanceKm,
    steps: [{
      instruction: "Continúa hacia el destino siguiendo la ruta azul",
      distanceMeters,
      durationSeconds: etaMinutes * 60,
    }],
    isEstimated: true,
  };
}