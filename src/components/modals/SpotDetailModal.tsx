"use client";
import { NearbySpot } from "@/types";
import { formatDistance, openInMaps } from "@/lib/gis";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { X, MapPin, Clock, Car, Navigation, AlertTriangle, Star } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  spot: NearbySpot;
  onClose: () => void;
  onOccupied: (id: string) => void;
}

const ZONE_LABEL: Record<string, Record<string, string>> = {
  es: { FREE: "Libre", METERED: "Parquímetro", BLUE: "Zona Azul", GREEN: "Zona Verde" },
  en: { FREE: "Free",  METERED: "Metered",     BLUE: "Blue Zone", GREEN: "Green Zone" },
};

export function SpotDetailModal({ spot, onClose, onOccupied }: Props) {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.language);
  const [reporting, setReporting] = useState(false);

  const zoneLabel = ZONE_LABEL[lang]?.[spot.zoneType] ?? spot.zoneType;
  const isOld = spot.minutesAgo > 30;

  const handleOccupied = async () => {
    setReporting(true);
    try {
      await fetch(`/api/spots/${spot.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "occupied" }),
      });
      toast.success(t("spotReported"));
      onOccupied(spot.id);
      onClose();
    } catch {
      toast.error("Error");
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface rounded-t-3xl border-t border-base p-5 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${spot.isLeaving ? "bg-yellow-400" : "bg-green-500"}`} />
              <span className="text-sm font-semibold">{spot.isLeaving ? t("iAmLeaving") : t("available")}</span>
            </div>
            <p className="text-base font-display font-bold text-lg mt-1 leading-tight">
              {spot.locationDesc || `${spot.latitude.toFixed(5)}, ${spot.longitude.toFixed(5)}`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted ml-3"><X size={20} /></button>
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
            { icon: Car,    label: spot.vehicleSize },
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
          <Button
            variant="danger"
            size="sm"
            onClick={handleOccupied}
            loading={reporting}
            className="flex-1"
          >
            {t("reportOccupied")}
          </Button>
          <Button
            size="sm"
            onClick={() => openInMaps(spot.latitude, spot.longitude, spot.locationDesc)}
            className="flex-1 flex items-center gap-2"
          >
            <Navigation size={14} />
            {t("navigateTo")}
          </Button>
        </div>
      </div>
    </div>
  );
}
