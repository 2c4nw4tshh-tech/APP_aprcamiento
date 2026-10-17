import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, data: null, error: "Tu sesión ha caducado. Inicia sesión de nuevo para guardar tu perfil." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const language = body?.language === "en" ? "en" : "es";
    if (!name) {
      return NextResponse.json({ success: false, data: null, error: "El nombre es obligatorio." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, language, onboarded: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("API Error:", error, "[POST /api/users/onboarding]");
    return NextResponse.json({ success: false, data: null, error: "No se pudo guardar el perfil." }, { status: 500 });
  }
}