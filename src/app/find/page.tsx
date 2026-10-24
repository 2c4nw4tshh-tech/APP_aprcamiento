"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAppStore } from "@/store";
import { Coordinates, NearbySpot, VehicleSize, ZoneType, SpotSize } from "@/types";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { SpotDetailModal } from "@/components/modals/SpotDetailModal";
import { formatCountdown, formatDistance } from "@/lib/gis";
import { MapPin, Clock, AlertTriangle, Search, Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchNearbySpots } from "@/lib/spots-api";
import { safeFetchJson } from "@/lib/safe-fetch";
import { NavigationChooser } from "@/components/ui/NavigationChooser";

const SpotMap = dynamic(() => import("@/components/map/SpotMap"), { ssr: false });
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface GeocodingFeature {
  id: string;
  place_name: string;
  center: [number, number];
}

interface GeocodingResponse {
  features?: GeocodingFeature[];
}

interface Destination extends Coordinates {
  label: string;
}

export default function FindPage() {
  const { coords, request: getLocation, requestIfGranted, error: geoError } = useGeolocation();
  const { nearbySpots, setNearbySpots, userLocation, language, t } = useAppStore();
  const [selected, setSelected] = useState<NearbySpot | null>(null);
  const [radius, setRadius] = useState(500);
  const [loading, setLoading] = useState(false);
  const [vehicleFilters, setVehicleFilters] = useState<VehicleSize[]>(["COMPACT", "MOTO", "VAN"]);
  const [zoneFilters, setZoneFilters] = useState<ZoneType[]>(["FREE", "BLUE", "GREEN"]);
  const [sizeFilters, setSizeFilters] = useState<SpotSize[]>(["SMALL", "MEDIUM", "LARGE"]);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destination, setDestination] = useState<Destination | null>(null);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  useEffect(() => {
    const query = destinationQuery.trim();
    if (destination && query === destination.label) {
      setSuggestions([]);
      setSearchingAddress(false);
      return;
    }
    if (query.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      setSearchingAddress(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearchingAddress(true);
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        autocomplete: "true",
        limit: "5",
        language,
      });
      const result = await safeFetchJson<GeocodingResponse>(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`,
        {},
        { features: [] },
      );
      if (!active) return;
      const features = result.data.features ?? [];
      setSuggestions(features.map((feature) => ({
        label: feature.place_name,
        lng: feature.center[0],
        lat: feature.center[1],
      })));
      setSearchingAddress(false);
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [destinationQuery, destination, language]);

  const toggleMulti = <T extends string>(value: T, selected: T[], setSelected: (next: T[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  useEffect(() => { requestIfGranted(); }, []); // eslint-disable-line

  useEffect(() => {
    const reference = destination ?? userLocation ?? coords;
    if (!reference) return;
    setLoading(true);

    const params = new URLSearchParams({
      lat: String(reference.lat),
      lng: String(reference.lng),
      radius: String(radius),
    });
    vehicleFilters.forEach((vehicle) => params.append("vehicle", vehicle));
    zoneFilters.forEach((zone) => params.append("zone", zone));
    sizeFilters.forEach((size) => params.append("size", size));

    fetchNearbySpots(`/api/spots/nearby?${params.toString()}`)
      .then(setNearbySpots)
      .finally(() => setLoading(false));
  }, [userLocation, coords, destination, radius, vehicleFilters, zoneFilters, sizeFilters, setNearbySpots]);

  const selectDestination = (nextDestination: Destination) => {
    setDestination(nextDestination);
    setDestinationQuery(nextDestination.label);
    setSuggestions([]);
  };

  const selectMapPoint = (latitude: number, longitude: number) => {
    selectDestination({ lat: latitude, lng: longitude, label: t("mapPoint") });
    setMapPickerOpen(false);
  };

  const handleOccupied = (id: string) => setNearbySpots(nearbySpots.filter((s) => s.id !== id));
  const hasSearchReference = Boolean(destination || userLocation || coords);

  return (
    <AuthGuard>
      <div className="fixed inset-0 flex flex-col bg-bg">
        <header className="pt-safe px-4 pt-4 pb-3 bg-bg border-b border-base">
          <h1 className="font-display font-bold text-xl mb-3">{t("find")}</h1>
          <div className="relative mb-2">
            <div className="flex items-center gap-2 bg-surface border border-base rounded-2xl px-4 py-3">
              <Search size={15} className="text-muted shrink-0" />
              <input
                type="search"
                value={destinationQuery}
                onChange={(event) => {
                  setDestinationQuery(event.target.value);
                  setDestination(null);
                }}
                placeholder={t("searchAddressPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                aria-label={t("searchAddressPlaceholder")}
              />
              {destinationQuery && (
                <button type="button" onClick={() => { setDestinationQuery(""); setDestination(null); }} aria-label={t("clearSearch")} className="text-muted">
                  <X size={16} />
                </button>
              )}
            </div>
            {!(destination && destinationQuery === destination.label) && (searchingAddress || suggestions.length > 0 || destinationQuery.trim().length >= 3) && (
              <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-base bg-surface shadow-xl">
                {searchingAddress ? (
                  <p className="px-4 py-3 text-sm text-muted">{t("searchingAddresses")}</p>
                ) : suggestions.length > 0 ? suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                    type="button"
                    onClick={() => selectDestination(suggestion)}
                    className="flex w-full items-start gap-2 border-b border-base px-4 py-3 text-left text-sm last:border-0 hover:bg-surface2"
                  >
                    <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
                    <span>{suggestion.label}</span>
                  </button>
                )) : destinationQuery.trim().length >= 3 ? (
                  <p className="px-4 py-3 text-sm text-muted">{t("noAddressResults")}</p>
                ) : null}
              </div>
            )}
          </div>
          <div className="mb-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setMapPickerOpen(true)} className="flex-1 justify-center">
              <Crosshair size={14} /> {t("selectOnMap")}
            </Button>
            {destination && (
              <button type="button" onClick={() => { setDestination(null); setDestinationQuery(""); }} className="rounded-xl border border-base px-3 text-xs font-semibold text-muted">
                {t("useMyLocation")}
              </button>
            )}
          </div>
          {destination && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-accent/10 px-3 py-2">
              <p className="min-w-0 truncate text-xs font-medium">{t("searchingAround", { place: destination.label })}</p>
              <NavigationChooser
                latitude={destination.lat}
                longitude={destination.lng}
                label={destination.label}
                buttonLabel={t("navigateTo")}
                className="flex shrink-0 items-center gap-1 px-2 py-1 text-xs font-medium"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{t("radius")}</span>
            {[250, 500, 1000, 2000].map((r) => (
              <button key={r} onClick={() => setRadius(r)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${radius === r ? "bg-accent text-[var(--accent-fg)]" : "bg-surface border border-base text-muted"}`}>
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {(["COMPACT", "MOTO", "VAN"] as VehicleSize[]).map((value) => (
                <button key={value} onClick={() => toggleMulti(value, vehicleFilters, setVehicleFilters)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${vehicleFilters.includes(value) ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface border-base text-muted"}`}>
                  {value === "COMPACT" ? t("car") : value === "MOTO" ? t("motorcycle") : t("van")}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["FREE", "BLUE", "GREEN"] as ZoneType[]).map((value) => (
                <button key={value} onClick={() => toggleMulti(value, zoneFilters, setZoneFilters)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${zoneFilters.includes(value) ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface border-base text-muted"}`}>
                  {value === "FREE" ? t("freeZone") : value === "BLUE" ? t("blueZone") : t("greenZone")}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["SMALL", "MEDIUM", "LARGE"] as SpotSize[]).map((value) => (
                <button key={value} onClick={() => toggleMulti(value, sizeFilters, setSizeFilters)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${sizeFilters.includes(value) ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface border-base text-muted"}`}>
                  {value === "SMALL" ? t("smallSpot") : value === "MEDIUM" ? t("mediumSpot") : t("largeSpot")}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-3">
          {!hasSearchReference ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="text-5xl mb-4">📍</div>
              <p className="font-display font-semibold">{geoError ?? t("dashboardEnableLocation")}</p>
              <Button onClick={() => getLocation()} size="sm" className="mt-4">{t("allowLocation")}</Button>
            </div>
          ) : loading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-28 bg-surface rounded-3xl animate-pulse" />)
          ) : nearbySpots.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="text-5xl mb-4">🅿️</div>
              <p className="font-display font-semibold">{t("noSpotsNearby")}</p>
              <p className="text-muted text-sm mt-1">{t("checkLater")}</p>
            </div>
          ) : (
            nearbySpots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => setSelected(spot)}
                className="w-full text-left bg-surface border border-base rounded-3xl p-4 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ${spot.isLeaving ? "bg-amber-400" : "bg-[var(--color-success)]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {spot.locationDesc || `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                      <span className="flex items-center gap-1"><Clock size={11} />{spot.minutesAgo}{t("minutesShort")}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{formatDistance(spot.distance)}</span>
                    </div>
                    {(spot.countdownMinutes ?? 0) > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        <Clock size={10} />{formatCountdown(spot.countdownMinutes ?? 0)}
                      </div>
                    )}
                    {spot.minutesAgo > 30 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        <AlertTriangle size={11} />{t("likelyOccupied")}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </main>

        {mapPickerOpen && (
          <div className="fixed inset-0 z-[70] flex flex-col bg-bg p-3 pt-safe">
            <header className="flex items-center justify-between gap-3 border-b border-base py-2">
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold">{t("selectOnMap")}</h2>
                <p className="text-xs text-muted">{t("tapMapToChoose")}</p>
              </div>
              <button type="button" onClick={() => setMapPickerOpen(false)} aria-label={t("cancel")} className="rounded-full p-2 text-muted hover:bg-surface2">
                <X size={19} />
              </button>
            </header>
            <div className="min-h-0 flex-1 py-3">
              <SpotMap
                center={[
                  destination?.lat ?? userLocation?.lat ?? coords?.lat ?? 40.416775,
                  destination?.lng ?? userLocation?.lng ?? coords?.lng ?? -3.70379,
                ]}
                spots={[]}
                pickMode
                onMapPick={selectMapPoint}
              />
            </div>
          </div>
        )}

        {selected && (
          <SpotDetailModal spot={selected} onClose={() => setSelected(null)} onOccupied={handleOccupied} />
        )}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
