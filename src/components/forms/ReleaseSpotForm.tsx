"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/Button";
import { VehicleSize, ParkingType, ZoneType, SpotSize, Spot, User } from "@/types";
import toast from "react-hot-toast";
import { MapPin, Car, Layers, AlignLeft, Clock, TimerReset } from "lucide-react";
import { safeFetchJson } from "@/lib/safe-fetch";

export function ReleaseSpotForm() {
  const router = useRouter();
  const { update } = useSession();
  const { user, setUser, setCurrentSpot, setIsRadarActive, t } = useAppStore();
  const { coords, loading: locLoading, request: getLocation } = useGeolocation();

  const [form, setForm] = useState({
    locationDesc: "",
    notes: "",
    vehicleSize: "COMPACT" as VehicleSize,
    spotSize: "MEDIUM" as SpotSize,
    parkingType: "PARALLEL" as ParkingType,
    zoneType: "FREE" as ZoneType,
    isLeaving: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [releaseDelay, setReleaseDelay] = useState<number>(0);

  const vehicleOptions: { value: VehicleSize; label: string }[] = [
    { value: "MOTO", label: t("motorcycle") },
    { value: "COMPACT", label: t("car") },
    { value: "SUV", label: t("fourByFour") },
    { value: "VAN", label: t("van") },
  ];

  const zoneOptions: { value: ZoneType; label: string }[] = [
    { value: "FREE", label: t("freeZone") },
    { value: "BLUE", label: t("blueZone") },
    { value: "GREEN", label: t("greenZone") },
  ];

  const spotSizeOptions: { value: SpotSize; label: string }[] = [
    { value: "SMALL", label: t("smallSpot") },
    { value: "MEDIUM", label: t("mediumSpot") },
    { value: "LARGE", label: t("largeSpot") },
  ];

  const timeOptions = [
    { value: 0, label: t("availableNow") },
    { value: 5, label: t("releasingIn", { n: 5 }) },
    { value: 10, label: t("releasingIn", { n: 10 }) },
  ];

  const handleSubmit = async () => {
    if (!coords) { toast.error(t("enableLocation")); getLocation(); return; }
    setSubmitting(true);
    try {
      const result = await safeFetchJson<{ data?: Spot; pointsEarned?: number; user?: User; error?: string }>("/api/spots/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, latitude: coords.lat, longitude: coords.lng, releaseDelayMinutes: releaseDelay }),
      }, {});
      const releasedSpot = result.data.data;
      if (!result.ok || !releasedSpot) throw new Error(result.data.error ?? result.error ?? "No se pudo publicar la plaza.");
      const json = result.data;
      setCurrentSpot(releasedSpot);
      if (json.user) setUser(json.user);
      else if (user) setUser({ ...user, points: user.points + (json.pointsEarned ?? 10) });
      await update();
      setIsRadarActive(true);
      toast.success(t("spotReleased", { n: json.pointsEarned ?? 10 }));
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
          placeholder={t("locationExample")}
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
          placeholder={t("notesExample")}
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
        <div className="grid grid-cols-2 gap-2">
          {vehicleOptions.map(({ value, label }) => (
            <button key={value} onClick={() => toggle("vehicleSize", value)}
              className={`rounded-xl py-3 text-sm font-semibold border transition-colors ${form.vehicleSize === value ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface2 border-base text-muted"}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Zone */}
      <section>
        <label className="section-label"><Layers size={12} /> {t("zone")}</label>
        <div className="grid grid-cols-3 gap-2">
          {zoneOptions.map(({ value, label }) => (
            <button key={value} onClick={() => toggle("zoneType", value)}
              className={`rounded-xl py-2.5 text-sm font-semibold border transition-colors ${form.zoneType === value ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface2 border-base text-muted"}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Plaza size */}
      <section>
        <label className="section-label"><Layers size={12} /> {t("spotSize")}</label>
        <div className="grid grid-cols-3 gap-2">
          {spotSizeOptions.map(({ value, label }) => (
            <button key={value} onClick={() => toggle("spotSize", value)}
              className={`rounded-xl py-2.5 text-sm font-semibold border transition-colors ${form.spotSize === value ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface2 border-base text-muted"}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Release delay */}
      <section>
        <label className="section-label"><TimerReset size={12} /> {t("releaseTime")}</label>
        <div className="grid gap-2">
          {timeOptions.map(({ value, label }) => (
            <button key={value} onClick={() => setReleaseDelay(value)}
              className={`rounded-2xl py-3 text-sm font-semibold border transition-colors ${releaseDelay === value ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface2 border-base text-muted"}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <Button variant="success" size="lg" onClick={handleSubmit} loading={submitting} className="min-h-14 rounded-2xl text-base font-bold">
        ⚡ {t("broadcastSpot")}
      </Button>
    </div>
  );
}
