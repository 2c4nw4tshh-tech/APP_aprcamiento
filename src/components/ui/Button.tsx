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
        variant === "navigation" && "bg-[#3B82F6] text-white shadow-md ring-2 ring-[#93C5FD] ring-offset-1 hover:bg-blue-600",
        variant === "success"   && "bg-[#10B981] text-white hover:bg-[#059669] shadow-md",
        variant === "danger"    && "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800",
        variant === "ghost"     && "bg-transparent text-muted hover:text-base",
        className
      )}
    >
      {loading && <span className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </button>
  );
}
