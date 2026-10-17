"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { useSession } from "next-auth/react";
import { safeFetchJson } from "@/lib/safe-fetch";
import { User } from "@/types";
import { SpotRealtimeBridge } from "@/components/ui/SpotRealtimeBridge";

function CurrentUserSync() {
  const { status } = useSession();
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;

    const syncUser = async () => {
      const response = await safeFetchJson<{ data: User | null }>("/api/users/me", { cache: "no-store" }, { data: null });
      if (!active || !response.ok || !response.data.data) return;

      const freshUser = response.data.data;
      const currentUser = useAppStore.getState().user;
      const synchronizedUser = currentUser?.email === freshUser.email
        ? { ...freshUser, theme: currentUser.theme }
        : freshUser;
      const fieldsToCompare: (keyof User)[] = [
        "id", "name", "email", "image", "role", "points", "karmaScore",
        "stars", "isVerified", "language", "theme", "accentColor", "customMarker", "onboarded",
      ];
      if (!currentUser || fieldsToCompare.some((field) => currentUser[field] !== synchronizedUser[field])) {
        setUser(synchronizedUser);
      }
    };

    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") void syncUser();
    };

    void syncUser();
    window.addEventListener("focus", syncWhenVisible);
    document.addEventListener("visibilitychange", syncWhenVisible);
    const intervalId = window.setInterval(syncUser, 15000);

    return () => {
      active = false;
      window.removeEventListener("focus", syncWhenVisible);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      window.clearInterval(intervalId);
    };
  }, [status, setUser]);

  return null;
}

function AccentInjector() {
  const accentColor = useAppStore((s) => s.accentColor);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
    // Decide foreground: dark text on light colours, light text on dark
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    document.documentElement.style.setProperty("--accent-fg", luminance > 0.5 ? "#111318" : "#FFFFFF");
  }, [accentColor]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }));

  return (
    <SessionProvider>
      <QueryClientProvider client={qc}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <AccentInjector />
          <CurrentUserSync />
          <SpotRealtimeBridge />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                fontFamily: "var(--font-grotesk)",
                fontSize: "14px",
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
