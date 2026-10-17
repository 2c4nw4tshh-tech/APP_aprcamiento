"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl";
import type { GeoJSONSource } from "mapbox-gl";
import { createFallbackRoute, fetchRoute } from "@/lib/directions";
import { LatLng, RouteResult } from "@/types/navigation";
import { ROUTE_LINE_BLUE } from "@/types/map";

const ROUTE_SOURCE_ID = "spotsync-active-route-source";
const ROUTE_LAYER_ID = "spotsync-active-route-line";

function removeRouteFromMap(map: ReturnType<MapRef["getMap"]>) {
  if (!map || typeof map.isStyleLoaded !== "function" || !map.isStyleLoaded()) return;
  
  try {
    if (map.getLayer(ROUTE_LAYER_ID)) {
      map.removeLayer(ROUTE_LAYER_ID);
    }
    if (map.getSource(ROUTE_SOURCE_ID)) {
      map.removeSource(ROUTE_SOURCE_ID);
    }
  } catch (e) {
    console.warn("No se pudo limpiar la ruta del mapa:", e);
  }
}

export function useInAppNavigation(
  map: MapRef | null,
  mapReady: boolean,
  origin: LatLng | null,
  destination: LatLng | null,
  accessToken: string,
) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFitRouteRef = useRef<RouteResult | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setRoute(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setRoute(null);
    lastFitRouteRef.current = null;

    void fetchRoute(origin, destination, accessToken, controller.signal)
      .then(setRoute)
      .catch((routeError: unknown) => {
        if (controller.signal.aborted) return;
        console.warn("Directions de Mapbox no disponible; se usa ETA local:", routeError);
        setRoute(createFallbackRoute(origin, destination));
        setError(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, accessToken]);

  useEffect(() => {
    if (!map || !mapReady) return;
    const rawMap = map.getMap();
    if (!route) {
      removeRouteFromMap(rawMap);
      lastFitRouteRef.current = null;
      return;
    }

    const restoreRouteLayer = () => {
      if (!rawMap.isStyleLoaded()) return;

      const existingSource = rawMap.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
      if (!existingSource) {
        rawMap.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: route.geometry });
      } else if (lastFitRouteRef.current !== route) {
        existingSource.setData(route.geometry);
      }

      if (!rawMap.getLayer(ROUTE_LAYER_ID)) {
        const firstSymbolLayer = rawMap.getStyle().layers?.find((layer) => layer.type === "symbol")?.id;
        rawMap.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ROUTE_LINE_BLUE,
            "line-width": 7,
            "line-opacity": 0.96,
            "line-blur": 0.15,
          },
        }, firstSymbolLayer);
      } else {
        rawMap.setPaintProperty(ROUTE_LAYER_ID, "line-color", ROUTE_LINE_BLUE);
      }

      if (lastFitRouteRef.current !== route) {
        const coordinates = route.geometry.coordinates;
        if (coordinates.length > 0) {
          const longitudes = coordinates.map(([longitude]) => longitude);
          const latitudes = coordinates.map(([, latitude]) => latitude);
          rawMap.fitBounds(
            [
              [Math.min(...longitudes), Math.min(...latitudes)],
              [Math.max(...longitudes), Math.max(...latitudes)],
            ],
            { padding: { top: 64, right: 64, bottom: 220, left: 64 }, duration: 700, maxZoom: 16 },
          );
          lastFitRouteRef.current = route;
        }
      }
    };

    rawMap.on("styledata", restoreRouteLayer);
    restoreRouteLayer();
    return () => {
      rawMap.off("styledata", restoreRouteLayer);
    };
  }, [map, mapReady, route]);

  const clearNavigation = useCallback(() => {
    if (map) removeRouteFromMap(map.getMap());
    lastFitRouteRef.current = null;
    setRoute(null);
    setLoading(false);
    setError(null);
  }, [map]);

  return { route, loading, error, clearNavigation };
}