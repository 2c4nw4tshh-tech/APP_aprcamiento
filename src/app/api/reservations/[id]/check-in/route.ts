import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DRIVER_STARS = 10;
const OWNER_STARS = 5;

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const reservationId = typeof params?.id === "string" ? params.id.trim() : "";
    if (!reservationId) {
      return NextResponse.json({ success: false, error: "El identificador de reserva no es válido." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
    if (reservation.status !== "EN_CAMINO") {
      return NextResponse.json({ success: false, error: "La reserva no está en camino." }, { status: 409 });
    }

    const completedAt = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const reservationUpdate = await tx.reservation.updateMany({
        where: { id: reservation.id, userId: user.id, status: "EN_CAMINO" },
        data: { status: "COMPLETADA", arrivedAt: completedAt, starsAwarded: DRIVER_STARS },
      });
      if (reservationUpdate.count !== 1) throw new Error("RESERVATION_NOT_EN_ROUTE");

      const spotUpdate = await tx.parkingSpot.updateMany({
        where: { id: reservation.parkingSpotId, status: "RESERVADA_EN_CAMINO" },
        data: { status: "OCUPADA", lockedUntil: null },
      });
      if (spotUpdate.count !== 1) throw new Error("SPOT_NOT_RESERVED");

      if (reservation.parkingSpot.legacySpotId) {
        await tx.spot.updateMany({
          where: { id: reservation.parkingSpot.legacySpotId, status: "RESERVADA_EN_CAMINO" },
          data: { status: "OCCUPIED", occupiedAt: completedAt },
        });
      }

      const [driver, owner] = await Promise.all([
        tx.user.update({ where: { id: user.id }, data: { stars: { increment: DRIVER_STARS } } }),
        tx.user.update({ where: { id: reservation.parkingSpot.ownerId }, data: { stars: { increment: OWNER_STARS } } }),
      ]);

      return { driver, owner };
    });

    return NextResponse.json({
      success: true,
      data: {
        reservationId: reservation.id,
        arrivedAt: completedAt,
        starsAwarded: { driver: DRIVER_STARS, owner: OWNER_STARS },
        user: result.driver,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RESERVATION_NOT_EN_ROUTE") {
      return NextResponse.json({ success: false, error: "La reserva ya no está en camino." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "SPOT_NOT_RESERVED") {
      return NextResponse.json({ success: false, error: "La plaza ya no está bloqueada para esta reserva." }, { status: 409 });
    }
    console.error("API Error: fallo en check-in de reserva", { reservationId: params?.id, error }, "[POST /api/reservations/:id/check-in]");
    return NextResponse.json({ success: false, error: "No se pudo completar el check-in. Comprueba la reserva e inténtalo de nuevo." }, { status: 400 });
  }
}