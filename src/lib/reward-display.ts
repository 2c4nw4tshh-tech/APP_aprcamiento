import type { RewardItem } from "@prisma/client";

const CLEAN_REWARD_ITEMS: Record<string, Pick<RewardItem, "name" | "description" | "value">> = {
  "reward-transport-car": {
    name: "Marcador coche",
    description: "Desbloquea un marcador de coche para tus plazas.",
    value: "car",
  },
  "reward-transport-bike": {
    name: "Marcador moto",
    description: "Desbloquea un marcador de moto para tus plazas.",
    value: "motorcycle",
  },
  "reward-transport-scooter": {
    name: "Marcador scooter",
    description: "Desbloquea un marcador de scooter para tus plazas.",
    value: "scooter",
  },
  "reward-custom-marker": {
    name: "Marcador personalizado",
    description: "Desbloquea un marcador personalizado para tus plazas.",
    value: "custom",
  },
};

export function getRewardDisplayItem(item: RewardItem): RewardItem {
  return {
    ...item,
    ...(CLEAN_REWARD_ITEMS[item.id] ?? {}),
  };
}

export function getRewardValue(item: RewardItem) {
  return CLEAN_REWARD_ITEMS[item.id]?.value ?? item.value;
}
