import { Car } from "lucide-react";

interface GlobalLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function GlobalLoader({ label, fullScreen = true }: GlobalLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${fullScreen ? "fixed" : "absolute"} inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg`}
    >
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent opacity-30" />
        <div className="absolute inset-0 animate-car-orbit">
          <Car
            size={26}
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rotate-90 text-accent"
          />
        </div>
      </div>
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
