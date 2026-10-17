import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const spotId = typeof params?.id === "string" ? params.id.trim() : "";
    if (!spotId) return NextResponse.json({ success: false, error: "El identificador de plaza no es válido." }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const spot = await prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (spot.leaverId !== user.id) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      const updated = await tx.spot.updateMany({
        where: { id: spotId, leaverId: user.id, status: "AVAILABLE" },
        data: { status: "EXPIRED" },
      });
      if (updated.count !== 1) throw new Error("SPOT_NOT_AVAILABLE");
      await tx.parkingSpot.updateMany({
        where: { legacySpotId: spotId, status: "DISPONIBLE" },
        data: { status: "INACTIVA", lockedUntil: null },
      });
    });

    return NextResponse.json({ success: true, data: { spotId, status: "EXPIRED" } });
  } catch (error) {
    if (error instanceof Error && error.message === "SPOT_NOT_AVAILABLE") {
      return NextResponse.json({ success: false, error: "La plaza ya no está disponible para cancelar." }, { status: 409 });
    }
    console.error("API Error: fallo al cancelar plaza", { error, params }, "[POST /api/spots/:id/cancel]");
    return NextResponse.json({ success: false, error: "No se pudo cancelar la publicación." }, { status: 400 });
  }
}
