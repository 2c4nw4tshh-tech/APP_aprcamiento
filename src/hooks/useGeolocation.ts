"use client";
import { useState, useEffect, useCallback } from "react";
import { Coordinates } from "@/types";
import { useAppStore } from "@/store";

interface GeoState { coords: Coordinates | null; error: string | null; loading: boolean; }

export function useGeolocation(watch = false) {
  const [state, setState] = useState<GeoState>({ coords: null, error: null, loading: false });
  const setUserLocation = useAppStore((s) => s.setUserLocation);

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setState({ coords: c, error: null, loading: false });
    setUserLocation(c);
  }, [setUserLocation]);

  const onError = useCallback((err: GeolocationPositionError) => {
    setState((p) => ({ ...p, error: err.message, loading: false }));
  }, []);

  const request = useCallback(() => {
    if (!navigator.geolocation) return setState({ coords: null, error: "Not supported", loading: false });
    setState((p) => ({ ...p, loading: true }));
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true, timeout: 10000 });
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!watch || !navigator.geolocation) return;
    setState((p) => ({ ...p, loading: true }));
    const id = navigator.geolocation.watchPosition(onSuccess, onError, { enableHighAccuracy: true, maximumAge: 3000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [watch, onSuccess, onError]);

  return { ...state, request };
}
