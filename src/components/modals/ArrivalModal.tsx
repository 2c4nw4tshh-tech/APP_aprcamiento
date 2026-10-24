"use client";

import { Check, Star, X } from "lucide-react";
import { useAppStore } from "@/store";

interface ArrivalModalProps {
  open: boolean;
  driverStars: number;
  ownerStars: number;
  onClose: () => void;
}

export function ArrivalModal({ open, driverStars, ownerStars, onClose }: ArrivalModalProps) {
  const t = useAppStore((state) => state.t);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/55 px-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="arrival-modal-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-base bg-surface p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label={t("closeDetails")} className="absolute right-3 top-3 rounded-full p-2 text-muted hover:bg-surface2">
          <X size={18} />
        </button>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <Check size={28} />
        </div>
        <h2 id="arrival-modal-title" className="font-display text-xl font-bold">{t("arrivalConfirmed")}</h2>
        <p className="mt-1 text-sm text-muted">{t("reservationCompleted")}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface2 px-3 py-3">
            <p className="flex items-center justify-center gap-1 font-display text-xl font-bold text-amber-500"><Star size={17} className="fill-current" /> +{driverStars}</p>
            <p className="mt-1 text-xs text-muted">{t("driverStarsEarned")}</p>
          </div>
          <div className="rounded-xl bg-surface2 px-3 py-3">
            <p className="flex items-center justify-center gap-1 font-display text-xl font-bold text-amber-500"><Star size={17} className="fill-current" /> +{ownerStars}</p>
            <p className="mt-1 text-xs text-muted">{t("ownerStarsEarned")}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white shadow-md ring-2 ring-[var(--color-primary)] ring-offset-1">
          {t("done")}
        </button>
      </section>
    </div>
  );
}