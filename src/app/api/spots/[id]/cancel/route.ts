import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const spot = await prisma.spot.findUnique({ where: { id: params.id } });

  if (!spot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (spot.leaverId !== user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.spot.update({ where: { id: params.id }, data: { status: "EXPIRED" } });
  return NextResponse.json({ message: "Cancelled" });
}
