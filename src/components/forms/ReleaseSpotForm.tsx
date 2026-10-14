"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/Button";
import { VehicleSize, ParkingType, ZoneType } from "@/types";
import toast from "react-hot-toast";
import { MapPin, Car, Layers, AlignLeft, Clock } from "lucide-react";

export function ReleaseSpotForm() {
  const router = useRouter();
  const { setCurrentSpot, setIsRadarActive, t } = useAppStore();
  const { coords, loading: locLoading, request: getLocation } = useGeolocation();

  const [form, setForm] = useState({
    locationDesc: "",
    notes: "",
    vehicleSize: "COMPACT" as VehicleSize,
    parkingType: "PARALLEL" as ParkingType,
    zoneType: "FREE" as ZoneType,
    isLeaving: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!coords) { toast.error(t("enableLocation")); getLocation(); return; }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/spots/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, latitude: coords.lat, longitude: coords.lng }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCurrentSpot(json.data);
      setIsRadarActive(true);
      toast.success(t("spotReleased", { n: json.pointsEarned }));
      router.push("/release/broadcasting");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (field: keyof typeof form, val: unknown) =>
    setForm((f) => ({ ...f, [field]: val }));

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      {/* Location */}
      <section>
        <label className="section-label"><MapPin size={12} /> {t("allowLocation")}</label>
        <button
          onClick={getLocation}
          className="w-full flex items-center gap-3 bg-surface2 border border-base rounded-2xl px-4 py-3 text-left"
        >
          <MapPin size={16} className={coords ? "text-accent" : "text-muted"} />
          <span className="text-sm">
            {locLoading ? "…" : coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : t("allowLocation")}
          </span>
        </button>
        <input
          type="text"
          placeholder="Ej: Frente al Edificio Azul, plaza #4"
          value={form.locationDesc}
          onChange={(e) => toggle("locationDesc", e.target.value)}
          className="mt-2 w-full bg-surface2 border border-base rounded-2xl px-4 py-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </section>

      {/* Notes */}
      <section>
        <label className="section-label"><AlignLeft size={12} /> {t("notes")}</label>
        <textarea
          rows={2}
          placeholder="Ej: Acera derecha, entre dos coches rojos…"
          value={form.notes}
          onChange={(e) => toggle("notes", e.target.value)}
          className="w-full bg-surface2 border border-base rounded-2xl px-4 py-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none resize-none"
        />
      </section>

      {/* Leaving soon toggle */}
      <section>
        <label className="section-label"><Clock size={12} /> {t("iAmLeaving")}</label>
        <div className="flex gap-3">
          {[false, true].map((val) => (
            <button
              key={String(val)}
              onClick={() => toggle("isLeaving", val)}
              className={`flex-1 rounded-2xl py-3 text-sm font-semibold border transition-colors ${
                form.isLeaving === val
                  ? val ? "bg-yellow-400 border-yellow-400 text-yellow-900" : "bg-accent border-accent text-[var(--accent-fg)]"
                  : "bg-surface2 border-base text-muted"
              }`}
            >
              {val ? `🟡 ${t("iAmLeaving")}` : `🟢 ${t("available")}`}
            </button>
          ))}
        </div>
      </section>

      {/* Vehicle */}
      <section>
        <label className="section-label"><Car size={12} /> {t("vehicleSize")}</label>
        <div className="grid grid-cols-3 gap-2">
          {(["COMPACT", "SUV", "VAN"] as VehicleSize[]).map((v) => (
            <button key={v} onClick={() => toggle("vehicleSize", v)}
              className={`rounded-xl py-3 text-sm font-semibold border transition-colors ${form.vehicleSize === v ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface2 border-base text-muted"}`}>
              {v[0] + v.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Zone */}
      <section>
        <label className="section-label"><Layers size={12} /> {t("zone")}</label>
        <div className="grid grid-cols-2 gap-2">
          {(["FREE", "METERED", "BLUE", "GREEN"] as ZoneType[]).map((z) => (
            <button key={z} onClick={() => toggle("zoneType", z)}
              className={`rounded-xl py-2.5 text-sm font-semibold border transition-colors ${form.zoneType === z ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface2 border-base text-muted"}`}>
              {z[0] + z.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </section>

      <Button size="lg" onClick={handleSubmit} loading={submitting}>
        ⚡ {t("broadcastSpot")}
      </Button>
    </div>
  );
}
