"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Map, Plus, Search, User } from "lucide-react";
import { clsx } from "clsx";
import { useAppStore } from "@/store";

export function BottomNav() {
  const pathname = usePathname();
  const t = useAppStore((state) => state.t);

  const navItems = [
    { href: "/dashboard", icon: Map, label: t("dashboard"), title: "Mapa" },
    { href: "/find", icon: Search, label: t("find"), title: t("find") },
    { href: "/release", icon: Plus, label: t("release"), title: t("release"), highlight: true },
    { href: "/rewards", icon: Gift, label: t("rewards"), title: t("rewards") },
    { href: "/profile", icon: User, label: t("profile"), title: t("profile") },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+16px)] z-50 mx-auto w-full max-w-md px-4">
      <nav
        aria-label="Navegación principal"
        className="pointer-events-auto rounded-full border border-black/10 bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] px-2.5 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur-2xl transition-colors dark:border-white/15"
      >
        <ul className="flex h-[58px] items-center justify-around gap-1">
          {navItems.map(({ href, icon: Icon, label, title, highlight }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={title}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "group relative flex h-12 min-w-12 flex-col items-center justify-center rounded-full transition-all duration-300 ease-out active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                    highlight
                      ? "-mt-3 h-12 w-12 min-w-12 rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] hover:brightness-110"
                      : active
                        ? "text-[var(--color-primary)]"
                        : "text-muted hover:bg-black/5 hover:text-base dark:hover:bg-white/10",
                  )}
                >
                  <Icon size={highlight ? 24 : 21} strokeWidth={highlight ? 2.5 : 1.9} aria-hidden="true" />
                  {!highlight && (
                    <span className="mt-0.5 max-w-[62px] truncate text-[10px] font-medium leading-none">
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
