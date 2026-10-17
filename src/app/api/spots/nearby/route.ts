import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance, minutesAgo } from "@/lib/gis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");
    const radius = parseFloat(searchParams.get("radius") ?? "500");
    const vehicleFilters = searchParams.getAll("vehicle");
    const zoneFilters = searchParams.getAll("zone");
    const sizeFilters = searchParams.getAll("size");

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0 || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { success: false, data: [], error: "Se requieren coordenadas y un radio válidos." },
        { status: 400 },
      );
    }

    const latDelta = radius / 111320;
    const lngDelta = radius / (111320 * Math.cos((lat * Math.PI) / 180));

    const where: Record<string, unknown> = {
      status: "AVAILABLE",
      expiresAt: { gt: new Date() },
      latitude: { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
    };

    if (vehicleFilters.length) {
      where.vehicleSize = { in: vehicleFilters };
    }
    if (zoneFilters.length) {
      where.zoneType = { in: zoneFilters };
    }
    if (sizeFilters.length) {
      where.spotSize = { in: sizeFilters };
    }

    const spots = await prisma.spot.findMany({
      where,
      include: {
        leaver: { select: { id: true, name: true, image: true, karmaScore: true, customMarker: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const nearby = spots
      .map((s) => ({
        ...s,
        distance: haversineDistance(lat, lng, s.latitude, s.longitude),
        minutesAgo: minutesAgo(s.createdAt),
        countdownMinutes: Math.max(0, Math.ceil((new Date(s.availableAt).getTime() - Date.now()) / 60000)),
      }))
      .filter((s) => s.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ success: true, data: nearby });
  } catch (error) {
    console.error("API Error:", error, "[GET /api/spots/nearby]");
    return NextResponse.json(
      { success: false, data: [], error: "No se pudieron cargar las plazas cercanas." },
      { status: 500 },
    );
  }
}
