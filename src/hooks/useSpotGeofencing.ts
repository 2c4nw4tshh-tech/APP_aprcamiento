"use client";

import { useEffect, useRef, useState } from "react";
import { safeFetchJson } from "@/lib/safe-fetch";
import { haversineMeters } from "@/lib/gis";
import { LatLng } from "@/types/navigation";
import { User } from "@/types";

interface CheckInResponse {
  success: boolean;
  error?: string;
  data?: {
    reservationId: string;
    arrivedAt: string;
    starsAwarded: { driver: number; owner: number };
    user: User;
  };
}

interface UseSpotGeofencingOptions {
  reservationId: string | null;
  destination: LatLng;
  enabled: boolean;
  onArrival: (result: NonNullable<CheckInResponse["data"]>) => void;
}

export function useSpotGeofencing({ reservationId, destination, enabled, onArrival }: UseSpotGeofencingOptions) {
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkInStarted = useRef(false);
  const smoothedPosition = useRef<LatLng | null>(null);
  const onArrivalRef = useRef(onArrival);
  onArrivalRef.current = onArrival;

  useEffect(() => {
    checkInStarted.current = false;
    smoothedPosition.current = null;
    setDistanceMeters(null);
    setError(null);
  }, [reservationId]);

  useEffect(() => {
    if (!enabled || !reservationId) return;
    if (!navigator.geolocation) {
      setError("Este navegador no admite geolocalización para el check-in automático.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (position.coords.accuracy > 60) return;

        const rawLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const previousPosition = smoothedPosition.current;
        const alpha = 0.3;
        const currentLocation = previousPosition
          ? {
              lat: previousPosition.lat + alpha * (rawLocation.lat - previousPosition.lat),
              lng: previousPosition.lng + alpha * (rawLocation.lng - previousPosition.lng),
            }
          : rawLocation;
        smoothedPosition.current = currentLocation;
        const distance = haversineMeters(currentLocation, destination);
        setDistanceMeters(distance);

        if (distance > 20 || checkInStarted.current) return;
        checkInStarted.current = true;
        setCheckingIn(true);
        setError(null);

        void safeFetchJson<CheckInResponse>(`/api/reservations/${reservationId}/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }, { success: false })
          .then((response) => {
            if (!response.ok || !response.data.success || !response.data.data) {
              checkInStarted.current = false;
              setError(response.data.error ?? response.error ?? "No se pudo completar el check-in.");
              return;
            }
            onArrivalRef.current(response.data.data);
          })
          .catch((checkInError: unknown) => {
            checkInStarted.current = false;
            setError(checkInError instanceof Error ? checkInError.message : "No se pudo completar el check-in.");
          })
          .finally(() => setCheckingIn(false));
      },
      (positionError) => setError(positionError.message || "No se pudo leer la ubicación actual."),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, reservationId, destination.lat, destination.lng]);

  return { distanceMeters, checkingIn, error };
}