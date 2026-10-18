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
          moreSpotsNearby: 0,
          availableAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 3600 * 1000),
        },
      });
      await tx.parkingSpot.create({
        data: { ownerId: user.id, legacySpotId: spot.id, lat: spot.latitude, lng: spot.longitude, status: "DISPONIBLE" },
      });
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
