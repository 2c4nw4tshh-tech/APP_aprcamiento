import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

  const { action } = await req.json();

  if (action === "occupied") {
    const spot = await prisma.spot.findUnique({ where: { id: params.id } });
    if (!spot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.spot.update({
      where: { id: params.id },
      data: { status: "OCCUPIED", occupiedAt: new Date() },
    });

    return NextResponse.json({ message: "Marked as occupied" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
