"use client";

import dynamic from "next/dynamic";

const SpotMapInner = dynamic(() => import("./SpotMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-surface rounded-2xl flex items-center justify-center text-muted animate-pulse">
      Cargando mapa...
    </div>
  ),
});

export default function SpotMap() {
  return <SpotMapInner />;
}