"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { Check, ChevronLeft, Smile } from "lucide-react";
import Link from "next/link";
import { Language, Theme } from "@/types";
import toast from "react-hot-toast";
import { safeFetchJson } from "@/lib/safe-fetch";

interface UnlockedReward {
  itemId: string;
  item: {
    id: string;
    name: string;
    description: string;
    type: string;
    value: string;
    emoji: string;
  };
}

interface SettingsUser {
  id: string;
  email: string;
  name: string;
  language: Language;
  theme: Theme;
  accentColor: string;
  customMarker?: string;
  points: number;
  redemptions?: UnlockedReward[];
}

export default function SettingsPage() {
  const { update } = useSession();
  const { user, setUser, setLanguage, setTheme: setStoreTheme, t } = useAppStore();
  const { theme: providerTheme, setTheme, resolvedTheme } = useTheme();

  const [name, setName]           = useState(user?.name ?? "");
  const [unlocked, setUnlocked] = useState<UnlockedReward[]>([]);
  const [activating, setActivating] = useState<string | null>(null);
  const lang = useAppStore((state) => state.language);
  const theme = (providerTheme === "light" || providerTheme === "dark" || providerTheme === "system"
    ? providerTheme
    : user?.theme === "light" || user?.theme === "dark" || user?.theme === "system"
      ? user.theme
      : "system") as Theme;

  useEffect(() => {
    if (user) setName(user.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    if (user?.theme && providerTheme !== user.theme) setTheme(user.theme);
  }, [user?.theme, providerTheme, setTheme]);

  useEffect(() => {
    let active = true;
    const loadUnlocked = async () => {
      const result = await safeFetchJson<{ data: SettingsUser | null }>("/api/users/me", {}, { data: null });
      if (active && result.ok) setUnlocked(result.data.data?.redemptions ?? []);
    };
    void loadUnlocked();
    return () => { active = false; };
  }, []);

  const persistUser = async (changes: Record<string, unknown>) => {
    const result = await safeFetchJson<{ data: SettingsUser; error?: string }>("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    }, { data: user as SettingsUser });
    if (!result.ok || !result.data.data) throw new Error(result.data.error ?? result.error ?? "No se pudo guardar el cambio.");
    setUser(result.data.data as typeof user);
    await update();
  };

  const handleLanguageChange = async (nextLanguage: Language) => {
    const previousLanguage = lang;
    setLanguage(nextLanguage);
    if (user) setUser({ ...user, language: nextLanguage });
    try {
      await persistUser({ language: nextLanguage });
    } catch (error) {
      setLanguage(previousLanguage);
      if (user) setUser({ ...user, language: previousLanguage });
      toast.error((error as Error).message);
    }
  };

  const handleThemeChange = async (nextTheme: Theme) => {
    // ThemeProvider and Zustand persist this preference locally; do not gate it on server auth.
    setTheme(nextTheme);
    setStoreTheme(nextTheme);
    if (user) setUser({ ...user, theme: nextTheme });
  };

  const activateReward = async (itemId: string) => {
    const selectedReward = unlocked.find((redemption) => redemption.itemId === itemId)?.item;
    if (!selectedReward || selectedReward.type === "accent_color" || !user) return;

    const previousUser = user;
    const optimisticUser = { ...user, customMarker: selectedReward.value };
    setUser(optimisticUser);
    setActivating(itemId);
    try {
      const result = await safeFetchJson<{ data: SettingsUser; error?: string }>("/api/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      }, { data: user as SettingsUser });
      if (!result.ok || !result.data.data) throw new Error(result.data.error ?? result.error ?? "No se pudo aplicar el premio.");
      setUser(result.data.data as typeof user);
      await update();
      toast.success(t("preferenceApplied"));
    } catch (error) {
      setUser(previousUser);
      toast.error((error as Error).message);
    } finally {
      setActivating(null);
    }
  };

  const saveName = async () => {
    const nextName = name.trim();
    if (!nextName || nextName === user?.name) return;
    try {
      await persistUser({ name: nextName });
      toast.success(t("nameUpdated"));
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <AuthGuard>
      <div className="fixed inset-0 flex flex-col bg-bg overflow-y-auto">
        <header className="pt-safe flex items-center gap-3 px-4 py-4 border-b border-base sticky top-0 bg-bg z-10">
          <Link href="/profile" className="text-muted"><ChevronLeft size={22} /></Link>
          <h1 className="font-display font-bold text-lg">{t("settings")}</h1>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 flex flex-col gap-6">
          {/* Name */}
          <section>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">{t("name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              className="w-full bg-surface border border-base rounded-2xl px-4 py-4 text-base focus:border-accent focus:outline-none"
            />
          </section>

          {/* Language */}
          <section>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">{t("language")}</label>
            <div className="grid grid-cols-1 gap-3">
              {([['es', '🇪🇸', 'Español'], ['en', '🇬🇧', 'English']] as [Language, string, string][]).map(([code, flag, label]) => (
                <button key={code} onClick={() => void handleLanguageChange(code)}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold border transition-colors ${lang === code ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface border-base text-muted"}`}>
                  <span className="text-xl">{flag}</span> {label}
                </button>
              ))}
            </div>
          </section>

          {/* Theme */}
          <section>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">{t("theme")}</label>
            <div className="grid grid-cols-3 gap-2">
              {([["light", "☀️", t("themeLight")], ["dark", "🌙", t("themeDark")], ["system", "⚙️", t("themeSystem")]] as [Theme, string, string][]).map(([val, icon, label]) => (
                <button key={val} onClick={() => void handleThemeChange(val)}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-4 text-sm font-semibold border transition-colors ${theme === val ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface border-base text-muted"}`}>
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-2 text-center">
              Modo actual: {resolvedTheme === "dark" ? "🌙 Oscuro" : "☀️ Claro"}
            </p>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">{t("unlockedRewards")}</h2>
            {unlocked.filter((redemption) => redemption.item.type !== "accent_color").length === 0 ? (
              <p className="rounded-2xl border border-base bg-surface px-4 py-5 text-center text-sm text-muted">
                {t("noUnlockedRewards")}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-base border-y border-base">
                {Array.from(new Map(unlocked.filter((redemption) => redemption.item.type !== "accent_color").map((redemption) => [redemption.itemId, redemption.item])).values()).map((item) => {
                  const isActive = user?.customMarker === item.value;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void activateReward(item.id)}
                      disabled={activating !== null}
                      className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-60"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-base text-xl"
                        style={{ background: "var(--surface2)" }}
                      >
                        {item.value || item.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.name}</span>
                        <span className="block truncate text-xs text-muted">{t("spotEmoji")}</span>
                      </span>
                      {isActive ? <Check size={18} className="text-accent" /> : <Smile size={17} className="text-muted" />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
