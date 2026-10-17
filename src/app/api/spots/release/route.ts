import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { spotExpiresAt } from "@/lib/gis";
import { ReleaseSpotPayload } from "@/types";

const POINTS_PER_RELEASE = 10;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Tu sesión ha caducado. Inicia sesión de nuevo." }, { status: 401 });
    }

    const body: ReleaseSpotPayload | null = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });

    const { latitude, longitude, locationDesc, notes, vehicleSize, spotSize, parkingType, zoneType, isLeaving, releaseDelayMinutes } = body;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ success: false, error: "La ubicación debe incluir latitud y longitud válidas." }, { status: 400 });
    }

    const delayMinutes = Number(releaseDelayMinutes ?? 0);
    if (!Number.isFinite(delayMinutes) || delayMinutes < 0 || delayMinutes > 120) {
      return NextResponse.json({ success: false, error: "El tiempo de liberación no es válido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "No se encontró el usuario." }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ success: false, error: "La cuenta está suspendida." }, { status: 403 });

    const availableAt = new Date(Date.now() + delayMinutes * 60000);
    const result = await prisma.$transaction(async (tx) => {
      const oldSpots = await tx.spot.findMany({
        where: { leaverId: user.id, status: "AVAILABLE" },
        select: { id: true },
      });
      const oldSpotIds = oldSpots.map((oldSpot) => oldSpot.id);

      if (oldSpotIds.length > 0) {
        await tx.spot.updateMany({
          where: { id: { in: oldSpotIds } },
          data: { status: "EXPIRED" },
        });
        await tx.parkingSpot.updateMany({
          where: { legacySpotId: { in: oldSpotIds }, status: "DISPONIBLE" },
          data: { status: "INACTIVA" },
        });
      }

      const spot = await tx.spot.create({
        data: {
          leaverId: user.id,
          latitude,
          longitude,
          locationDesc: locationDesc?.trim() || null,
          notes: notes?.trim() || null,
          vehicleSize: vehicleSize ?? "COMPACT",
          spotSize: spotSize ?? "MEDIUM",
          parkingType: parkingType ?? "PARALLEL",
          zoneType: zoneType ?? "FREE",
          isLeaving: isLeaving ?? false,
          availableAt,
          expiresAt: spotExpiresAt(2),
        },
        include: { leaver: { select: { id: true, name: true, image: true, karmaScore: true, customMarker: true } } },
      });

      await tx.parkingSpot.create({
        data: {
          ownerId: user.id,
          legacySpotId: spot.id,
          lat: spot.latitude,
          lng: spot.longitude,
          status: "DISPONIBLE",
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: POINTS_PER_RELEASE } },
      });
      await tx.pointLedger.create({
        data: { userId: user.id, amount: POINTS_PER_RELEASE, type: "SPOT_RELEASE", reference: spot.id },
      });

      return { spot, user: updatedUser };
    });

    return NextResponse.json({ success: true, data: result.spot, pointsEarned: POINTS_PER_RELEASE, user: result.user });
  } catch (error) {
    console.error("API Error:", error, "[POST /api/spots/release]");
    return NextResponse.json({ success: false, data: null, error: "No se pudo publicar el aparcamiento. Inténtalo de nuevo." }, { status: 500 });
  }
}
