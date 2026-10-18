"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

export default function SignInPage() {
  const t = useAppStore((state) => state.t);
  const { status } = useSession();
  const router     = useRouter();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Si ya tiene sesión → al dashboard
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  if (status === "loading") {
    return <GlobalLoader />;
  }

  const handleSignIn = async () => {
    if (!email.trim()) { setError(t("enterEmail")); return; }
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        redirect: false,
      });

      if (result?.error || !result) {
        setError(t("signInFailed"));
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError(t("signInFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🅿️</div>
          <h1 className="font-display font-bold text-3xl">
            Spot<span className="text-accent">Sync</span>
          </h1>
          <p className="text-muted text-sm mt-2">{t("signInSubtitle")}</p>
        </div>

        {/* Email input */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">
              {t("yourEmail")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              placeholder="tu@email.com"
              className="w-full bg-surface border border-base rounded-2xl px-4 py-4 text-base focus:border-accent focus:outline-none placeholder:text-muted"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 pl-1">{error}</p>}
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full bg-accent text-[var(--accent-fg)] rounded-2xl px-5 py-4 font-display font-semibold text-base disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {loading
              ? <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : t("signInButton")
            }
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          {t("oauthNote")}
        </p>
      </div>
    </div>
  );
}