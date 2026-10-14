"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignInPage() {
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
    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSignIn = async () => {
    if (!email.trim()) { setError("Introduce tu email para continuar"); return; }
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.trim(),
      redirect: false, // manejamos la redirección manualmente
    });

    if (result?.error) {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
      setLoading(false);
    } else {
      // Redirigimos nosotros; AuthGuard se encarga del onboarding check
      router.replace("/dashboard");
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
          <p className="text-muted text-sm mt-2">Aparcamiento urbano, reimaginado</p>
        </div>

        {/* Email input */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 block">
              Tu email
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
              : "Entrar →"
            }
          </button>
        </div>

        {/* Nota de demo */}
        <div className="mt-6 bg-surface border border-base rounded-2xl px-4 py-3">
          <p className="text-xs text-muted text-center leading-relaxed">
            Modo desarrollo — cualquier email válido crea una cuenta automáticamente.<br/>
            <span className="text-accent font-semibold">Prueba: demo@spotsync.com</span>
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Cuando configures Google OAuth, el botón de Google aparecerá aquí.
        </p>
      </div>
    </div>
  );
}