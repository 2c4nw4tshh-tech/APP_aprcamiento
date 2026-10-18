"use client";

import { LoaderCircle, Navigation, Route as RouteIcon, X } from "lucide-react";
import { getNavigationUrl, NavigationProvider } from "@/lib/gis";
import { LatLng, RouteResult } from "@/types/navigation";
import { useAppStore } from "@/store";
import { NAVIGATION_BLUE } from "@/types/map";
import { useTheme } from "next-themes";

interface RouteCardProps {
  route: RouteResult | null;
  origin: LatLng;
  destination: LatLng;
  destinationLabel?: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
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
}: RouteCardProps) {
  const t = useAppStore((state) => state.t);
  const { resolvedTheme } = useTheme();

  const openExternalRoute = (provider: NavigationProvider) => {
    const url = getNavigationUrl(provider, origin, destination, destinationLabel);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="absolute bottom-20 left-1/2 z-30 w-[min(440px,calc(100%-24px))] -translate-x-1/2 overflow-hidden rounded-t-3xl rounded-b-2xl border border-base bg-white/95 shadow-2xl backdrop-blur-md dark:bg-gray-900/95">
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
          style={{ backgroundColor: resolvedTheme === "dark" ? "#450A0A" : "#FEF2F2", color: "#DC2626", borderRadius: "12px" }}
          className="p-2"
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
          <p className="py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : route ? (
          <>
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
          </>
        ) : null}

        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-base pt-3">
          {EXTERNAL_PROVIDERS.map(({ id, key }) => (
            <button
              key={id}
              type="button"
              onClick={() => openExternalRoute(id)}
              style={{
                backgroundColor: resolvedTheme === "dark" ? "#1F2937" : "#F3F4F6",
                color: resolvedTheme === "dark" ? "#F3F4F6" : "#374151",
                borderRadius: "12px",
                border: "none",
              }}
              className="flex min-h-10 items-center justify-center gap-1 px-2 text-xs font-semibold"
            >
              <Navigation size={13} /> {t(key)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}