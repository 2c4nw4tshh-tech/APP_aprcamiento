import type { StyleSpecification } from "mapbox-gl";

export type MapStyleId = "streets" | "satellite" | "dark" | "terrain";
export type MapStyleLabelKey = "mapStyleStreets" | "mapStyleSatellite" | "mapStyleDark" | "mapStyleTerrain";

interface MapStyleConfig {
  labelKey: MapStyleLabelKey;
  style: string | StyleSpecification;
}

export const MAP_STYLES: Record<MapStyleId, MapStyleConfig> = {
  streets: {
    labelKey: "mapStyleStreets",
    style: {
      version: 8,
      sources: {
        "carto-voyager": {
          type: "raster",
          tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        },
      },
      layers: [
        {
          id: "carto-voyager-base",
          type: "raster",
          source: "carto-voyager",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
  satellite: {
    labelKey: "mapStyleSatellite",
    style: "mapbox://styles/mapbox/satellite-streets-v12",
  },
  dark: {
    labelKey: "mapStyleDark",
    style: "mapbox://styles/mapbox/dark-v11",
  },
  terrain: {
    labelKey: "mapStyleTerrain",
    style: "mapbox://styles/mapbox/outdoors-v12",
  },
};

export const DEFAULT_MAP_STYLE: MapStyleId = "streets";
export const NAVIGATION_BLUE = "#3B82F6";
export const ROUTE_LINE_BLUE = "#3B82F6";