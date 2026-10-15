"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";

const PUBLIC = ["/auth/signin", "/auth/onboarding"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const setUser  = useAppStore((s) => s.setUser);
  const redirected = useRef(false); // evita doble redirect

  useEffect(() => {
    if (status === "loading")   return;
    if (redirected.current)     return;

    if (status === "unauthenticated" && !PUBLIC.includes(pathname)) {
      redirected.current = true;
      router.replace("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = session.user as any;
      setUser(u);

      // Si está en signin con sesión activa → redirigir
      if (pathname === "/auth/signin") {
        redirected.current = true;
        router.replace(u.onboarded ? "/dashboard" : "/auth/onboarding");
        return;
      }

      // Si no ha hecho onboarding y no está en esa página
      if (!u.onboarded && pathname !== "/auth/onboarding") {
        redirected.current = true;
        router.replace("/auth/onboarding");
      }
    }
  }, [status, session, pathname]); // eslint-disable-line

  // Reset del ref cuando cambia la ruta
  useEffect(() => {
    redirected.current = false;
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (PUBLIC.includes(pathname))        return <>{children}</>;
  if (status === "unauthenticated")     return null;

  return <>{children}</>;
}