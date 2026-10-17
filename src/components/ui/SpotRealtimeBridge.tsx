"use client";

import { useSpotRealtime } from "@/hooks/useSpotRealtime";

export function SpotRealtimeBridge() {
  useSpotRealtime();
  return null;
}