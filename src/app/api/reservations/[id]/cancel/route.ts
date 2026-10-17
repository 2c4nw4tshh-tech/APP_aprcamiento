import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { parkingSpot: true },
    });
    if (!reservation || reservation.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }
    if (reservation.status !== "PENDING" && reservation.status !== "EN_CAMINO") {
      return NextResponse.json({ success: false, error: "La reserva ya no se puede cancelar." }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      const cancelled = await tx.reservation.updateMany({
        where: { id: reservationId, userId: user.id, status: { in: ["PENDING", "EN_CAMINO"] } },
        data: { status: "CANCELADA" },
      });
      if (cancelled.count !== 1) throw new Error("RESERVATION_NOT_CANCELLABLE");

      if (reservation.status === "EN_CAMINO") {
        await tx.parkingSpot.updateMany({
          where: { id: reservation.parkingSpotId, status: "RESERVADA_EN_CAMINO" },
          data: { status: "DISPONIBLE", lockedUntil: null },
        });
        if (reservation.parkingSpot.legacySpotId) {
          await tx.spot.updateMany({
            where: { id: reservation.parkingSpot.legacySpotId, status: "RESERVADA_EN_CAMINO", expiresAt: { gt: new Date() } },
            data: { status: "AVAILABLE" },
          });
        }
      }
    });

    return NextResponse.json({ success: true, data: { reservationId: reservation.id, status: "CANCELADA" } });
  } catch (error) {
    if (error instanceof Error && error.message === "RESERVATION_NOT_CANCELLABLE") {
      return NextResponse.json({ success: false, error: "La reserva ya no se puede cancelar." }, { status: 409 });
    }
    console.error("API Error:", error, "[POST /api/reservations/:id/cancel]");
    return NextResponse.json({ success: false, error: "No se pudo cancelar la reserva." }, { status: 500 });
  }
}