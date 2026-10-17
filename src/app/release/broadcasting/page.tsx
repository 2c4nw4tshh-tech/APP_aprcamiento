"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { Button } from "@/components/ui/Button";
import { CheckCircle, MapPin, Clock, Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function BroadcastingPage() {
  const router = useRouter();
  const { currentSpot, reset, t } = useAppStore();

  // Redirección segura en el navegador si no hay spot seleccionado
  useEffect(() => {
    if (!currentSpot) {
      router.push("/release");
    }
  }, [currentSpot, router]);

  const handleCancel = async () => {
    if (!currentSpot) return;
    await fetch(`/api/spots/${currentSpot.id}/cancel`, { method: "POST" });
    reset();
    toast(t("broadcastCanceled"));
    router.push("/dashboard");
  };

  if (!currentSpot) return null;

  return (
    <AuthGuard>
      <div className="fixed inset-0 flex flex-col bg-bg overflow-y-auto">
        <div className="flex-1 pt-safe px-4 py-8 flex flex-col items-center">
          {/* Success icon with pulse */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle size={48} className="text-accent" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-accent/30 radar-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-accent/20 radar-pulse-delay" />
          </div>

          <h1 className="font-display font-bold text-2xl text-center">{t("broadcasting")}!</h1>
          <p className="text-muted text-sm mt-2 text-center">{t("spotIsLive")}</p>

          {/* Spot info */}
          <div className="w-full max-w-sm mt-8 bg-surface border border-base rounded-3xl p-5 flex flex-col gap-4">
            {currentSpot.locationDesc && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">{currentSpot.locationDesc}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-muted flex-shrink-0" />
              <p className="text-sm text-muted">{t("autoExpires")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-accent flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-accent">{t("pointsEarned")}</span></p>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full max-w-sm mt-6 flex flex-col gap-3">
            <Button size="lg" onClick={() => router.push("/dashboard")}>
              {t("viewOnMap")}
            </Button>
            <Button size="lg" variant="danger" onClick={handleCancel}>
              {t("cancelBroadcast")}
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}