"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export default function SpotMapInner() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const container = mapRef.current;
    if ((container as unknown as { _leaflet_id?: string })._leaflet_id) return;

    const map = L.map(container).setView([40.416775, -3.70379], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

return <div ref={mapRef} className="w-full h-full absolute inset-0 z-0" />;
}