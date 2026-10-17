import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { redemptions: { include: { item: true }, orderBy: { createdAt: "desc" } } },
    });
    if (!user) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("API Error:", error, "[GET /api/users/me]");
    return NextResponse.json({ success: false, data: null, error: "No se pudo cargar el usuario." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, data: null, error: "Solicitud inválida." }, { status: 400 });
    }
    const allowed = ["name", "language", "theme", "accentColor", "customMarker"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: update,
    });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("API Error:", error, "[PATCH /api/users/me]");
    return NextResponse.json({ success: false, data: null, error: "No se pudo actualizar el usuario." }, { status: 500 });
  }
}
