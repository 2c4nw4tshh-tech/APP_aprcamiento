"use client";

import { useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import type { GeoJSONSource } from "mapbox-gl";
import { ArrowUpRight, LocateFixed, Navigation, Volume2, VolumeX, X } from "lucide-react";
import type { LatLng, RouteProgress, RouteResult, RouteStep, UserLocation } from "@/types/navigation";
import { ROUTE_LINE_BLUE } from "@/types/map";

interface ManeuverBannerViewProps {
  instruction: string;
  streetName?: string;
  distanceMeters?: number;
  loading?: boolean;
  steps: RouteStep[];
  currentStepIndex: number;
}

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.max(0, Math.round(meters))} m` : `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.ceil(seconds / 60));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function ManeuverBannerView({ instruction, streetName, distanceMeters, loading = false, steps, currentStepIndex }: ManeuverBannerViewProps) {
  return (
    <details className="border-b border-base bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
      <summary className="flex min-h-[76px] cursor-pointer list-none items-center gap-4 px-4 py-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-white" aria-hidden="true">
          {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Navigation size={24} className="-rotate-45" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold leading-tight text-base" key={instruction}>{instruction}</span>
          <span className="mt-1 block truncate text-sm text-muted">{streetName || "Ruta activa"}</span>
        </span>
        <span className="shrink-0 text-lg font-semibold tabular-nums text-base">{distanceMeters == null ? "--" : formatDistance(distanceMeters)}</span>
      </summary>
      <ol className="max-h-48 space-y-2 overflow-y-auto border-t border-base px-4 py-3 text-sm">
        {steps.map((step, index) => (
          <li key={`${index}-${step.instruction}`} className={`flex gap-3 ${index === currentStepIndex ? "font-semibold text-[var(--color-primary)]" : "text-muted"}`}>
            <span className="w-12 shrink-0">{formatDistance(step.distanceMeters)}</span>
            <span>{step.instruction}{step.streetName ? ` · ${step.streetName}` : ""}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

interface NavigationProgressSheetProps {
  progress: RouteProgress | null;
  destinationLabel?: string;
  steps?: RouteStep[];
  currentStepIndex?: number;
  onCancel: () => void;
}

export function NavigationProgressSheet({ progress, destinationLabel, steps = [], currentStepIndex = -1, onCancel }: NavigationProgressSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const touchStartY = useRef<number | null>(null);

  return (
    <section
      className="rounded-t-2xl border border-base bg-surface px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.15)] transition-[max-height] duration-300"
      aria-label="Progreso de navegación"
      onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }}
      onTouchEnd={(event) => {
        const endY = event.changedTouches[0]?.clientY;
        if (touchStartY.current == null || endY == null) return;
        const delta = touchStartY.current - endY;
        if (delta > 35) setExpanded(true);
        if (delta < -35) setExpanded(false);
        touchStartY.current = null;
      }}
    >
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Contraer detalles de ruta" : "Expandir detalles de ruta"} aria-expanded={expanded} className="mx-auto mb-2 block h-1.5 w-10 rounded-full bg-[var(--color-label-secondary)]" />
      <div className="flex min-h-14 items-center gap-3">
        <div className="min-w-0">
          <p className="text-xl font-bold leading-tight tabular-nums text-base">{progress?.eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "--:--"}</p>
          <p className="max-w-24 truncate text-xs text-muted">{destinationLabel || "Llegada"}</p>
        </div>
        <span aria-hidden="true" className="text-muted">|</span>
        <p className="whitespace-nowrap text-sm font-medium text-base">{progress ? formatDuration(progress.durationRemaining) : "Calculando"}</p>
        <span aria-hidden="true" className="text-muted">|</span>
        <p className="whitespace-nowrap text-sm font-medium text-base">{progress ? formatDistance(progress.distanceRemaining) : "--"}</p>
        <button type="button" onClick={onCancel} aria-label="Cancelar navegación" title="Cancelar navegación" className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-destructive)] text-white hover:brightness-90">
          <X size={22} />
        </button>
      </div>
      {expanded && (
        <div className="max-h-[45dvh] overflow-y-auto border-t border-base pt-3">
          <ol className="space-y-3 text-sm">
            {steps.map((step, index) => (
              <li key={`${index}-${step.instruction}`} className={`flex gap-3 ${index === currentStepIndex ? "font-semibold text-[var(--color-primary)]" : "text-muted"}`}>
                <span className="w-12 shrink-0">{formatDistance(step.distanceMeters)}</span>
                <span>{step.instruction}{step.streetName ? ` · ${step.streetName}` : ""}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

interface UserLocationIndicatorProps {
  position: UserLocation | null;
  fallback: LatLng;
}

export function UserLocationIndicator({ position, fallback }: UserLocationIndicatorProps) {
  const [displayPosition, setDisplayPosition] = useState<LatLng>(fallback);
  const frameRef = useRef<number | null>(null);
  const target = position ?? fallback;

  useEffect(() => {
    const start = displayPosition;
    const startedAt = performance.now();
    const duration = Math.max(250, Math.min(1500, position ? Date.now() - position.timestamp + 1000 : 1000));
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    const animate = (now: number) => {
      const fraction = Math.min(1, (now - startedAt) / duration);
      setDisplayPosition({
        lat: start.lat + (target.lat - start.lat) * fraction,
        lng: start.lng + (target.lng - start.lng) * fraction,
      });
      if (fraction < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current != null) cancelAnimationFrame(frameRef.current); };
  }, [target.lat, target.lng]);

  return (
    <Marker latitude={displayPosition.lat} longitude={displayPosition.lng}>
      <div className="relative grid h-10 w-10 place-items-center" aria-label="Tu ubicación">
        <span className={`absolute h-9 w-9 rounded-full bg-[var(--color-primary)]/20 ${position && position.accuracy > 50 ? "animate-pulse border-2 border-dashed border-[var(--color-primary)]" : ""}`} />
        <Navigation size={27} className="relative drop-shadow-md" style={{ color: "var(--color-primary)", fill: "var(--color-primary)", stroke: "var(--color-bg)", strokeWidth: 2, transform: `rotate(${position?.bearing ?? 0}deg)` }} />
      </div>
    </Marker>
  );
}

interface FloatingControlsStackProps {
  isFree: boolean;
  voiceEnabled: boolean;
  onRecenter: () => void;
  onOverview: () => void;
  onToggleVoice: () => void;
}

export function FloatingControlsStack({ isFree, voiceEnabled, onRecenter, onOverview, onToggleVoice }: FloatingControlsStackProps) {
  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      {isFree && <button type="button" onClick={onRecenter} aria-label="Volver a centrar" title="Volver a centrar" className="grid h-12 w-12 place-items-center rounded-full border border-base bg-surface shadow-lg"><LocateFixed size={21} className="text-[var(--color-primary)]" /></button>}
      <button type="button" onClick={onOverview} aria-label="Vista general de la ruta" title="Vista general de la ruta" className="grid h-12 w-12 place-items-center rounded-full border border-base bg-surface shadow-lg"><ArrowUpRight size={21} className="text-base" /></button>
      <button type="button" onClick={onToggleVoice} aria-label={voiceEnabled ? "Silenciar indicaciones" : "Activar indicaciones de voz"} title={voiceEnabled ? "Silenciar indicaciones" : "Activar indicaciones de voz"} className="grid h-12 w-12 place-items-center rounded-full border border-base bg-surface shadow-lg">{voiceEnabled ? <Volume2 size={21} /> : <VolumeX size={21} />}</button>
    </div>
  );
}

interface RouteLineOverlayProps {
  map: MapRef | null;
  mapReady: boolean;
  route: RouteResult | null;
  traversedCoordinates: [number, number][];
}

const ACTIVE_SOURCE = "spotsync-active-route-source";
const TRAVERSED_SOURCE = "spotsync-traversed-route-source";
const CASING_LAYER = "spotsync-active-route-casing";
const ACTIVE_LAYER = "spotsync-active-route-line";
const TRAVERSED_LAYER = "spotsync-traversed-route-line";
const ALTERNATIVE_SOURCE_PREFIX = "spotsync-alternative-route-source-";
const ALTERNATIVE_LAYER_PREFIX = "spotsync-alternative-route-line-";

function getDesignToken(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function RouteLineOverlay({ map, mapReady, route, traversedCoordinates }: RouteLineOverlayProps) {
  const fittedRoute = useRef<RouteResult | null>(null);

  useEffect(() => {
    if (!map || !mapReady) return;
    const rawMap = map.getMap();
    if (!route) {
      if (rawMap.isStyleLoaded()) {
        [TRAVERSED_LAYER, ACTIVE_LAYER, CASING_LAYER, ...Array.from({ length: 3 }, (_, index) => `${ALTERNATIVE_LAYER_PREFIX}${index}`)].forEach((id) => {
          if (rawMap.getLayer(id)) rawMap.removeLayer(id);
        });
        [TRAVERSED_SOURCE, ACTIVE_SOURCE, ...Array.from({ length: 3 }, (_, index) => `${ALTERNATIVE_SOURCE_PREFIX}${index}`)].forEach((id) => {
          if (rawMap.getSource(id)) rawMap.removeSource(id);
        });
      }
      fittedRoute.current = null;
      return;
    }

    const restore = () => {
      if (!rawMap.isStyleLoaded()) return;
      const routeChanged = fittedRoute.current !== route;
      const addOrUpdateSource = (id: string, coordinates: [number, number][], forceUpdate = false) => {
        const data = { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates } };
        const source = rawMap.getSource(id) as GeoJSONSource | undefined;
        if (source) {
          if (forceUpdate) source.setData(data);
        } else {
          rawMap.addSource(id, { type: "geojson", data });
        }
      };
      addOrUpdateSource(ACTIVE_SOURCE, route.geometry.coordinates, routeChanged);
      const initialTraversed = traversedCoordinates.length >= 2
        ? traversedCoordinates
        : [route.geometry.coordinates[0], route.geometry.coordinates[0]];
      addOrUpdateSource(TRAVERSED_SOURCE, initialTraversed);
      const beforeId = rawMap.getStyle().layers?.find((layer) => layer.type === "symbol")?.id;
      (route.alternativeGeometries ?? []).slice(0, 3).forEach((coordinates, index) => {
        const sourceId = `${ALTERNATIVE_SOURCE_PREFIX}${index}`;
        const layerId = `${ALTERNATIVE_LAYER_PREFIX}${index}`;
        addOrUpdateSource(sourceId, coordinates, routeChanged);
        if (!rawMap.getLayer(layerId)) rawMap.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": getDesignToken("--color-route-alt", "rgba(142,142,147,0.7)"), "line-width": 4, "line-opacity": 1 },
        }, beforeId);
      });
      for (let index = (route.alternativeGeometries ?? []).length; index < 3; index += 1) {
        const layerId = `${ALTERNATIVE_LAYER_PREFIX}${index}`;
        const sourceId = `${ALTERNATIVE_SOURCE_PREFIX}${index}`;
        if (rawMap.getLayer(layerId)) rawMap.removeLayer(layerId);
        if (rawMap.getSource(sourceId)) rawMap.removeSource(sourceId);
      }
      if (!rawMap.getLayer(CASING_LAYER)) rawMap.addLayer({
        id: CASING_LAYER, type: "line", source: ACTIVE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": getDesignToken("--color-bg", "#FFFFFF"), "line-width": 10, "line-opacity": 0.9 },
      }, beforeId);
      if (!rawMap.getLayer(ACTIVE_LAYER)) rawMap.addLayer({
        id: ACTIVE_LAYER, type: "line", source: ACTIVE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": getDesignToken("--color-route", ROUTE_LINE_BLUE), "line-width": 6, "line-opacity": 0.96 },
      }, beforeId);
      if (!rawMap.getLayer(TRAVERSED_LAYER)) rawMap.addLayer({
        id: TRAVERSED_LAYER, type: "line", source: TRAVERSED_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": getDesignToken("--color-route-traversed", "rgba(142,142,147,0.5)"), "line-width": 6, "line-opacity": 1 },
      });
      if (fittedRoute.current !== route && route.geometry.coordinates.length) {
        const longitudes = route.geometry.coordinates.map(([longitude]) => longitude);
        const latitudes = route.geometry.coordinates.map(([, latitude]) => latitude);
        rawMap.fitBounds(
          [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
          { padding: { top: 64, right: 64, bottom: 220, left: 64 }, duration: 700, maxZoom: 16 },
        );
        fittedRoute.current = route;
      }
    };
    rawMap.on("styledata", restore);
    restore();
    return () => { rawMap.off("styledata", restore); };
  }, [map, mapReady, route]);

  useEffect(() => {
    if (!map || !mapReady || traversedCoordinates.length < 2) return;
    const rawMap = map.getMap();
    const source = rawMap.getSource(TRAVERSED_SOURCE) as GeoJSONSource | undefined;
    source?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: traversedCoordinates },
    });
  }, [map, mapReady, traversedCoordinates]);

  return null;
}
