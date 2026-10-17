"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl";
import { DEFAULT_MAP_STYLE, MAP_STYLES, MapStyleId } from "@/types/map";

const STORAGE_KEY = "spotsync-map-style";
const DEM_SOURCE_ID = "spotsync-mapbox-dem";

function readSavedStyle(): MapStyleId {
  if (typeof window === "undefined") return DEFAULT_MAP_STYLE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && stored in MAP_STYLES ? stored as MapStyleId : DEFAULT_MAP_STYLE;
}

export function useMapStyles(map: MapRef | null, mapReady: boolean) {
  const initialStyleRef = useRef<MapStyleId | null>(null);
  if (initialStyleRef.current === null) initialStyleRef.current = readSavedStyle();
  const initialStyleId = initialStyleRef.current;
  const [styleId, setStyleId] = useState<MapStyleId>(initialStyleId);
  const activeStyleRef = useRef<MapStyleId>(initialStyleId);
  const restoredStyleRef = useRef<string | null>(null);
  const appliedStyleRef = useRef<MapStyleId | null>(initialStyleId);

  const selectStyle = useCallback((nextStyle: MapStyleId) => {
    activeStyleRef.current = nextStyle;
    setStyleId(nextStyle);
    window.localStorage.setItem(STORAGE_KEY, nextStyle);
  }, []);

  useEffect(() => {
    if (!map || !mapReady) return;

    const rawMap = map.getMap();
    const applyStyleDecorations = () => {
      if (!rawMap.isStyleLoaded()) return;

      const selectedStyle = activeStyleRef.current;
      const styleKey = selectedStyle;
      if (restoredStyleRef.current === styleKey) return;

      if (selectedStyle === "terrain") {
        if (!rawMap.getSource(DEM_SOURCE_ID)) {
          rawMap.addSource(DEM_SOURCE_ID, {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });
        }
        rawMap.setTerrain({ source: DEM_SOURCE_ID, exaggeration: 1.35 });
        rawMap.setFog({
          range: [0.5, 10],
          color: "#d8e6f3",
          "horizon-blend": 0.15,
          "high-color": "#9cc6e8",
          "space-color": "#dce7f1",
          "star-intensity": 0,
        });
      } else {
        if (rawMap.getTerrain()) rawMap.setTerrain(null);
        rawMap.setFog(null);
      }

      restoredStyleRef.current = styleKey;
    };

    const applySelectedStyle = () => {
      const selectedStyle = activeStyleRef.current;
      if (appliedStyleRef.current !== selectedStyle) {
        restoredStyleRef.current = null;
        appliedStyleRef.current = selectedStyle;
        rawMap.setStyle(MAP_STYLES[selectedStyle].style, {
          diff: true,
          localFontFamily: "Arial, sans-serif",
          localIdeographFontFamily: "sans-serif",
        });
        return;
      }

      if (rawMap.isStyleLoaded()) applyStyleDecorations();
    };

    rawMap.on("styledata", applySelectedStyle);
    applySelectedStyle();

    return () => {
      rawMap.off("styledata", applySelectedStyle);
    };
  }, [map, mapReady, styleId]);

  return { styleId, initialStyleId, selectStyle };
}