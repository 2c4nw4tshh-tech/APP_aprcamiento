"use client";

import { X } from "lucide-react";

interface NudgeBannerProps {
  title: string;
  message: string;
  closeLabel?: string;
  onClose?: () => void;
}

export function NudgeBanner({ title, message, closeLabel = "Cerrar aviso", onClose }: NudgeBannerProps) {
  return (
    <div className="relative rounded-2xl border border-amber-300/60 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute right-2 top-2 text-amber-700 dark:text-amber-300"
      >
        <X size={14} />
      </button>
      <p className="pr-6 text-[11px] font-semibold text-amber-800 dark:text-amber-200">{title}</p>
      <p className="pr-6 mt-1 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">{message}</p>
    </div>
  );
}
