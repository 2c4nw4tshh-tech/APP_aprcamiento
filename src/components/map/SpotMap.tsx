"use client";
import { useEffect, useRef } from "react";
import { NearbySpot } from "@/types";
import { useAppStore } from "@/store";

interface Props {
  center: [number, number];
  spots: NearbySpot[];
  onSpotClick: (spot: NearbySpot) => void;
}

export function SpotMap({ center, spots, onSpotClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<unknown>(null);
  const accentColor  = useAppStore((s) => s.accentColor);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapRef.current)             return;
    if (!containerRef.current)      return;

    // Importamos Leaflet solo en cliente
    import("leaflet").then((L) => {
      // Arregla iconos rotos por webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        zoomControl:        false,
        attributionControl: false,
      }).setView(center, 16);

      // Tiles CartoDB Voyager (funciona bien en claro y oscuro)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Control de zoom arriba a la derecha
      L.control.zoom({ position: "topright" }).addTo(map);

      // Marcador del usuario
      const userIcon = L.divIcon({
        html: `<div style="
          width:14px;height:14px;
          background:${accentColor};
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 0 0 3px ${accentColor}44;
        "></div>`,
        className:  "",
        iconAnchor: [7, 7],
      });
      L.marker(center, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

      // Marcadores de spots
      spots.forEach((spot) => {
        const color = spot.isLeaving ? "#FACC15" : "#22C55E";
        const icon  = L.divIcon({
          html: `<div style="
            width:30px;height:30px;
            background:${color};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="transform:rotate(45deg);font-size:12px;font-weight:700;color:#111;">P</span>
          </div>`,
          className:  "",
          iconAnchor: [15, 30],
        });

        const marker = L.marker([spot.latitude, spot.longitude], { icon });
        marker.bindTooltip(
          `${spot.minutesAgo}min · ${spot.locationDesc ?? ""}`,
          { direction: "top", offset: [0, -32], className: "spot-tooltip" }
        );
        marker.on("click", () => onSpotClick(spot));
        marker.addTo(map);
      });

      mapRef.current = map;
    });

    // Cleanup al desmontar
    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* CSS de Leaflet cargado inline para garantizar que llega en producción */}
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          inset: 0 !important;
          background: var(--bg) !important;
        }
        .spot-tooltip {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          white-space: nowrap;
        }
        .leaflet-tooltip-top::before {
          border-top-color: var(--border);
        }
      `}</style>

      {/* Contenedor del mapa — necesita dimensiones explícitas */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset:    0,
          width:    "100%",
          height:   "100%",
        }}
      />
    </>
  );
}