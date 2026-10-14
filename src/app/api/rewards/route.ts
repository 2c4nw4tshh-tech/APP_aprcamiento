import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.rewardItem.findMany({ orderBy: { cost: "asc" } });
  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await req.json();

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const item = await prisma.rewardItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  if (user.points < item.cost) {
    return NextResponse.json({ error: "Not enough points" }, { status: 402 });
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        points: { decrement: item.cost },
        accentColor: item.type === "accent_color" ? item.value : undefined,
      },
    }),
    prisma.redemption.create({ data: { userId: user.id, itemId } }),
    prisma.pointLedger.create({
      data: { userId: user.id, amount: -item.cost, type: "REDEMPTION", reference: itemId },
    }),
  ]);

  return NextResponse.json({ data: updatedUser, item });
}
