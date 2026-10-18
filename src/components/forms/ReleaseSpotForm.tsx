"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/store";
import { useGeolocation } from "@/hooks/useGeolocation";
import { VehicleSize, ParkingType, ZoneType, SpotSize, Spot, User } from "@/types";
import toast from "react-hot-toast";
import { MapPin, Car, Layers, AlignLeft, Clock, TimerReset, LoaderCircle } from "lucide-react";
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
  const [hasMoreSpots, setHasMoreSpots] = useState(false);
  const [moreSpotsCount, setMoreSpotsCount] = useState(1);

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
        body: JSON.stringify({ ...form, latitude: coords.lat, longitude: coords.lng, releaseDelayMinutes: form.isLeaving ? releaseDelay : 0, moreSpotsNearby: hasMoreSpots ? moreSpotsCount : 0 }),
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
          style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "16px" }}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <MapPin size={16} style={{ color: coords ? "#10B981" : "var(--muted)" }} />
          <span className="text-sm">
            {locLoading ? "…" : coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : t("allowLocation")}
          </span>
        </button>
        <input
          placeholder={t("locationExample")}
          value={form.locationDesc}
          onChange={(e) => toggle("locationDesc", e.target.value)}
          className="mt-2 w-full rounded-2xl border border-base bg-surface2 px-4 py-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
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
                style={form.isLeaving === val
                  ? val
                    ? { backgroundColor: "#FEF3C7", border: "1px solid #F59E0B", color: "#92400E", borderRadius: "16px" }
                    : { backgroundColor: "#DCFCE7", border: "1px solid #10B981", color: "#166534", borderRadius: "16px" }
                  : { backgroundColor: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "16px" }}
                className="flex-1 py-3 text-sm font-semibold transition-colors"
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
              style={form.vehicleSize === value
                  ? { backgroundColor: "#DBEAFE", border: "1px solid #3B82F6", color: "#1D4ED8", borderRadius: "12px" }
                  : { backgroundColor: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "12px" }}
                className="py-3 text-sm font-semibold transition-colors">
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
              style={form.zoneType === value
                  ? { backgroundColor: "#DBEAFE", border: "1px solid #3B82F6", color: "#1D4ED8", borderRadius: "12px" }
                  : { backgroundColor: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "12px" }}
                className="py-2.5 text-sm font-semibold transition-colors">
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
              style={form.spotSize === value
                  ? { backgroundColor: "#DBEAFE", border: "1px solid #3B82F6", color: "#1D4ED8", borderRadius: "12px" }
                  : { backgroundColor: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "12px" }}
                className="py-2.5 text-sm font-semibold transition-colors">
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* More spots nearby */}
      <section>
        <button
          type="button"
          role="switch"
          aria-checked={hasMoreSpots}
          onClick={() => setHasMoreSpots((v) => !v)}
          style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "16px" }}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold">{t("moreSpotsToggle")}</span>
          <span
            style={{ backgroundColor: hasMoreSpots ? "#10B981" : "var(--border)" }}
            className="relative h-6 w-11 rounded-full transition-colors"
          >
            <span
              style={{ transform: hasMoreSpots ? "translateX(20px)" : "translateX(0)" }}
              className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
            />
          </span>
        </button>
        {hasMoreSpots && (
          <div className="mt-2 flex items-center justify-between rounded-2xl border border-base bg-surface2 px-4 py-2">
            <span className="text-sm">{t("moreSpotsCount")}</span>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="-" onClick={() => setMoreSpotsCount((n) => Math.max(1, n - 1))} className="h-8 w-8 rounded-full border border-base text-lg font-bold">−</button>
              <span className="w-6 text-center text-sm font-bold">{moreSpotsCount}</span>
              <button type="button" aria-label="+" onClick={() => setMoreSpotsCount((n) => Math.min(99, n + 1))} className="h-8 w-8 rounded-full border border-base text-lg font-bold">+</button>
            </div>
          </div>
        )}
      </section>

      {/* Release delay: solo si el usuario indica que se va pronto */}
      {form.isLeaving && (
      <section>
        <label className="section-label"><TimerReset size={12} /> {t("releaseTime")}</label>
        <div className="grid gap-2">
          {timeOptions.map(({ value, label }) => (
            <button key={value} onClick={() => setReleaseDelay(value)}
              style={releaseDelay === value
                  ? { backgroundColor: "#DBEAFE", border: "1px solid #3B82F6", color: "#1D4ED8", borderRadius: "16px" }
                  : { backgroundColor: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "16px" }}
                className="py-3 text-sm font-semibold transition-colors">
              {label}
            </button>
          ))}
        </div>
      </section>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{ backgroundColor: "#10B981", color: "#FFFFFF", borderRadius: "16px", boxShadow: "0px 4px 16px rgba(16, 185, 129, 0.35)" }}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 px-6 py-4 text-base font-bold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <LoaderCircle size={18} className="animate-spin" /> : "⚡"}
        {t("broadcastSpot")}
      </button>
    </div>
  );
}
