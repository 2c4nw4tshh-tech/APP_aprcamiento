import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance, minutesAgo } from "@/lib/gis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseFloat(searchParams.get("radius") ?? "500");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const latDelta = radius / 111320;
  const lngDelta = radius / (111320 * Math.cos((lat * Math.PI) / 180));

  const spots = await prisma.spot.findMany({
    where: {
      status: "AVAILABLE",
      expiresAt: { gt: new Date() },
      latitude: { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
    },
    include: {
      leaver: { select: { id: true, name: true, image: true, karmaScore: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const nearby = spots
    .map((s) => ({
      ...s,
      distance: haversineDistance(lat, lng, s.latitude, s.longitude),
      minutesAgo: minutesAgo(s.createdAt),
    }))
    .filter((s) => s.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  return NextResponse.json({ data: nearby });
}
