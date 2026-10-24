import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRewardDisplayItem, getRewardValue } from "@/lib/reward-display";

export async function GET() {
  try {
    const items = await prisma.rewardItem.findMany({ orderBy: { cost: "asc" } });
    const normalizedItems = (items ?? []).map(getRewardDisplayItem);
    return NextResponse.json({ success: true, data: normalizedItems });
  } catch (error) {
    console.error("API Error:", error, "[GET /api/rewards]");
    return NextResponse.json({ success: false, data: [], error: "No se pudieron cargar las recompensas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const itemId = body?.itemId;
    if (typeof itemId !== "string" || !itemId) {
      return NextResponse.json({ success: false, data: null, error: "Item inválido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, data: null, error: "User not found" }, { status: 404 });

    const item = await prisma.rewardItem.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ success: false, data: null, error: "Item not found" }, { status: 404 });

    if (user.points < item.cost) {
      return NextResponse.json({ success: false, data: null, error: "Not enough points" }, { status: 402 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const existingRedemption = await tx.redemption.findFirst({ where: { userId: user.id, itemId } });
      if (existingRedemption) throw new Error("ALREADY_REDEEMED");

      const debit = await tx.user.updateMany({
        where: { id: user.id, points: { gte: item.cost } },
        data: { points: { decrement: item.cost } },
      });
      if (debit.count !== 1) throw new Error("INSUFFICIENT_POINTS");

      await tx.redemption.create({ data: { userId: user.id, itemId } });
      await tx.pointLedger.create({
        data: { userId: user.id, amount: -item.cost, type: "REDEMPTION", reference: itemId },
      });

      return tx.user.update({
        where: { id: user.id },
        data: {
          accentColor: item.type === "accent_color" ? item.value : undefined,
          customMarker: item.type === "transport_emoji" || item.type === "custom_marker" ? getRewardValue(item) : undefined,
        },
      });
    });

    return NextResponse.json({ success: true, data: { ...updatedUser, item } });
  } catch (error) {
    console.error("API Error:", error, "[POST /api/rewards]");
    if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
      return NextResponse.json({ success: false, data: null, error: "Not enough points" }, { status: 402 });
    }
    if (error instanceof Error && error.message === "ALREADY_REDEEMED") {
      return NextResponse.json({ success: false, data: null, error: "Reward already redeemed" }, { status: 409 });
    }
    return NextResponse.json({ success: false, data: null, error: "No se pudo canjear la recompensa." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const itemId = body?.itemId;
    if (typeof itemId !== "string" || !itemId) {
      return NextResponse.json({ success: false, data: null, error: "Item inválido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, data: null, error: "User not found" }, { status: 404 });

    const redemption = await prisma.redemption.findFirst({
      where: { userId: user.id, itemId },
      include: { item: true },
    });
    if (!redemption) return NextResponse.json({ success: false, data: null, error: "Reward is not unlocked" }, { status: 403 });

    const item = redemption.item;
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        accentColor: item.type === "accent_color" ? item.value : undefined,
        customMarker: item.type === "transport_emoji" || item.type === "custom_marker" ? getRewardValue(item) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("API Error:", error, "[PATCH /api/rewards]");
    return NextResponse.json({ success: false, data: null, error: "No se pudo aplicar la recompensa." }, { status: 500 });
  }
}
