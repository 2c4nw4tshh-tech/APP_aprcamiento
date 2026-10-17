import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const legacySpotId = typeof body?.spotId === "string" ? body.spotId : null;
    const parkingSpotId = typeof body?.parkingSpotId === "string" ? body.parkingSpotId : null;
    if (!legacySpotId && !parkingSpotId) {
      return NextResponse.json({ success: false, error: "spotId or parkingSpotId is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const reservation = await prisma.$transaction(async (tx) => {
      let parkingSpotIdToReserve = parkingSpotId;

      if (legacySpotId) {
        const legacySpot = await tx.spot.findUnique({ where: { id: legacySpotId } });
        if (!legacySpot || legacySpot.status !== "AVAILABLE" || legacySpot.expiresAt <= new Date()) {
          throw new Error("SPOT_UNAVAILABLE");
        }
        if (legacySpot.leaverId === user.id) throw new Error("CANNOT_RESERVE_OWN_SPOT");

        const parkingSpot = await tx.parkingSpot.upsert({
          where: { legacySpotId },
          create: {
            ownerId: legacySpot.leaverId,
            legacySpotId,
            lat: legacySpot.latitude,
            lng: legacySpot.longitude,
            status: "DISPONIBLE",
          },
          update: {
            lat: legacySpot.latitude,
            lng: legacySpot.longitude,
          },
        });
        if (parkingSpot.status !== "DISPONIBLE" && !(parkingSpot.status === "RESERVADA_EN_CAMINO" && parkingSpot.lockedUntil && parkingSpot.lockedUntil <= new Date())) {
          throw new Error("SPOT_UNAVAILABLE");
        }
        parkingSpotIdToReserve = parkingSpot.id;
      }

      const parkingSpot = await tx.parkingSpot.findUnique({ where: { id: parkingSpotIdToReserve! } });
      if (!parkingSpot || parkingSpot.ownerId === user.id) throw new Error("SPOT_UNAVAILABLE");
      if (parkingSpot.status !== "DISPONIBLE" && !(parkingSpot.status === "RESERVADA_EN_CAMINO" && parkingSpot.lockedUntil && parkingSpot.lockedUntil <= new Date())) {
        throw new Error("SPOT_UNAVAILABLE");
      }

      return tx.reservation.create({
        data: { userId: user.id, parkingSpotId: parkingSpot.id, status: "PENDING" },
        include: { parkingSpot: true },
      });
    });

    return NextResponse.json({ success: true, data: reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "CANNOT_RESERVE_OWN_SPOT") {
      return NextResponse.json({ success: false, error: "No puedes reservar tu propia plaza." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "SPOT_UNAVAILABLE") {
      return NextResponse.json({ success: false, error: "La plaza ya no está disponible." }, { status: 409 });
    }
    const diagnostic = error instanceof Prisma.PrismaClientKnownRequestError
      ? { code: error.code, meta: error.meta }
      : { type: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : String(error) };
    console.error("API Error: fallo al crear reserva", diagnostic, error, "[POST /api/reservations]");
    return NextResponse.json({ success: false, error: "No se pudo crear la reserva. Revisa la plaza e inténtalo de nuevo." }, { status: 400 });
  }
}