import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "navigation" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-display font-semibold rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none",
        size === "sm" && "px-4 py-2 text-sm",
        size === "md" && "px-6 py-3 text-base",
        size === "lg" && "px-6 py-4 text-base w-full",
        variant === "primary"   && "bg-accent text-[var(--accent-fg)] hover:brightness-105 shadow-md",
        variant === "secondary" && "bg-surface2 text-base border border-base hover:border-accent",
        variant === "navigation" && "bg-[var(--color-primary)] text-white shadow-md ring-2 ring-[var(--color-primary)] ring-offset-1 hover:brightness-90",
        variant === "success"   && "bg-[var(--color-success)] text-white hover:brightness-90 shadow-md",
        variant === "danger"    && "bg-[color-mix(in_srgb,var(--color-destructive)_10%,var(--color-bg))] text-[var(--color-destructive)] border border-[color-mix(in_srgb,var(--color-destructive)_30%,transparent)]",
        variant === "ghost"     && "bg-transparent text-muted hover:text-base",
        className
      )}
    >
      {loading && <span className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </button>
  );
}
