"use client";
import { useState, useEffect, useCallback } from "react";
import { Coordinates, Language } from "@/types";
import { useAppStore } from "@/store";

type GeoErrorKind = "blocked" | "http" | "unavailable" | "unsupported" | "general";
interface GeoState { coords: Coordinates | null; error: string | null; errorKind?: GeoErrorKind; loading: boolean; }

const isLocalNetworkHost = (hostname: string) =>
  /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);

const isLoopbackHost = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";

const isSecureGeolocationContext = () => {
  if (typeof window === "undefined") return false;
  return window.isSecureContext || isLoopbackHost(window.location.hostname);
};

const getGeoErrorKind = (err?: GeolocationPositionError | null, hostname = ""): GeoErrorKind => {
  if (err?.code === 1) return "blocked";
  if (typeof window !== "undefined" && window.location.protocol === "http:" && isLocalNetworkHost(hostname) && !isLoopbackHost(hostname)) return "http";
  if (err?.code === 2 || err?.code === 3) return "unavailable";
  return "general";
};

const getGeoErrorMessage = (kind: GeoErrorKind, language: Language) => {
  const keyByKind: Record<GeoErrorKind, "geoBlocked" | "geoHttp" | "geoUnavailable" | "geoUnsupported" | "geoGeneral"> = {
    blocked: "geoBlocked",
    http: "geoHttp",
    unavailable: "geoUnavailable",
    unsupported: "geoUnsupported",
    general: "geoGeneral",
  };
  return useAppStore.getState().t(keyByKind[kind]);
};

export function useGeolocation(watch = false) {
  const [state, setState] = useState<GeoState>({ coords: null, error: null, loading: false });
  const language = useAppStore((store) => store.language);
  const setUserLocation = useAppStore((s) => s.setUserLocation);

  useEffect(() => {
    if (state.errorKind) setState((previous) => ({ ...previous, error: getGeoErrorMessage(state.errorKind!, language) }));
  }, [language, state.errorKind]);

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setState({ coords: c, error: null, loading: false });
    setUserLocation(c);
  }, [setUserLocation]);

  const onError = useCallback((err: GeolocationPositionError) => {
    const errorKind = getGeoErrorKind(err, typeof window !== "undefined" ? window.location.hostname : "");
    setState((previous) => ({ ...previous, errorKind, error: getGeoErrorMessage(errorKind, language), loading: false }));
  }, [language]);

  const request = useCallback(() => {
    if (typeof window !== "undefined" && window.location.protocol === "http:" && isLocalNetworkHost(window.location.hostname) && !isSecureGeolocationContext()) {
      const errorKind = getGeoErrorKind(null, window.location.hostname);
      setState({ coords: null, errorKind, error: getGeoErrorMessage(errorKind, language), loading: false });
      return;
    }

    if (!navigator.geolocation) {
      setState({ coords: null, errorKind: "unsupported", error: getGeoErrorMessage("unsupported", language), loading: false });
      return;
    }

    setState((previous) => ({ ...previous, error: null, errorKind: undefined, loading: true }));
    // Debe llamarse sincrónicamente desde el gesto del usuario para que Safari muestre el aviso.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === 1) { onError(err); return; }
        navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [onSuccess, onError, language]);

  // Safari no muestra el aviso sin gesto del usuario: solo se autopide si ya hay permiso.
  const requestIfGranted = useCallback(async () => {
    try {
      const status = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
      if (status?.state === "granted") request();
    } catch {
      // Permissions API no disponible; se espera al botón.
    }
  }, [request]);

  useEffect(() => {
    if (!watch) return;

    if (typeof window !== "undefined" && window.location.protocol === "http:" && isLocalNetworkHost(window.location.hostname) && !isSecureGeolocationContext()) {
      const errorKind = getGeoErrorKind(null, window.location.hostname);
      setState({ coords: null, errorKind, error: getGeoErrorMessage(errorKind, language), loading: false });
      return;
    }

    if (!navigator.geolocation) {
      setState({ coords: null, errorKind: "unsupported", error: getGeoErrorMessage("unsupported", language), loading: false });
      return;
    }

    setState((p) => ({ ...p, loading: true }));
    const id = navigator.geolocation.watchPosition(onSuccess, onError, { enableHighAccuracy: true, maximumAge: 3000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [watch, onSuccess, onError, language]);

  return { ...state, request, requestIfGranted };
}
