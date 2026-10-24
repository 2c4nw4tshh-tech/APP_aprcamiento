"use client";

import { LoaderCircle, Navigation, Route as RouteIcon, X } from "lucide-react";
import { FloatingControlsStack, ManeuverBannerView, NavigationProgressSheet } from "@/components/map/NavigationComponents";
import { getNavigationUrl, NavigationProvider } from "@/lib/gis";
import { LatLng, NavigationState, RouteProgress, RouteResult, TravelMode, UserLocation } from "@/types/navigation";
import { useAppStore } from "@/store";
import { NAVIGATION_BLUE } from "@/types/map";
import { createPortal } from "react-dom";

interface RouteCardProps {
  route: RouteResult | null;
  origin: LatLng;
  destination: LatLng;
  destinationLabel?: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  navigationState: NavigationState;
  currentLocation: UserLocation | null;
  progress: RouteProgress | null;
  cameraMode: "following" | "overview" | "free";
  voiceEnabled: boolean;
  gpsLost: boolean;
  poorGps: boolean;
  onStartNavigation: () => void;
  onRetryRoute: () => void;
  onRecenter: () => void;
  onOverview: () => void;
  onToggleVoice: () => void;
  travelMode: TravelMode;
  onTravelModeChange: (mode: TravelMode) => void;
}

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.max(0, Math.round(meters))} m` : `${(meters / 1000).toFixed(1)} km`;
}

const EXTERNAL_PROVIDERS: { id: NavigationProvider; key: "googleMaps" | "waze" | "appleMaps" }[] = [
  { id: "google", key: "googleMaps" },
  { id: "waze", key: "waze" },
  { id: "apple", key: "appleMaps" },
];

export function RouteCard({
  route,
  origin,
  destination,
  destinationLabel,
  loading,
  error,
  onClose,
  navigationState,
  currentLocation,
  progress,
  cameraMode,
  voiceEnabled,
  gpsLost,
  poorGps,
  onStartNavigation,
  onRetryRoute,
  onRecenter,
  onOverview,
  onToggleVoice,
  travelMode,
  onTravelModeChange,
}: RouteCardProps) {
  const t = useAppStore((state) => state.t);

  const openExternalRoute = (provider: NavigationProvider) => {
    const url = getNavigationUrl(provider, origin, destination, destinationLabel);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isActive = Boolean(route) && ["navigation_active", "rerouting", "location_unavailable", "destination_reached", "error_recoverable"].includes(navigationState);
  const currentStep = route?.steps[progress?.currentStepIndex ?? 0];
  const isArrived = navigationState === "destination_reached";
  const cancelNavigation = () => {
    if (isActive && !isArrived && !window.confirm("¿Cancelar la ruta?")) return;
    onClose();
  };

  if (isActive) {
    return createPortal(
      <div className="pointer-events-none fixed inset-0 z-[1550]">
        <section className="pointer-events-auto absolute inset-x-3 top-[max(env(safe-area-inset-top),12px)] mx-auto max-w-xl overflow-hidden rounded-2xl border border-base bg-surface shadow-2xl">
          {isArrived ? (
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-lg font-bold">Has llegado a tu destino</p>
                <p className="mt-1 text-sm text-muted">{destinationLabel ?? "Destino"}</p>
              </div>
              <button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-[var(--accent-fg)]">OK</button>
            </div>
          ) : (
            <>
              <ManeuverBannerView
                instruction={navigationState === "rerouting" ? "Recalculando…" : currentStep?.instruction ?? "Sigue la ruta indicada"}
                streetName={currentStep?.streetName || destinationLabel || "Ruta activa"}
                distanceMeters={progress?.distanceToNextManeuver}
                loading={navigationState === "rerouting"}
                steps={route?.steps ?? []}
                currentStepIndex={progress?.currentStepIndex ?? -1}
              />
              {(gpsLost || poorGps || navigationState === "location_unavailable" || navigationState === "error_recoverable" || error) && (
                <div role="status" className="flex items-center gap-3 border-t border-base bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  <span className="min-w-0 flex-1">{error || "Obteniendo señal GPS…"}</span>
                  {(navigationState === "location_unavailable" || navigationState === "error_recoverable") && (
                    <button
                      type="button"
                      onClick={navigationState === "error_recoverable" ? onRetryRoute : onStartNavigation}
                      className="min-h-11 shrink-0 rounded-lg px-3 font-semibold underline"
                    >
                      {navigationState === "error_recoverable" ? "Reintentar cálculo" : "Reintentar GPS"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {!isArrived && (
          <>
            <div className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+96px)] right-3">
              <FloatingControlsStack
                isFree={cameraMode === "free"}
                voiceEnabled={voiceEnabled}
                onRecenter={onRecenter}
                onOverview={onOverview}
                onToggleVoice={onToggleVoice}
              />
            </div>
            <section className="pointer-events-auto absolute inset-x-3 bottom-[env(safe-area-inset-bottom)] mx-auto max-w-xl">
              <NavigationProgressSheet
                progress={progress}
                destinationLabel={destinationLabel}
                steps={route?.steps}
                currentStepIndex={progress?.currentStepIndex}
                onCancel={cancelNavigation}
              />
            </section>
          </>
        )}
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[1550] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-base bg-surface shadow-2xl">
      <header className="flex items-start justify-between gap-3 border-b border-base px-4 py-3">
        <div className="flex items-center gap-2">
          <RouteIcon size={19} className="shrink-0" style={{ color: NAVIGATION_BLUE }} />
          <div>
            <h2 className="text-sm font-semibold">{t("routeCardTitle")}</h2>
            {destinationLabel && <p className="max-w-[300px] truncate text-xs text-muted">{destinationLabel}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("cancelRoute")}
          title={t("cancelRoute")}
          style={{ backgroundColor: "color-mix(in srgb, var(--color-destructive) 12%, var(--color-bg))", color: "var(--color-destructive)", borderRadius: "12px" }}
          className="grid h-11 w-11 shrink-0 place-items-center"
        >
          <X size={17} />
        </button>
      </header>

      <div className="px-4 py-3">
        {loading ? (
          <p className="flex items-center gap-2 py-2 text-sm text-muted" role="status">
            <LoaderCircle size={16} className="animate-spin" /> {t("routeCalculating")}
          </p>
        ) : error ? (
          <div className="py-2">
            <p role="alert" className="text-sm text-[var(--color-destructive)]">{error}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={onRetryRoute} className="min-h-11 flex-1 rounded-xl bg-[var(--color-primary)] px-3 text-sm font-semibold text-white">Intentar de nuevo</button>
              <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-base px-3 text-sm font-semibold text-base">Cambiar destino</button>
            </div>
          </div>
        ) : route ? (
          <>
            {route.isEstimated && (
              <p role="status" className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                Ruta aproximada en línea recta. La navegación GPS requiere una ruta real de Mapbox.
              </p>
            )}
            <div className="mb-3 grid grid-cols-3 rounded-xl bg-surface2 p-1" role="group" aria-label="Modo de transporte">
              {([
                ["driving", "Conducir"],
                ["walking", "A pie"],
                ["cycling", "Bicicleta"],
              ] as [TravelMode, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={travelMode === mode}
                  onClick={() => onTravelModeChange(mode)}
                  className={`min-h-11 rounded-lg px-2 text-sm font-medium ${travelMode === mode ? "bg-surface text-base shadow-sm" : "text-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-5">
              <div>
                <p className="font-display text-2xl font-bold leading-none">{route.etaMinutes} <span className="text-sm font-semibold">{t("minutesShort")}</span></p>
                <p className="mt-1 text-xs text-muted">{t("routeEta")}</p>
              </div>
              <div>
                <p className="font-display text-lg font-semibold leading-none">{route.distanceKm.toFixed(1)} km</p>
                <p className="mt-1 text-xs text-muted">{t("routeDistance")}</p>
              </div>
            </div>
            {route.steps.length > 0 && (
              <ol className="mt-3 max-h-16 space-y-1 overflow-y-auto border-t border-base pt-2 text-xs text-muted">
                {route.steps.slice(0, 2).map((step, index) => (
                  <li key={`${index}-${step.instruction}`} className="truncate">{index + 1}. {step.instruction}</li>
                ))}
              </ol>
            )}
            <button
              type="button"
              onClick={onStartNavigation}
              disabled={loading || !route || route.isEstimated}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-base font-semibold text-white hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Navigation size={18} /> Iniciar navegación
            </button>
          </>
        ) : null}

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-base pt-3">
          {EXTERNAL_PROVIDERS.map(({ id, key }) => (
            <button
              key={id}
              type="button"
              onClick={() => openExternalRoute(id)}
              className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-surface2 px-2 text-xs font-semibold text-base"
            >
              <Navigation size={13} /> {t(key)}
            </button>
          ))}
        </div>
      </div>
    </section>
    </div>,
    document.body,
  );
}