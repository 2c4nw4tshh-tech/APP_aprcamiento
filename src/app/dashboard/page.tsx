"use client";

import dynamic from "next/dynamic";

const SpotMap = dynamic(() => import("@/components/map/SpotMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface rounded-2xl flex items-center justify-center text-muted animate-pulse">
      Cargando mapa...
    </div>
  ),
});

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 gap-4">
      <h1 className="text-2xl font-display font-bold">Panel de Control</h1>
      
      {/* Contenedor con h-full para forzar que el mapa ocupe todo el espacio */}
      <div className="flex-1 w-full bg-surface border border-base rounded-2xl overflow-hidden relative">
        <SpotMap />
      </div>
    </div>
  );
}