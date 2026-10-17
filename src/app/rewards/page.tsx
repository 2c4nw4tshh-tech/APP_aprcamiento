"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { RewardItem } from "@/types";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Zap } from "lucide-react";
import toast from "react-hot-toast";
import { safeFetchJson } from "@/lib/safe-fetch";
import { useSession } from "next-auth/react";

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

interface UserRewardsData {
  redemptions?: { itemId: string }[];
}

export default function RewardsPage() {
  const { update } = useSession();
  const { user, setUser, setAccentColor, t } = useAppStore();
  const [items, setItems]         = useState<RewardItem[]>([]);
  const [redeemed, setRedeemed]   = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadRewards = async () => {
      const [rewards, userInfo] = await Promise.all([
        safeFetchJson<ApiEnvelope<RewardItem[]>>("/api/rewards", {}, { data: [] }),
        safeFetchJson<ApiEnvelope<UserRewardsData | null>>("/api/users/me", {}, { data: null }),
      ]);
      if (!active) return;
      setItems(rewards.data.data ?? []);
      setRedeemed(new Set(userInfo.data.data?.redemptions?.map((redemption) => redemption.itemId) ?? []));
    };
    void loadRewards();
    return () => { active = false; };
  }, []);

  const handleRedeem = async (item: RewardItem) => {
    if ((user?.points ?? 0) < item.cost) { toast.error(t("notEnoughPoints")); return; }
    setLoading(item.id);
    try {
      const result = await safeFetchJson<ApiEnvelope<{
        points: number;
        accentColor?: string;
        customMarker?: string;
      }>>("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      }, { data: { points: user?.points ?? 0 } });
      if (!result.ok) throw new Error(result.error);
      const json = result.data;

      if (item.type === "accent_color") {
        setAccentColor(item.value);
      }

      if (user) {
        const updatedUser = {
          ...user,
          points: json.data.points,
          accentColor: json.data.accentColor ?? user.accentColor,
          customMarker: json.data.customMarker ?? user.customMarker,
        };
        setUser(updatedUser);
      }
      await update();
      setRedeemed((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      toast.success(`🎉 ${t("rewardActivated", { name: item.name })}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AuthGuard>
      <div className="fixed inset-0 flex flex-col bg-bg">
        <header className="pt-safe px-4 pt-4 pb-4 border-b border-base">
          <h1 className="font-display font-bold text-xl">{t("rewardsShop")}</h1>
          <p className="text-muted text-sm mt-0.5">{t("rewardsSubtitle")}</p>
        </header>

        {/* Points banner */}
        <div className="mx-4 mt-4 bg-accent/10 border border-accent/30 rounded-3xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">{t("yourPoints")}</p>
            <p className="font-display font-bold text-2xl text-accent">{user?.points ?? 0}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Zap size={22} className="text-accent" />
          </div>
        </div>

        {/* Earn tip */}
        <div className="mx-4 mt-3 bg-surface border border-base rounded-2xl px-4 py-3">
          <p className="text-xs text-muted">
            💡 {t("rewardEarnTip")}
          </p>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <h2 className="font-display font-semibold text-sm text-muted uppercase tracking-wide mb-3">
            {t("rewardsCatalog")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const owned = redeemed.has(item.id);
              const canAfford = (user?.points ?? 0) >= item.cost;
              const isColor = item.type === "accent_color";
              const isActive = isColor ? user?.accentColor === item.value : user?.customMarker === item.value;
              return (
                <div
                  key={item.id}
                  className="bg-surface border border-base rounded-3xl p-4 flex flex-col gap-3"
                >
                  {/* Preview swatch */}
                  <div
                    className="w-full h-14 rounded-2xl flex items-center justify-center text-3xl"
                    style={item.type === "accent_color"
                      ? { background: `${item.value}22`, border: `2px solid ${item.value}` }
                      : { background: "var(--surface2)", border: "2px solid var(--border)" }}
                  >
                    {item.emoji}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-display font-semibold text-sm">{item.name}</p>
                      {isActive && <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">{t("active")}</span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{item.description}</p>
                  </div>

                  <Button
                    size="sm"
                    variant={owned ? "ghost" : "primary"}
                    loading={loading === item.id}
                    disabled={owned || !canAfford}
                    onClick={() => handleRedeem(item)}
                    className={`text-xs ${owned ? "opacity-60" : !canAfford ? "opacity-40" : ""}`}
                    style={!owned && canAfford && isColor ? { background: item.value } : undefined}
                  >
                    {owned ? `✓ ${t("redeemed")}` : `🪙 ${item.cost} pts`}
                  </Button>
                </div>
              );
            })}
          </div>
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
