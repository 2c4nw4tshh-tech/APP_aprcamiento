"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

const PUBLIC = ["/login", "/auth/signin", "/auth/onboarding"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const setUser  = useAppStore((s) => s.setUser);
  const redirected = useRef(false);

  useEffect(() => {
    if (status === "loading") return;
    if (redirected.current)  return;

    if (status === "unauthenticated" && !PUBLIC.includes(pathname)) {
      redirected.current = true;
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = session.user as any;
      const currentUser = useAppStore.getState().user;
      const sameAccount = currentUser?.email === u.email;
      if (!sameAccount) setUser(u);

      if (pathname === "/login" || pathname === "/auth/signin") {
        redirected.current = true;
        router.replace(u.onboarded ? "/dashboard" : "/auth/onboarding");
        return;
      }

      // Solo redirigir a onboarding si onboarded es EXACTAMENTE false (boolean)
      // Evita redirigir mientras el token aún no se ha refrescado (undefined)
      if (u.onboarded === false && pathname !== "/auth/onboarding") {
        redirected.current = true;
        router.replace("/auth/onboarding");
      }
    }
  }, [status, session, pathname]); // eslint-disable-line

  useEffect(() => {
    redirected.current = false;
  }, [pathname]);

  if (status === "loading") {
    return <GlobalLoader />;
  }

  if (PUBLIC.includes(pathname))    return <>{children}</>;
  if (status === "unauthenticated") return null;

  return <>{children}</>;
}