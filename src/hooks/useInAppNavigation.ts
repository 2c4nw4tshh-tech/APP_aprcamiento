"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl";
import { fetchRoute } from "@/lib/directions";
import { haversineMeters } from "@/lib/gis";
import { BrowserLocationService } from "@/lib/location-service";
import { NavigationStateManager } from "@/lib/navigation-state-manager";
import { LatLng, NavigationState, RouteProgress, RouteResult, TravelMode, UserLocation } from "@/types/navigation";

type CameraMode = "following" | "overview" | "free";

function toLatLng([lng, lat]: [number, number]): LatLng {
  return { lat, lng };
}

function routeLength(coordinates: [number, number][]) {
  return coordinates.slice(1).reduce((total, coordinate, index) => (
    total + haversineMeters(toLatLng(coordinates[index]), toLatLng(coordinate))
  ), 0);
}

function getNearestRouteProjection(coordinates: [number, number][], location: LatLng, minimumDistance = 0) {
  if (coordinates.length < 2) return { nearestIndex: 0, nearestDistance: Number.POSITIVE_INFINITY, distanceAlongRoute: 0, snapped: coordinates[0] };
  const latitudeScale = 111_320;
  const longitudeScale = Math.cos(location.lat * Math.PI / 180) * latitudeScale;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let nearestAlongRoute = 0;
  let traversed = 0;
  let snapped = coordinates[0];

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const from = toLatLng(coordinates[index]);
    const to = toLatLng(coordinates[index + 1]);
    const segmentLength = haversineMeters(from, to);
    if (index < coordinates.length - 2 && traversed + segmentLength < minimumDistance - 10) {
      traversed += segmentLength;
      continue;
    }
    const start = { x: (from.lng - location.lng) * longitudeScale, y: (from.lat - location.lat) * latitudeScale };
    const end = { x: (to.lng - location.lng) * longitudeScale, y: (to.lat - location.lat) * latitudeScale };
    const vector = { x: end.x - start.x, y: end.y - start.y };
    const segmentSquared = vector.x * vector.x + vector.y * vector.y;
    const projectedFraction = segmentSquared === 0
      ? 0
      : Math.max(0, Math.min(1, -(start.x * vector.x + start.y * vector.y) / segmentSquared));
    const minimumFraction = segmentLength === 0
      ? 0
      : Math.max(0, Math.min(1, (minimumDistance - traversed) / segmentLength));
    const fraction = Math.max(projectedFraction, minimumFraction);
    const projected = { x: start.x + vector.x * fraction, y: start.y + vector.y * fraction };
    const distance = Math.hypot(projected.x, projected.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
      nearestAlongRoute = traversed + segmentLength * fraction;
      snapped = [
        from.lng + (to.lng - from.lng) * fraction,
        from.lat + (to.lat - from.lat) * fraction,
      ];
    }
    traversed += segmentLength;
  }
  return { nearestIndex, nearestDistance, distanceAlongRoute: nearestAlongRoute, snapped };
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
  const [navigationState, setNavigationState] = useState<NavigationState>("idle");
  const navigationStateManagerRef = useRef<NavigationStateManager | null>(null);
  if (!navigationStateManagerRef.current) navigationStateManagerRef.current = new NavigationStateManager();
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [progress, setProgress] = useState<RouteProgress | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("overview");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [gpsLost, setGpsLost] = useState(false);
  const [poorGps, setPoorGps] = useState(false);
  const routeRef = useRef<RouteResult | null>(null);
  const progressRef = useRef<RouteProgress | null>(null);
  const locationRef = useRef<UserLocation | null>(null);
  const cameraModeRef = useRef<CameraMode>("overview");
  const voiceEnabledRef = useRef(true);
  const navigationRequestedRef = useRef(false);
  const lastFixTimeRef = useRef(0);
  const reroutingRef = useRef(false);
  const rerouteErrorRef = useRef(false);
  const offRouteSinceRef = useRef<number | null>(null);
  const lastStepIndexRef = useRef(-1);
  const previousManeuverDistanceRef = useRef(Number.POSITIVE_INFINITY);
  const announcedThresholdsRef = useRef(new Set<string>());
  const nearestPointIndexRef = useRef(0);
  const distanceAlongRouteRef = useRef(0);
  const snappedCoordinateRef = useRef<[number, number] | null>(null);
  const locationServiceRef = useRef<BrowserLocationService | null>(null);
  if (!locationServiceRef.current) locationServiceRef.current = new BrowserLocationService();

  const transitionNavigationState = useCallback((nextState: NavigationState) => {
    try {
      setNavigationState(navigationStateManagerRef.current!.transition(nextState));
    } catch (transitionError) {
      console.error(transitionError);
    }
  }, []);

  const setCamera = useCallback((mode: CameraMode) => {
    cameraModeRef.current = mode;
    setCameraMode(mode);
  }, []);

  const focusFollowing = useCallback((location = locationRef.current) => {
    if (!map || !location) return;
    const rawMap = map.getMap();
    const closeToManeuver = (progressRef.current?.distanceToNextManeuver ?? Number.POSITIVE_INFINITY) < 100;
    rawMap.easeTo({
      center: [location.lng, location.lat],
      zoom: location.speed > 20 ? 16 : 17.2,
      pitch: closeToManeuver ? 30 : 52,
      bearing: location.bearing,
      offset: [0, Math.round(rawMap.getContainer().clientHeight * 0.16)],
      duration: 850,
    });
  }, [map]);

  const showOverview = useCallback(() => {
    if (map && routeRef.current) {
      const coordinates = routeRef.current.geometry.coordinates;
      if (coordinates.length) {
        const longitudes = coordinates.map(([longitude]) => longitude);
        const latitudes = coordinates.map(([, latitude]) => latitude);
        map.getMap().fitBounds(
          [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
          { padding: { top: 100, right: 70, bottom: 210, left: 70 }, duration: 700, maxZoom: 16, pitch: 0, bearing: 0 },
        );
      }
    }
    setCamera("overview");
  }, [map, setCamera]);

  const recenter = useCallback(() => {
    setCamera("following");
    focusFollowing();
  }, [focusFollowing, setCamera]);

  useEffect(() => {
    if (!origin || !destination) {
      locationServiceRef.current?.stop();
      navigationRequestedRef.current = false;
      reroutingRef.current = false;
      rerouteErrorRef.current = false;
      routeRef.current = null;
      setRoute(null);
      setError(null);
      setLoading(false);
      transitionNavigationState("idle");
      return;
    }

    const controller = new AbortController();
    locationServiceRef.current?.stop();
    navigationRequestedRef.current = false;
    reroutingRef.current = false;
    rerouteErrorRef.current = false;
    routeRef.current = null;
    distanceAlongRouteRef.current = 0;
    nearestPointIndexRef.current = 0;
    snappedCoordinateRef.current = null;
    setLoading(true);
    setError(null);
    setRoute(null);
    setProgress(null);
    progressRef.current = null;
    transitionNavigationState("calculating_route");

    void fetchRoute(origin, destination, accessToken, travelMode, controller.signal)
      .then((nextRoute) => {
        routeRef.current = nextRoute;
        setRoute(nextRoute);
        transitionNavigationState("route_available");
      })
      .catch((routeError: unknown) => {
        if (controller.signal.aborted) return;
        const message = routeError instanceof Error ? routeError.message : "No se pudo calcular una ruta.";
        setError(message);
        transitionNavigationState("error_recoverable");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, accessToken, travelMode, transitionNavigationState]);

  useEffect(() => {
    if (!map || !mapReady || navigationState !== "navigation_active") return;
    const rawMap = map.getMap();
    const onDragStart = () => setCamera("free");
    rawMap.on("dragstart", onDragStart);
    return () => { rawMap.off("dragstart", onDragStart); };
  }, [map, mapReady, navigationState, setCamera]);

  useEffect(() => {
    if (navigationState !== "navigation_active" && navigationState !== "location_unavailable") return;
    const timer = window.setInterval(() => {
      const stale = Date.now() - lastFixTimeRef.current > 5000;
      setGpsLost(stale);
      if (stale) transitionNavigationState("location_unavailable");
    }, 1000);
    return () => window.clearInterval(timer);
  }, [navigationState, transitionNavigationState]);

  const announce = useCallback((text: string) => {
    if (!voiceEnabledRef.current || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }, []);

  const handlePosition = useCallback((location: UserLocation) => {
    locationRef.current = location;
    lastFixTimeRef.current = Date.now();
    setCurrentLocation(location);
    setGpsLost(false);
    const inaccurate = location.accuracy > 50;
    setPoorGps(inaccurate);
    if (inaccurate) {
      transitionNavigationState("location_unavailable");
      return;
    }
    transitionNavigationState("updating_position");

    const activeRoute = routeRef.current;
    if (!activeRoute || !destination) return;
    const coordinates = activeRoute.geometry.coordinates;
    const { nearestIndex, nearestDistance, distanceAlongRoute, snapped } = getNearestRouteProjection(
      coordinates,
      location,
      distanceAlongRouteRef.current,
    );
    distanceAlongRouteRef.current = Math.max(distanceAlongRouteRef.current, distanceAlongRoute);
    nearestPointIndexRef.current = nearestIndex;
    snappedCoordinateRef.current = snapped;

    let nextManeuverIndex = activeRoute.steps.findIndex((step, index) => (
      index > 0 && step.maneuverType !== "depart" && step.coordinate
      && getNearestRouteProjection(coordinates, step.coordinate).distanceAlongRoute > distanceAlongRoute + 10
    ));
    if (nextManeuverIndex < 0) nextManeuverIndex = Math.max(0, activeRoute.steps.length - 1);
    const maneuver = activeRoute.steps[nextManeuverIndex];
    const distanceToNextManeuver = maneuver?.coordinate
      ? haversineMeters(location, maneuver.coordinate)
      : haversineMeters(location, destination);
    const distanceRemaining = Math.max(0, routeLength(coordinates) - distanceAlongRoute);
    const totalDuration = activeRoute.steps.reduce((total, step) => total + step.durationSeconds, 0);
    const totalDistance = Math.max(1, routeLength(coordinates));
    const durationRemaining = totalDuration * Math.min(1, distanceRemaining / totalDistance);
    const nextProgress = {
      currentStepIndex: nextManeuverIndex,
      distanceToNextManeuver,
      distanceRemaining,
      durationRemaining,
      eta: new Date(Date.now() + durationRemaining * 1000),
      isOffRoute: nearestDistance > 30,
    };
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    if (!rerouteErrorRef.current) setError(null);
    if (!reroutingRef.current && !rerouteErrorRef.current) transitionNavigationState("navigation_active");

    if (lastStepIndexRef.current !== nextManeuverIndex) {
      lastStepIndexRef.current = nextManeuverIndex;
      previousManeuverDistanceRef.current = Number.POSITIVE_INFINITY;
      announcedThresholdsRef.current.clear();
    }
    const activeThreshold = distanceToNextManeuver <= 50 ? 50
      : distanceToNextManeuver <= 200 ? 200
        : distanceToNextManeuver <= 500 ? 500 : null;
    [activeThreshold].forEach((threshold) => {
      if (threshold == null) return;
      const key = `${nextManeuverIndex}:${threshold}`;
      if (previousManeuverDistanceRef.current > threshold && distanceToNextManeuver <= threshold
        && !announcedThresholdsRef.current.has(key) && maneuver) {
        const prefix = threshold === 50 ? "" : `En ${threshold} metros, `;
        announce(`${prefix}${maneuver.instruction}`);
        announcedThresholdsRef.current.add(key);
      }
    });
    previousManeuverDistanceRef.current = distanceToNextManeuver;

    if (haversineMeters(location, destination) < 30) {
      transitionNavigationState("destination_reached");
      navigationRequestedRef.current = false;
      locationServiceRef.current?.stop();
      if (cameraModeRef.current !== "overview") showOverview();
      announce("Has llegado a tu destino");
      return;
    }

    if (nearestDistance > 30) {
      offRouteSinceRef.current ??= Date.now();
      if (Date.now() - offRouteSinceRef.current >= 3000 && !reroutingRef.current && !rerouteErrorRef.current && accessToken) {
        reroutingRef.current = true;
        transitionNavigationState("rerouting");
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15000);
        void fetchRoute(location, destination, accessToken, travelMode, controller.signal)
          .then((rerouted) => {
            routeRef.current = rerouted;
            setRoute(rerouted);
            nearestPointIndexRef.current = 0;
            distanceAlongRouteRef.current = 0;
            snappedCoordinateRef.current = null;
            offRouteSinceRef.current = null;
            rerouteErrorRef.current = false;
            transitionNavigationState("navigation_active");
          })
          .catch(() => {
            rerouteErrorRef.current = true;
            setError("No se pudo recalcular la ruta. Comprueba tu conexión e inténtalo de nuevo.");
            transitionNavigationState("error_recoverable");
          })
          .finally(() => {
            window.clearTimeout(timeout);
            reroutingRef.current = false;
          });
      }
    } else {
      offRouteSinceRef.current = null;
    }

    if (cameraModeRef.current === "following") focusFollowing(location);
  }, [accessToken, announce, destination, focusFollowing, showOverview, travelMode, transitionNavigationState]);

  const startNavigation = useCallback(async () => {
    if (!routeRef.current || !destination) return;
    if (routeRef.current.isEstimated) {
      setError("No se puede iniciar navegación GPS: no hay una ruta real disponible.");
      transitionNavigationState("error_recoverable");
      return;
    }
    const locationService = locationServiceRef.current;
    if (!locationService) {
      setError("Este navegador no permite acceder a la ubicación.");
      transitionNavigationState("error_recoverable");
      return;
    }
    const permission = await locationService.requestPermission();
    if (permission === "denied" || permission === "unsupported") {
      setError(permission === "denied"
        ? "Permite el acceso a la ubicación en los ajustes del navegador para iniciar la navegación."
        : "Este navegador no permite acceder a la ubicación.");
      transitionNavigationState("error_recoverable");
      return;
    }
    setError(null);
    setGpsLost(false);
    setPoorGps(false);
    transitionNavigationState("location_unavailable");
    navigationRequestedRef.current = true;
    setCamera("following");
    const lastKnownLocation = locationService.getLastKnownLocation();
    if (lastKnownLocation) handlePosition(lastKnownLocation);
    locationService.start({
      onLocation: handlePosition,
      onError: (geoError) => {
        setError(geoError.code === 1
          ? "Permite el acceso a la ubicación en los ajustes del navegador para iniciar la navegación."
          : "Obteniendo señal GPS…");
        transitionNavigationState("location_unavailable");
      },
    });
  }, [destination, handlePosition, setCamera, transitionNavigationState]);

  const retryRoute = useCallback(async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setError(null);
    const resumingNavigation = navigationRequestedRef.current && locationRef.current !== null;
    rerouteErrorRef.current = false;
    transitionNavigationState(resumingNavigation ? "rerouting" : "calculating_route");
    try {
      const nextRoute = await fetchRoute(resumingNavigation ? locationRef.current! : origin, destination, accessToken, travelMode);
      routeRef.current = nextRoute;
      setRoute(nextRoute);
      nearestPointIndexRef.current = 0;
      distanceAlongRouteRef.current = 0;
      snappedCoordinateRef.current = null;
      rerouteErrorRef.current = false;
      transitionNavigationState(resumingNavigation ? "navigation_active" : "route_available");
    } catch (routeError) {
      rerouteErrorRef.current = resumingNavigation;
      setError(routeError instanceof Error ? routeError.message : "No se pudo calcular una ruta.");
      transitionNavigationState("error_recoverable");
    } finally {
      setLoading(false);
    }
  }, [accessToken, destination, origin, travelMode, transitionNavigationState]);

  const clearNavigation = useCallback(() => {
    locationServiceRef.current?.stop();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    routeRef.current = null;
    progressRef.current = null;
    locationRef.current = null;
    lastFixTimeRef.current = 0;
    offRouteSinceRef.current = null;
    reroutingRef.current = false;
    rerouteErrorRef.current = false;
    nearestPointIndexRef.current = 0;
    distanceAlongRouteRef.current = 0;
    setRoute(null);
    setLoading(false);
    setError(null);
    setCurrentLocation(null);
    setProgress(null);
    setGpsLost(false);
    setPoorGps(false);
    transitionNavigationState("idle");
    navigationRequestedRef.current = false;
    setCamera("overview");
  }, [map, setCamera, transitionNavigationState]);

  useEffect(() => {
    const service = locationServiceRef.current;
    if (!service) return;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") service.pause();
      else if (navigationRequestedRef.current) service.resume();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [navigationState]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((enabled) => {
      voiceEnabledRef.current = !enabled;
      return !enabled;
    });
  }, []);

  useEffect(() => () => {
    navigationRequestedRef.current = false;
    locationServiceRef.current?.stop();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return {
    route,
    loading,
    error,
    clearNavigation,
    startNavigation,
    retryRoute,
    navigationState,
    currentLocation,
    progress,
    cameraMode,
    recenter,
    showOverview,
    voiceEnabled,
    travelMode,
    setTravelMode,
    toggleVoice,
    gpsLost,
    poorGps,
    traversedCoordinates: route
      ? [
          ...route.geometry.coordinates.slice(0, nearestPointIndexRef.current + 1),
          ...(snappedCoordinateRef.current ? [snappedCoordinateRef.current] : []),
        ]
      : [],
  };
}