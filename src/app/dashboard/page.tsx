"use client";
import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAppStore } from "@/store";
import { NearbySpot } from "@/types";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { SpotDetailModal } from "@/components/modals/SpotDetailModal";
import { Button } from "@/components/ui/Button";
import { NudgeBanner } from "@/components/ui/NudgeBanner";
import { RefreshCw } from "lucide-react";
import { fetchNearbySpots } from "@/lib/spots-api";
import { LatLng } from "@/types/navigation";

const SpotMap = dynamic(
  () => import("@/components/map/SpotMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg text-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-sm text-muted">{useAppStore.getState().t("mapPreparing")}</p>
      </div>
    ),
  }
);

interface DashboardBoundaryState {
  hasError: boolean;
  retryKey: number;
}

interface DashboardRouteDestination extends LatLng {
  label?: string;
}

class DashboardErrorBoundary extends Component<{ children: ReactNode }, DashboardBoundaryState> {
  state: DashboardBoundaryState = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(): Partial<DashboardBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error al renderizar el dashboard:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fixed inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <p className="font-display text-lg font-semibold">{useAppStore.getState().t("mapLoadFailed")}</p>
          <p className="max-w-sm text-sm text-muted">{useAppStore.getState().t("dashboardError")}</p>
          <Button onClick={() => this.setState((state) => ({ hasError: false, retryKey: state.retryKey + 1 }))}>
            {useAppStore.getState().t("retryMap")}
          </Button>
        </main>
      );
    }

    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}

function DashboardContent() {
  const { coords, loading: locationLoading, request: getLocation, error: geoError } = useGeolocation();
  const { nearbySpots, setNearbySpots, userLocation, t } = useAppStore();
  const [selected, setSelected] = useState<NearbySpot | null>(null);
  const [loading, setLoading]   = useState(false);
  const [radarActive, setRadarActive] = useState(false);
  const [showNudge, setShowNudge] = useState(true);
  const [locationRequested, setLocationRequested] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState<DashboardRouteDestination | null>(null);
  const [navigationOrigin, setNavigationOrigin] = useState<LatLng | null>(null);

  useEffect(() => {
    getLocation();
    setLocationRequested(true);
  }, []); // eslint-disable-line

  const fetchSpots = async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const spots = await fetchNearbySpots(`/api/spots/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=600`);
      setNearbySpots(spots);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSpots(); }, [userLocation]); // eslint-disable-line

  const handleOccupied = (id: string) => {
    setNearbySpots(nearbySpots.filter((s) => s.id !== id));
    setSelected(null);
  };

  const handleRadar = async () => {
    if (!userLocation) return;
    setRadarActive(true);
    try {
      const spots = await fetchNearbySpots(`/api/spots/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=300`);
      const count = spots.length;
      if (count > 0) {
        window.alert(t("radarFound", { n: count }));
      } else {
        window.alert(t("radarEmpty"));
      }
    } finally {
      setTimeout(() => setRadarActive(false), 1800);
    }
  };

  return (
    <AuthGuard>
      <div style={{ position: "fixed", inset: 0, background: "var(--bg)" }}>

        <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {coords ? (
            <SpotMap
              center={[coords.lat, coords.lng]}
              spots={nearbySpots}
              onSpotClick={setSelected}
              locationWarning={geoError ?? undefined}
              navigationOrigin={navigationOrigin ?? coords}
              navigationDestination={navigationDestination}
              navigationLabel={navigationDestination?.label}
              onClearNavigation={() => setNavigationDestination(null)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
              {locationLoading || !locationRequested ? (
                <>
                  <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  <p className="text-sm text-muted">{t("locationSearching")}</p>
                </>
              ) : (
                <>
                  <p className="max-w-sm text-sm leading-relaxed text-muted">
                    {geoError ?? t("dashboardEnableLocation")}
                  </p>
                  <Button onClick={getLocation} size="sm">{t("allowLocation")}</Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* HUD superior */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, padding: "12px 16px", pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontFamily: "var(--font-grotesk, sans-serif)",
              fontWeight: 700,
              fontSize: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "6px 14px",
              pointerEvents: "auto",
            }}>
              Spot<span style={{ color: "var(--accent)" }}>Sync</span>
            </span>
            <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
              <button
                onClick={fetchSpots}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "50%",
                  width: 40, height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={16} style={{ color: loading ? "var(--accent)" : "var(--muted)", animation: loading ? "spin 1s linear infinite" : "none" }} />
              </button>
              <span style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--accent)",
              }}>
                {t("spotsAvailable", { n: nearbySpots.length })}
              </span>
            </div>
          </div>
        </div>

        {showNudge && (
          <div style={{ position: "fixed", top: 68, left: 16, right: 16, zIndex: 1100 }}>
            <NudgeBanner
              title={t("reminderTitle")}
              message={t("reminderMessage")}
              closeLabel={t("closeNotice")}
              onClose={() => setShowNudge(false)}
            />
          </div>
        )}

        <button
          onClick={handleRadar}
          className={`fixed bottom-24 right-4 z-[1100] flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-bold text-[var(--accent-fg)] shadow-lg transition-all ${radarActive ? "scale-105 ring-4 ring-accent/30" : ""}`}
        >
          <span className="text-base">📡</span>
          {t("radarSearch")}
        </button>

        {/* Leyenda */}
        <div style={{
          position: "fixed", bottom: 80, left: 16, zIndex: 1000,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "8px 12px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            {t("available")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FACC15", display: "inline-block" }} />
            {t("leavingSoon")}
          </div>
        </div>

        {selected && (
          <SpotDetailModal
            spot={selected}
            onClose={() => setSelected(null)}
            onOccupied={handleOccupied}
            onNavigateInApp={() => {
              setNavigationOrigin(coords);
              setNavigationDestination({ lat: selected.latitude, lng: selected.longitude, label: selected.locationDesc });
              setSelected(null);
            }}
            onRouteStarted={(origin, destination) => {
              setNavigationOrigin(origin);
              setNavigationDestination({ ...destination, label: selected.locationDesc });
            }}
          />
        )}

        <BottomNav />
      </div>
    </AuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  );
}