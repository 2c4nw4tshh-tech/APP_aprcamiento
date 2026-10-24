interface GlobalLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function GlobalLoader({ label, fullScreen = true }: GlobalLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${fullScreen ? "fixed" : "absolute"} inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg px-6`}
    >
      <div aria-hidden="true" className="w-full max-w-sm space-y-4">
        <div className="skeleton-shimmer h-48 animate-pulse rounded-[28px] bg-gray-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer h-11 w-11 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-4 w-3/4 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-800" />
            <div className="skeleton-shimmer h-3 w-1/2 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
