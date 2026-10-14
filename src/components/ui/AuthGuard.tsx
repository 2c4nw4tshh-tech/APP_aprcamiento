"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/store";

// Rutas que NO necesitan sesión
const PUBLIC_PATHS = ["/auth/signin", "/auth/onboarding"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const setUser  = useAppStore((s) => s.setUser);

  useEffect(() => {
    if (status === "loading") return;

    // Si no hay sesión y no estamos en una ruta pública → login
    if (status === "unauthenticated" && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/auth/signin");
      return;
    }

    // Si hay sesión → sincronizar store
    if (status === "authenticated" && session?.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser(session.user as any);

      // Si está en signin → redirigir a donde corresponde
      if (pathname === "/auth/signin") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        router.replace(u?.onboarded ? "/dashboard" : "/auth/onboarding");
        return;
      }

      // Si está en una ruta protegida pero no ha hecho onboarding
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = session.user as any;
      if (!u?.onboarded && pathname !== "/auth/onboarding") {
        router.replace("/auth/onboarding");
      }
    }
  }, [status, session, pathname, router, setUser]);

  // Spinner mientras carga la sesión
  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // En rutas públicas, renderizar siempre aunque no haya sesión
  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;

  // En rutas protegidas, solo renderizar si hay sesión
  if (status === "unauthenticated") return null;

  return <>{children}</>;
}