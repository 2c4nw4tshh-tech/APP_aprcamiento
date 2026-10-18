"use client";

import Map, { Marker, NavigationControl } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { NearbySpot } from "@/types";
import { useAppStore } from "@/store";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { MAP_STYLES, NAVIGATION_BLUE } from "@/types/map";
import { useMapStyles } from "@/hooks/useMapStyles";
import { MapStylePicker } from "@/components/map/MapStylePicker";
import { useInAppNavigation } from "@/hooks/useInAppNavigation";
import { RouteCard } from "@/components/map/RouteCard";
import { LatLng } from "@/types/navigation";

interface SpotMapProps {
  center?: [number, number];
  spots?: NearbySpot[] | null;
  onSpotClick?: (spot: NearbySpot) => void;
  selectedSpotId?: string | null;
  pickMode?: boolean;
  onMapPick?: (latitude: number, longitude: number) => void;
  locationWarning?: string;
  navigationOrigin?: LatLng | null;
  navigationDestination?: LatLng | null;
  navigationLabel?: string;
  onClearNavigation?: () => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const DEFAULT_CENTER: [number, number] = [40.416775, -3.70379];

function transformMapboxRequest(url: string) {
  if (url.startsWith("http://") && /(^|\.)tiles\.mapbox\.com\//.test(url.slice("http://".length))) {
    return { url: url.replace(/^http:\/\//, "https://") };
  }
  return { url };
}

export default function SpotMap({
  center = DEFAULT_CENTER,
  spots,
  onSpotClick,
  selectedSpotId,
  pickMode = false,
  onMapPick,
  locationWarning,
  navigationOrigin,
  navigationDestination,
  navigationLabel,
  onClearNavigation,
}: SpotMapProps) {
  const t = useAppStore((store) => store.t);
  const mapRef = useRef<MapRef>(null);
  const [mapInstance, setMapInstance] = useState<MapRef | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const { styleId, initialStyleId, selectStyle } = useMapStyles(mapInstance, mapReady);
  const inAppNavigation = useInAppNavigation(
    mapInstance,
    mapReady,
    navigationOrigin ?? null,
    navigationDestination ?? null,
    MAPBOX_TOKEN,
  );
  const safeCenter = Array.isArray(center) && center.length === 2 && center.every(Number.isFinite)
    ? center
    : DEFAULT_CENTER;
  const safeSpots = Array.isArray(spots)
    ? spots.filter((spot) => Number.isFinite(spot?.latitude) && Number.isFinite(spot?.longitude))
    : [];
  const retryMap = () => {
    setMapError(null);
    setMapReady(false);
    setMapAttempt((attempt) => attempt + 1);
  };

  if (!MAPBOX_TOKEN || mapError) {
    return (
      <div className="relative flex h-full min-h-[350px] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-base bg-bg px-6 text-center">
        <MapPin size={28} className="text-accent" />
        <p className="text-sm text-muted">
          {!MAPBOX_TOKEN ? t("mapNotConfigured") : t("mapLoadFailed")}
        </p>
        <button
          type="button"
          onClick={!MAPBOX_TOKEN ? () => window.location.reload() : retryMap}
          style={{ backgroundColor: "#3B82F6", color: "#FFFFFF", borderRadius: "12px" }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <RefreshCw size={15} />
          {t("retryMap")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[350px] rounded-2xl overflow-hidden relative z-0 border border-base">
      {locationWarning && (
        <div className="absolute inset-x-4 top-4 z-10 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 backdrop-blur-sm">
          <p className="text-[11px] leading-snug text-yellow-700 dark:text-yellow-200">⚠️ {locationWarning}</p>
        </div>
      )}

      <Map
        key={mapAttempt}
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        transformRequest={transformMapboxRequest}
        initialViewState={{
          latitude: safeCenter[0],
          longitude: safeCenter[1],
          zoom: 15,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLES[initialStyleId].style}
        onLoad={() => {
          setMapInstance(mapRef.current);
          setMapReady(true);
        }}
        onRender={() => {
          if (!mapReady && mapRef.current) {
            setMapInstance(mapRef.current);
            setMapReady(true);
          }
        }}
        onStyleData={() => {
          const currentMap = mapRef.current;
          if (currentMap) {
            setMapInstance(currentMap);
            setMapReady(true);
          }
        }}
        onError={(event) => setMapError(event.error?.message ?? "No se pudo inicializar Mapbox.")}
        onClick={(event) => {
          if (pickMode) onMapPick?.(event.lngLat.lat, event.lngLat.lng);
        }}
      >
        <NavigationControl position="bottom-right" />

        <Marker latitude={safeCenter[0]} longitude={safeCenter[1]}>
          <div className="relative flex items-center justify-center">
            <div className="h-5 w-5 animate-pulse rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: NAVIGATION_BLUE }} />
            <div className="absolute h-10 w-10 animate-ping rounded-full" style={{ backgroundColor: `${NAVIGATION_BLUE}40` }} />
          </div>
        </Marker>

        {safeSpots.map((spot) => {
          const selected = spot.id === selectedSpotId
            || (navigationDestination?.lat === spot.latitude && navigationDestination?.lng === spot.longitude);
          const leavingSoon = spot.isLeaving || (spot.countdownMinutes ?? 0) > 0;
          return (
            <Marker
              key={spot.id}
              latitude={spot.latitude}
              longitude={spot.longitude}
              anchor={selected ? "bottom" : "center"}
              onClick={(event) => { event.originalEvent.stopPropagation(); onSpotClick?.(spot); }}
            >
              <div className="relative flex cursor-pointer flex-col items-center transition-transform hover:scale-110">
                {selected ? (
                  <MapPin size={36} className="drop-shadow-lg" style={{ color: leavingSoon ? "#FACC15" : "#22C55E", fill: "currentColor", stroke: "#FFFFFF" }} />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: leavingSoon ? "#FACC15" : "#22C55E" }} />
                )}
                {(spot.countdownMinutes ?? 0) > 0 && (
                  <span className="mt-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {spot.countdownMinutes ?? 0} min
                  </span>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>
      {mapReady && <MapStylePicker value={styleId} onChange={selectStyle} />}
      {navigationOrigin && navigationDestination && (
        <RouteCard
          route={inAppNavigation.route}
          origin={navigationOrigin}
          destination={navigationDestination}
          destinationLabel={navigationLabel}
          loading={inAppNavigation.loading}
          error={inAppNavigation.error}
          onClose={() => {
            inAppNavigation.clearNavigation();
            onClearNavigation?.();
          }}
        />
      )}
      {!mapReady && (
        <GlobalLoader fullScreen={false} label={t("mapLoading")} />
      )}
    </div>
  );
}