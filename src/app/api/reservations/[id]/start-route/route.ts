import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface StartRouteBody {
  originLat?: number;
  originLng?: number;
  etaMinutes?: number;
  distanceKm?: number;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = typeof params?.id === "string" ? params.id.trim() : "";
    if (!reservationId) {
      return NextResponse.json({ success: false, error: "El identificador de reserva no es válido." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as StartRouteBody | null;
    const { originLat, originLng, etaMinutes, distanceKm } = body ?? {};
    if (
      !Number.isFinite(originLat) || !Number.isFinite(originLng) ||
      originLat! < -90 || originLat! > 90 || originLng! < -180 || originLng! > 180 ||
      !Number.isFinite(etaMinutes) || etaMinutes! < 1 || etaMinutes! > 240 ||
      !Number.isFinite(distanceKm) || distanceKm! < 0
    ) {
      return NextResponse.json({ success: false, error: "Los datos de ruta no son válidos." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { parkingSpot: true },
    });
    if (!reservation || reservation.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "La reserva ya no está pendiente." }, { status: 409 });
    }

    if (reservation.parkingSpot.ownerId === user.id) {
      return NextResponse.json({ success: false, error: "No puedes reservar tu propia plaza." }, { status: 403 });
    }

    const now = new Date();
    const lockedUntil = new Date(now.getTime() + Math.max(10, Math.ceil(etaMinutes!) + 5) * 60_000);
    const updatedReservation = await prisma.$transaction(async (tx) => {
      const spotUpdate = await tx.parkingSpot.updateMany({
        where: {
          id: reservation.parkingSpotId,
          OR: [
            { status: "DISPONIBLE" },
            { status: "RESERVADA_EN_CAMINO", lockedUntil: { lte: now } },
          ],
        },
        data: { status: "RESERVADA_EN_CAMINO", lockedUntil },
      });
      if (spotUpdate.count !== 1) throw new Error("SPOT_UNAVAILABLE");

      const reservationUpdate = await tx.reservation.updateMany({
        where: { id: reservation.id, userId: user.id, status: "PENDING" },
        data: {
          status: "EN_CAMINO",
          originLat: originLat!,
          originLng: originLng!,
          etaMinutes: etaMinutes!,
          distanceKm: distanceKm!,
          enRouteAt: now,
        },
      });
      if (reservationUpdate.count !== 1) throw new Error("RESERVATION_NOT_PENDING");

      if (reservation.parkingSpot.legacySpotId) {
        const legacyUpdate = await tx.spot.updateMany({
          where: { id: reservation.parkingSpot.legacySpotId, status: "AVAILABLE" },
          data: { status: "RESERVADA_EN_CAMINO" },
        });
        if (legacyUpdate.count !== 1) throw new Error("LEGACY_SPOT_UNAVAILABLE");
      }

      return tx.reservation.findUnique({
        where: { id: reservation.id },
        include: { parkingSpot: true },
      });
    });

    return NextResponse.json({ success: true, data: updatedReservation });
  } catch (error) {
    if (error instanceof Error && error.message === "SPOT_UNAVAILABLE") {
      return NextResponse.json({ success: false, error: "La plaza ya está reservada o no está disponible." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "RESERVATION_NOT_PENDING") {
      return NextResponse.json({ success: false, error: "La reserva ya no está pendiente." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "LEGACY_SPOT_UNAVAILABLE") {
      return NextResponse.json({ success: false, error: "La plaza ya no está disponible en el mapa." }, { status: 409 });
    }

    const prismaDiagnostic = error instanceof Prisma.PrismaClientKnownRequestError
      ? { code: error.code, meta: error.meta }
      : error instanceof Prisma.PrismaClientValidationError
        ? { type: "PrismaClientValidationError", message: error.message }
        : { type: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : String(error) };
    console.error("API Error:", prismaDiagnostic, error, "[POST /api/reservations/:id/start-route]");

    const message = error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientValidationError
      ? "La base de datos rechazó la actualización de la reserva."
      : "No se pudo iniciar la ruta. Revisa los datos e inténtalo de nuevo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}