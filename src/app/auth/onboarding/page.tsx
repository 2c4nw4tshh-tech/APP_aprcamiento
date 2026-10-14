"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Language } from "@/types";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { setLanguage, t } = useAppStore();
  const [name, setName] = useState("");
  const [lang, setLang] = useState<Language>("es");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Tu nombre es requerido"); return; }
    setSaving(true);
    try {
      const res  = await fetch("/api/users/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, language: lang }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setLanguage(lang);
      router.replace("/dashboard");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="font-display font-bold text-2xl">{t("welcome")}</h1>
          <p className="text-muted text-sm mt-2">{t("onboardingSubtitle")}</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">
              {t("yourName")}
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Oliver…"
              className="w-full bg-surface border border-base rounded-2xl px-4 py-4 text-base focus:border-accent focus:outline-none placeholder:text-muted"
            />
          </div>

          {/* Language */}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">
              {t("preferredLanguage")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([["es", "🇪🇸", t("spanish")], ["en", "🇬🇧", t("english")]] as [Language, string, string][]).map(([code, flag, label]) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold border transition-colors ${
                    lang === code ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-surface border-base text-muted"
                  }`}
                >
                  <span className="text-xl">{flag}</span> {label}
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" onClick={handleSave} loading={saving}>
            {t("continue")} →
          </Button>
        </div>
      </div>
    </div>
  );
}
