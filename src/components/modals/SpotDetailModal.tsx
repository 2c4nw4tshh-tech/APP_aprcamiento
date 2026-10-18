"use client";
import { NearbySpot } from "@/types";
import { formatDistance } from "@/lib/gis";
import { useAppStore } from "@/store";
import { NudgeBanner } from "@/components/ui/NudgeBanner";
import { X, MapPin, Clock, Car, AlertTriangle, Star, Route } from "lucide-react";
import { useState } from "react";
import { NavigationChooser } from "@/components/ui/NavigationChooser";
import { SpotActionButton } from "@/components/map/SpotActionButton";

interface Props {
  spot: NearbySpot;
  onClose: () => void;
  onOccupied: (id: string) => void;
  onNavigateInApp?: () => void;
  onRouteStarted?: (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => void;
}

const ZONE_LABEL: Record<string, Record<string, string>> = {
  es: { FREE: "Zona Gratis", BLUE: "Zona Azul", GREEN: "Zona Verde" },
  en: { FREE: "Free", BLUE: "Blue Zone", GREEN: "Green Zone" },
};

export function SpotDetailModal({ spot, onClose, onOccupied, onNavigateInApp, onRouteStarted }: Props) {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.language);
  const [showShareNudge, setShowShareNudge] = useState(true);

  const zoneLabel = ZONE_LABEL[lang]?.[spot.zoneType] ?? spot.zoneType;
  const vehicleLabel = spot.vehicleSize === "MOTO" ? t("motorcycle") : spot.vehicleSize === "COMPACT" ? t("car") : spot.vehicleSize === "SUV" ? t("fourByFour") : t("van");
  const isOld = spot.minutesAgo > 30;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-base bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: spot.isLeaving ? "#FACC15" : "#10B981" }}
              />
              <span className="text-sm font-semibold">{spot.isLeaving ? t("iAmLeaving") : t("available")}</span>
            </div>
            <p className="text-base font-display font-bold text-lg mt-1 leading-tight">
              {spot.locationDesc || `${spot.latitude.toFixed(5)}, ${spot.longitude.toFixed(5)}`}
            </p>
          </div>
          <button onClick={onClose} aria-label={t("closeDetails")} className="text-muted ml-3 rounded-full p-1 hover:bg-surface2 transition-colors"><X size={20} /></button>
        </div>

        {/* Time warning */}
        {isOld && (
          <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl px-4 py-2.5 mb-4">
            <AlertTriangle size={14} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">{t("likelyOccupied")}</p>
          </div>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: Clock,  label: spot.minutesAgo < 60 ? t("minutesAgo", { n: spot.minutesAgo }) : t("hoursAgo", { n: Math.floor(spot.minutesAgo / 60) }) },
            { icon: MapPin, label: formatDistance(spot.distance) },
            { icon: Car,    label: vehicleLabel },
            { icon: Star,   label: zoneLabel },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2 bg-surface2 rounded-xl px-3 py-2">
              <Icon size={13} className="text-muted" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {spot.notes && (
          <div className="bg-surface2 rounded-2xl px-4 py-3 mb-4">
            <p className="text-xs text-muted mb-1">{t("notes")}</p>
            <p className="text-sm">{spot.notes}</p>
          </div>
        )}

        {/* Leaver */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-surface2 border border-base overflow-hidden flex-shrink-0">
            {spot.leaver.image
              ? <img src={spot.leaver.image} alt={spot.leaver.name} className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-accent font-bold">{spot.leaver.name[0]}</span>
            }
          </div>
          <div>
            <p className="text-sm font-semibold">{spot.leaver.name}</p>
            <p className="text-xs text-muted flex items-center gap-1">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              {spot.leaver.karmaScore.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SpotActionButton
              spotId={spot.id}
              latitude={spot.latitude}
              longitude={spot.longitude}
              onCompleted={() => onOccupied(spot.id)}
              onRouteStarted={onRouteStarted}
            />
          </div>
          <NavigationChooser
            latitude={spot.latitude}
            longitude={spot.longitude}
            label={spot.locationDesc}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold"
          />
        </div>
        {onNavigateInApp && (
          <button
            type="button"
            onClick={onNavigateInApp}
            style={{ backgroundColor: "#3B82F6", color: "#FFFFFF", borderRadius: "16px", boxShadow: "0px 4px 16px rgba(59, 130, 246, 0.35)" }}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
          >
            <Route size={15} /> {t("navigateInApp")}
          </button>
        )}

        {showShareNudge && (
          <div className="mt-4">
            <NudgeBanner
              title={t("shareCommunity")}
              message={t("shareCommunityMessage")}
              closeLabel={t("closeNotice")}
              onClose={() => setShowShareNudge(false)}
            />
          </div>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-muted text-center">
          {t("availabilityWarning")}
        </p>
      </div>

    </div>
  );
}
