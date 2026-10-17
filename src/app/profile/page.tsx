"use client";
import { signOut } from "next-auth/react";
import { useAppStore } from "@/store";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Settings, LogOut, Star, Zap } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, t } = useAppStore();
  const u = user;

  return (
    <AuthGuard>
      <div className="fixed inset-0 flex flex-col bg-bg overflow-y-auto">
        <div className="pt-safe flex-1 pb-24">
          {/* Avatar */}
          <div className="flex flex-col items-center px-4 py-8 border-b border-base">
            <div className="w-20 h-20 rounded-full bg-surface2 border-2 border-accent overflow-hidden mb-3">
              {u?.image
                ? <img src={u.image} alt={u.name ?? ""} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center font-display font-bold text-3xl text-accent">{u?.name?.[0] ?? "?"}</div>
              }
            </div>
            <h1 className="font-display font-bold text-xl">{u?.name}</h1>
            <p className="text-muted text-sm">{u?.email}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-5">
              <div className="text-center">
                <p className="font-display font-bold text-accent text-xl flex items-center gap-1">
                  <Zap size={16} /> {u?.points ?? 0}
                </p>
                <p className="text-xs text-muted">{t("points")}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="font-display font-bold text-yellow-400 text-xl flex items-center gap-1">
                  <Star size={16} className="fill-yellow-400" />
                  {u?.karmaScore?.toFixed(1) ?? "5.0"}
                </p>
                <p className="text-xs text-muted">Karma</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="px-4 py-5 flex flex-col gap-3">
            <Link href="/settings" className="flex items-center gap-3 bg-surface border border-base rounded-2xl px-4 py-4">
              <Settings size={18} className="text-muted" />
              <span className="flex-1 text-sm font-medium">{t("settings")}</span>
              <span className="text-muted text-xs">›</span>
            </Link>
            <Link href="/rewards" className="flex items-center gap-3 bg-surface border border-base rounded-2xl px-4 py-4">
              <span className="text-lg">🎁</span>
              <span className="flex-1 text-sm font-medium">{t("rewardsShop")}</span>
              <span className="text-accent text-xs font-semibold">{u?.points ?? 0} pts</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="flex items-center gap-3 bg-surface border border-red-200 dark:border-red-900 rounded-2xl px-4 py-4 mt-2"
            >
              <LogOut size={18} className="text-red-500" />
              <span className="flex-1 text-sm font-medium text-red-500">{t("signOut")}</span>
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
