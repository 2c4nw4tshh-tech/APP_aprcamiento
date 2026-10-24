"use client";

import { Layers, Map as MapIcon, Moon, Mountain, Satellite } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";
import { MAP_STYLES, MapStyleId, NAVIGATION_BLUE } from "@/types/map";

interface MapStylePickerProps {
  value: MapStyleId;
  onChange: (style: MapStyleId) => void;
}

const STYLE_OPTIONS: { id: MapStyleId; icon: typeof MapIcon }[] = [
  { id: "streets", icon: MapIcon },
  { id: "satellite", icon: Satellite },
  { id: "dark", icon: Moon },
  { id: "terrain", icon: Mountain },
];

export function MapStylePicker({ value, onChange }: MapStylePickerProps) {
  const t = useAppStore((state) => state.t);
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={pickerRef} className="absolute right-4 top-36 z-20">
      <button
        type="button"
        aria-label={t("mapStylePickerLabel")}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex h-11 items-center gap-2 rounded-xl border border-base bg-surface/95 px-3 text-sm font-semibold text-base shadow-lg backdrop-blur hover:bg-surface"
      >
        <Layers size={17} aria-hidden="true" />
        {t("mapLayers")}
      </button>

      {open && (
        <div role="menu" aria-label={t("mapStylePickerLabel")} className="absolute right-0 top-12 flex min-w-40 flex-col gap-1 rounded-xl border border-base bg-surface/98 p-1.5 shadow-xl backdrop-blur">
          {STYLE_OPTIONS.map(({ id, icon: Icon }) => {
            const label = t(MAP_STYLES[id].labelKey);
            const selected = id === value;
            return (
          <button
            key={id}
            type="button"
            role="menuitemradio"
            aria-label={label}
            aria-checked={selected}
            title={label}
            onClick={() => { onChange(id); setOpen(false); }}
            className={`flex h-11 items-center gap-2 rounded-lg px-3 text-left text-sm font-medium transition-colors ${selected ? "text-white ring-2 ring-[var(--color-primary)] ring-offset-1" : "text-muted hover:bg-surface2 hover:text-base"}`}
            style={selected ? { backgroundColor: "var(--color-primary)" } : undefined}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
            );
          })}
        </div>
      )}
    </div>
  );
}