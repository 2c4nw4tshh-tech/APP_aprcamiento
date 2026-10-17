"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { LocateFixed, LoaderCircle, Navigation, Radar } from "lucide-react";
import toast from "react-hot-toast";
import { safeFetchJson } from "@/lib/safe-fetch";
import { createFallbackRoute, fetchRoute } from "@/lib/directions";
import { useSpotGeofencing } from "@/hooks/useSpotGeofencing";
import { useAppStore } from "@/store";
import { Coordinates, User } from "@/types";
import { ReservationRecord } from "@/types";
import { ArrivalModal } from "@/components/modals/ArrivalModal";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface SpotActionButtonProps {
  spotId: string;
  latitude: number;
  longitude: number;
  onCompleted?: () => void;
  onRouteStarted?: (origin: Coordinates, destination: Coordinates) => void;
}

interface ReservationApiResponse {
  success: boolean;
  error?: string;
  data?: ReservationRecord;
}

interface StartRouteApiResponse extends ReservationApiResponse {
  data?: ReservationRecord & { parkingSpot: { lat: number; lng: number } };
}

interface CheckInResult {
  reservationId: string;
  arrivedAt: string;
  starsAwarded: { driver: number; owner: number };
  user: User;
}

function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Este navegador no admite geolocalización."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(new Error(error.message || "No se pudo obtener tu ubicación.")),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  });
}

export function SpotActionButton({ spotId, latitude, longitude, onCompleted, onRouteStarted }: SpotActionButtonProps) {
  const { update } = useSession();
  const t = useAppStore((state) => state.t);
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const setUser = useAppStore((state) => state.setUser);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [arrival, setArrival] = useState<CheckInResult | null>(null);

  const destination = { lat: latitude, lng: longitude };
  const handleArrival = useCallback((result: CheckInResult) => {
    setArrival(result);
    setReservationId(null);
    setUser(result.user);
    void update();
    onCompleted?.();
  }, [onCompleted, setUser, update]);

  const geofencing = useSpotGeofencing({
    reservationId,
    destination,
    enabled: Boolean(reservationId),
    onArrival: handleArrival,
  });

  const startRoute = async () => {
    setStarting(true);
    try {
      const origin = await getCurrentPosition();
      setUserLocation(origin);
      const reservationResponse = await safeFetchJson<ReservationApiResponse>("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId }),
      }, { success: false });
      if (!reservationResponse.ok || !reservationResponse.data.data) {
        throw new Error(reservationResponse.data.error ?? reservationResponse.error ?? "No se pudo reservar la plaza.");
      }

      const pendingReservation = reservationResponse.data.data;
      let route = createFallbackRoute(origin, destination);
      try {
        route = await fetchRoute(origin, destination, MAPBOX_TOKEN);
      } catch (routeError) {
        console.warn("Directions de Mapbox no disponible; se usa ETA local:", routeError);
      }

      const startResponse = await safeFetchJson<StartRouteApiResponse>(`/api/reservations/${pendingReservation.id}/start-route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLat: origin.lat,
          originLng: origin.lng,
          etaMinutes: route.etaMinutes,
          distanceKm: route.distanceKm,
        }),
      }, { success: false });
      if (!startResponse.ok || !startResponse.data.data) {
        await safeFetchJson(`/api/reservations/${pendingReservation.id}/cancel`, {
          method: "POST",
        }, {});
        throw new Error(startResponse.data.error ?? startResponse.error ?? "No se pudo iniciar la ruta.");
      }

      setReservationId(pendingReservation.id);
      onRouteStarted?.(origin, destination);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar la ruta.");
    } finally {
      setStarting(false);
    }
  };

  if (reservationId) {
    return (
      <>
        <div className="mt-2 rounded-xl border border-base bg-surface2 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {geofencing.checkingIn ? (
              <><LoaderCircle size={16} className="animate-spin text-[#3B82F6]" />{t("checkingIn")}</>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B] px-2.5 py-1 text-xs font-bold text-gray-950">
                <Radar size={14} /> {t("routeInProgress")}
              </span>
            )}
          </p>
          {geofencing.distanceMeters !== null && (
            <p className="mt-1 text-xs text-muted">{t("distanceToSpotMeters", { n: Math.round(geofencing.distanceMeters) })}</p>
          )}
          {geofencing.error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{geofencing.error}</p>}
        </div>
        <ArrivalModal
          open={arrival !== null}
          driverStars={arrival?.starsAwarded.driver ?? 0}
          ownerStars={arrival?.starsAwarded.owner ?? 0}
          onClose={() => setArrival(null)}
        />
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void startRoute()}
      disabled={starting}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white shadow-md ring-2 ring-[#93C5FD] ring-offset-1 disabled:opacity-60"
    >
      {starting ? <LoaderCircle size={16} className="animate-spin" /> : <><LocateFixed size={16} /><Navigation size={14} /></>}
      {starting ? t("startingRoute") : t("startRouteAndReserve")}
    </button>
  );
}