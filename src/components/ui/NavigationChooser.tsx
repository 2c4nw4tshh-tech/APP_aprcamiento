"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { LoaderCircle, LocateFixed, Navigation, X } from "lucide-react";
import { getNavigationUrl, NavigationProvider } from "@/lib/gis";
import { useAppStore } from "@/store";
import { Coordinates } from "@/types";

interface NavigationChooserProps {
  latitude: number;
  longitude: number;
  label?: string;
  buttonLabel?: string;
  className?: string;
}

const PROVIDERS: { id: NavigationProvider; translationKey: "googleMaps" | "waze" | "appleMaps" }[] = [
  { id: "google", translationKey: "googleMaps" },
  { id: "waze", translationKey: "waze" },
  { id: "apple", translationKey: "appleMaps" },
];

export function NavigationChooser({
  latitude,
  longitude,
  label,
  buttonLabel,
  className,
}: NavigationChooserProps) {
  const t = useAppStore((state) => state.t);
  const { resolvedTheme } = useTheme();
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);

  const acquireOrigin = () => {
    setOrigin(null);
    setLocating(true);
    setLocationError(false);
    if (!navigator.geolocation) {
      setLocating(false);
      setLocationError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = { lat: position.coords.latitude, lng: position.coords.longitude };
        setOrigin(current);
        setUserLocation(current);
        setLocating(false);
      },
      () => {
        setOrigin(null);
        setLocationError(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
    );
  };

  const navigate = (provider: NavigationProvider) => {
    if (!origin) return;
    const url = getNavigationUrl(provider, origin, { lat: latitude, lng: longitude }, label);
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); acquireOrigin(); }}
        className={`${className} rounded-xl bg-surface2 text-base`}
      >
        <Navigation size={14} />
        {buttonLabel ?? t("navigateTo")}
      </button>
      {open && (
        <div className="fixed inset-0 z-[1700] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="navigation-chooser-title"
            className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-base bg-surface p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="navigation-chooser-title" className="font-display text-base font-semibold">{t("chooseNavigationApp")}</h2>
              <button type="button" aria-label={t("closeDetails")} onClick={() => setOpen(false)} className="rounded-full p-2 text-muted hover:bg-surface2">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col divide-y divide-base">
              {locating && (
                <p className="flex items-center gap-2 py-3 text-sm text-muted" role="status">
                  <LoaderCircle size={16} className="animate-spin" /> {t("gettingNavigationOrigin")}
                </p>
              )}
              {locationError && (
                <div className="py-3">
                  <p className="mb-2 text-sm text-[var(--color-destructive)]">{t("navigationLocationError")}</p>
                  <button type="button" onClick={acquireOrigin} className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
                    <LocateFixed size={15} /> {t("retryLocation")}
                  </button>
                </div>
              )}
              {PROVIDERS.map(({ id, translationKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  disabled={!origin || locating}
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-surface2 px-3 py-2 text-left text-sm font-medium text-base disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Navigation size={17} aria-hidden="true" />
                  {t(translationKey)}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}