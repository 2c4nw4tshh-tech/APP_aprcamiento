import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { minutesAgo } from "@/lib/gis";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const spot = await prisma.spot.findUnique({
    where: { id: params.id },
    include: {
      leaver: { select: { id: true, name: true, image: true, karmaScore: true } },
    },
  });
  if (!spot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: { ...spot, minutesAgo: minutesAgo(spot.createdAt) } });
}

// POST /api/spots/[id] with body { action: "occupied" }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, rating } = body;

  if (action === "occupied" || action === "occupy") {
    const spot = await prisma.spot.findUnique({
      where: { id: params.id },
      include: { leaver: true },
    });
    if (!spot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const ratingValue = Number(rating ?? 5);
    const validRating = Number.isFinite(ratingValue) ? Math.min(5, Math.max(1, ratingValue)) : 5;

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.spot.update({
        where: { id: params.id },
        data: { status: "OCCUPIED", occupiedAt: new Date() },
      });
      await tx.rating.create({
        data: {
          spotId: spot.id,
          giverId: user.id,
          accurate: true,
          comment: `Ocupación confirmada con puntuación ${validRating}/5`,
        },
      });

      const leaver = await tx.user.findUnique({ where: { id: spot.leaverId } });
      if (!leaver) throw new Error("SPOT_LEAVER_NOT_FOUND");
      const nextTotal = leaver.totalRatings + 1;
      const nextAverage = (leaver.karmaScore * leaver.totalRatings + validRating) / nextTotal;

      await tx.user.update({
        where: { id: spot.leaverId },
        data: {
          totalRatings: { increment: 1 },
          karmaScore: { set: Number(nextAverage.toFixed(2)) },
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: 5 } },
      });
      await tx.pointLedger.create({
        data: { userId: user.id, amount: 5, type: "SPOT_OCCUPIED", reference: spot.id },
      });
      return tx.user.findUnique({ where: { id: user.id } });
    });

    return NextResponse.json({ success: true, data: { user: updatedUser } });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
