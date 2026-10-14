import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { spotExpiresAt } from "@/lib/gis";
import { ReleaseSpotPayload } from "@/types";

const POINTS_PER_RELEASE = 10;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.isBanned) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  const body: ReleaseSpotPayload = await req.json();
  const { latitude, longitude, locationDesc, notes, vehicleSize, parkingType, zoneType, isLeaving } = body;

  if (!latitude || !longitude) return NextResponse.json({ error: "Location required" }, { status: 400 });

  // Expire old active spots from this user
  await prisma.spot.updateMany({
    where: { leaverId: user.id, status: "AVAILABLE" },
    data: { status: "EXPIRED" },
  });

  const spot = await prisma.spot.create({
    data: {
      leaverId: user.id,
      latitude,
      longitude,
      locationDesc,
      notes,
      vehicleSize: vehicleSize ?? "COMPACT",
      parkingType: parkingType ?? "PARALLEL",
      zoneType: zoneType ?? "FREE",
      isLeaving: isLeaving ?? false,
      expiresAt: spotExpiresAt(2),
    },
    include: { leaver: { select: { id: true, name: true, image: true, karmaScore: true } } },
  });

  // Award points
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { points: { increment: POINTS_PER_RELEASE } } }),
    prisma.pointLedger.create({ data: { userId: user.id, amount: POINTS_PER_RELEASE, type: "SPOT_RELEASE", reference: spot.id } }),
  ]);

  return NextResponse.json({ data: spot, pointsEarned: POINTS_PER_RELEASE });
}
