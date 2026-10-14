"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Search, Zap, Gift, User } from "lucide-react";
import { clsx } from "clsx";
import { useAppStore } from "@/store";

export function BottomNav() {
  const pathname = usePathname();
  const t = useAppStore((s) => s.t);

  const NAV = [
    { href: "/dashboard", icon: MapPin,  label: t("dashboard") },
    { href: "/find",      icon: Search,  label: t("find") },
    { href: "/release",   icon: Zap,     label: t("release"), highlight: true },
    { href: "/rewards",   icon: Gift,    label: t("rewards") },
    { href: "/profile",   icon: User,    label: t("profile") },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface border-t border-base">
      <ul className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {NAV.map(({ href, icon: Icon, label, highlight }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors",
                  highlight
                    ? "bg-accent -mt-5 shadow-lg rounded-2xl"
                    : active
                    ? "text-accent"
                    : "text-muted"
                )}
              >
                <Icon size={highlight ? 22 : 20} strokeWidth={highlight ? 2.5 : 1.8}
                  className={highlight ? "text-[var(--accent-fg)]" : undefined} />
                <span className={clsx("text-[10px] font-medium tracking-wide", highlight && "text-[var(--accent-fg)]")}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
