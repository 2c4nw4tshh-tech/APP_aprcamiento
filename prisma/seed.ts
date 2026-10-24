import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.rewardItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "reward-ocean",
        name: "Ocean Blue",
        description: "Accent azul océano profundo",
        type: "accent_color",
        value: "#4CC9F0",
        cost: 100,
        emoji: "🌊",
      },
      {
        id: "reward-transport-car",
        name: "Marcador coche",
        description: "Desbloquea un marcador de coche para tus plazas.",
        type: "transport_emoji",
        value: "car",
        cost: 120,
        emoji: "🚗",
      },
      {
        id: "reward-transport-bike",
        name: "Marcador moto",
        description: "Desbloquea un marcador de moto para tus plazas.",
        type: "transport_emoji",
        value: "motorcycle",
        cost: 180,
        emoji: "🏍️",
      },
      {
        id: "reward-transport-scooter",
        name: "Marcador scooter",
        description: "Desbloquea un marcador de scooter para tus plazas.",
        type: "transport_emoji",
        value: "scooter",
        cost: 220,
        emoji: "🛵",
      },
      {
        id: "reward-custom-marker",
        name: "Marcador personalizado",
        description: "Desbloquea un marcador personalizado para tus plazas.",
        type: "custom_marker",
        value: "custom",
        cost: 500,
        emoji: "✨",
      },
      {
        id: "reward-coral",
        name: "Coral Sunset",
        description: "Accent coral vibrante",
        type: "accent_color",
        value: "#FF6B6B",
        cost: 100,
        emoji: "🌅",
      },
      {
        id: "reward-gold",
        name: "Golden Hour",
        description: "Accent dorado premium",
        type: "accent_color",
        value: "#FFD166",
        cost: 200,
        emoji: "✨",
      },
      {
        id: "reward-purple",
        name: "Neon Purple",
        description: "Accent púrpura neón",
        type: "accent_color",
        value: "#9B5DE5",
        cost: 200,
        emoji: "💜",
      },
      {
        id: "reward-rose",
        name: "Sakura Rose",
        description: "Accent rosa suave",
        type: "accent_color",
        value: "#FF85A1",
        cost: 300,
        emoji: "🌸",
      },
      {
        id: "reward-orange",
        name: "Ember Orange",
        description: "Accent naranja intenso",
        type: "accent_color",
        value: "#FF9F43",
        cost: 150,
        emoji: "🔥",
      },
    ],
  });
  console.log("Rewards seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
