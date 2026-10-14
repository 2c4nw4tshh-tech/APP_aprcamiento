"use client";
import { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAppStore } from "@/store";
import { NearbySpot } from "@/types";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { SpotDetailModal } from "@/components/modals/SpotDetailModal";
import { formatDistance } from "@/lib/gis";
import { MapPin, Clock, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function FindPage() {
  const { coords, request: getLocation } = useGeolocation();
  const { nearbySpots, setNearbySpots, userLocation, t } = useAppStore();
  const [selected, setSelected] = useState<NearbySpot | null>(null);
  const [radius, setRadius]     = useState(500);
  const [loading, setLoading]   = useState(false);

  useEffect(() => { getLocation(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!userLocation) return;
    setLoading(true);
    fetch(`/api/spots/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`)
      .then((r) => r.json())
      .then((j) => { if (j.data) setNearbySpots(j.data); })
      .finally(() => setLoading(false));
  }, [userLocation, radius, setNearbySpots]);

  const handleOccupied = (id: string) => setNearbySpots(nearbySpots.filter((s) => s.id !== id));

  return (
    <AuthGuard>
      <div className="fixed inset-0 flex flex-col bg-bg">
        <header className="pt-safe px-4 pt-4 pb-3 bg-bg border-b border-base">
          <h1 className="font-display font-bold text-xl mb-3">{t("find")}</h1>
          <div className="flex items-center gap-2 bg-surface border border-base rounded-2xl px-4 py-3 mb-3">
            <Search size={15} className="text-muted" />
            <span className="text-sm text-muted">Buscar destino…</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Radio:</span>
            {[250, 500, 1000, 2000].map((r) => (
              <button key={r} onClick={() => setRadius(r)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${radius === r ? "bg-accent text-[var(--accent-fg)]" : "bg-surface border border-base text-muted"}`}>
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-3">
          {loading ? (
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
                  <span className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${spot.isLeaving ? "bg-yellow-400" : "bg-green-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {spot.locationDesc || `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                      <span className="flex items-center gap-1"><Clock size={11} />{spot.minutesAgo}min</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{formatDistance(spot.distance)}</span>
                    </div>
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

        {selected && (
          <SpotDetailModal spot={selected} onClose={() => setSelected(null)} onOccupied={handleOccupied} />
        )}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
