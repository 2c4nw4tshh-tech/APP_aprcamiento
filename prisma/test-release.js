// Simula la inserción de "liberar aparcamiento" y la revierte siempre (rollback).
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const ROLLBACK = "ROLLBACK_TEST";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No hay usuarios en la base de datos para la prueba.");

  try {
    await prisma.$transaction(async (tx) => {
      const spot = await tx.spot.create({
        data: {
          leaverId: user.id,
          latitude: 40.416775,
          longitude: -3.70379,
          vehicleSize: "COMPACT",
          spotSize: "MEDIUM",
          parkingType: "PARALLEL",
          zoneType: "FREE",
          isLeaving: false,
          availableAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
        },
        select: { id: true, latitude: true, longitude: true },
      });
      await tx.parkingSpot.create({
        data: { ownerId: user.id, legacySpotId: spot.id, lat: spot.latitude, lng: spot.longitude, status: "DISPONIBLE" },
      });
      await tx.user.update({ where: { id: user.id }, data: { points: { increment: 10 } } });
      await tx.pointLedger.create({ data: { userId: user.id, amount: 10, type: "SPOT_RELEASE", reference: spot.id } });
      await tx.spot.findMany({ where: { leaverId: user.id, status: "AVAILABLE" }, select: { id: true } });
      console.log("OK: inserción válida, se revierte la transacción.");
      throw new Error(ROLLBACK);
    });
  } catch (error) {
    if (error.message === ROLLBACK) return;
    console.error("Error al liberar:", error.code ?? "", error.meta ?? "", error.message);
    process.exitCode = 1;
  }
}

main().finally(() => prisma.$disconnect());
