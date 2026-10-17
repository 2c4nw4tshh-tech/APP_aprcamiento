import { LatLng, RouteResult } from "@/types/navigation";
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
        maneuver?: { instruction?: string };
      }>;
    }>;
  }>;
  message?: string;
}

export async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  accessToken: string,
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
  });
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?${params.toString()}`,
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
      steps: (route.legs ?? []).flatMap((leg) => leg.steps ?? []).map((step) => ({
        instruction: step.maneuver?.instruction ?? "Continúa por la ruta indicada",
        distanceMeters: step.distance ?? 0,
        durationSeconds: step.duration ?? 0,
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
  };
}