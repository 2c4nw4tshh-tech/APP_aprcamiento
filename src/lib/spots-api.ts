import { NearbySpot } from "@/types";

export async function fetchNearbySpots(url: string): Promise<NearbySpot[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const body = await response.text();
    if (!body.trim()) return [];

    const payload: unknown = JSON.parse(body);
    if (typeof payload !== "object" || payload === null || !("data" in payload)) return [];

    return Array.isArray(payload.data) ? payload.data as NearbySpot[] : [];
  } catch {
    return [];
  }
}