"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { useTheme } from "next-themes";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { Button } from "@/components/ui/Button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Language, Theme } from "@/types";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, setUser, setLanguage, setTheme: setStoreTheme, t } = useAppStore();
  const { setTheme, resolvedTheme } = useTheme();

  const [name, setName]           = useState(user?.name ?? "");
  const [lang, setLang]           = useState<Language>((user?.language as Language) ?? "es");
  const [theme, setThemeLocal]    = useState<Theme>((user?.theme as Theme) ?? "system");
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (user) { setName(user.name); setLang(user.language as Language); setThemeLocal(user.theme as Theme); }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("El nombre no puede estar vacío"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, language: lang, theme }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUser(json.data);
      setLanguage(lang);
      setStoreTheme(theme);
      setTheme(theme); // next-themes
      toast.success(t("save") + " ✓");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
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
              className="w-full bg-surface border border-base rounded-2xl px-4 py-4 text-base focus:border-accent focus:outline-none"
            />
          </section>

          {/* Language */}
          <section>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">{t("language")}</label>
            <div className="grid grid-cols-2 gap-3">
              {([["es", "🇪🇸", "Español"], ["en", "🇬🇧", "English"]] as [Language, string, string][]).map(([code, flag, label]) => (
                <button key={code} onClick={() => setLang(code)}
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
                <button key={val} onClick={() => { setThemeLocal(val); setTheme(val); }}
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

          <Button size="lg" onClick={handleSave} loading={saving}>{t("save")}</Button>
        </main>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
