// Guarda "más aparcamientos cerca" dentro de notes para no depender de una columna nueva.
const MARKER = /^\[\[more:(\d{1,2})\]\]\n?/;

export function encodeMoreSpots(notes: string | null | undefined, count: number) {
  const clean = (notes ?? "").trim();
  if (count <= 0) return clean || null;
  return `[[more:${count}]]\n${clean}`;
}

export function decodeMoreSpots<T extends { notes?: string | null }>(spot: T) {
  const match = spot.notes?.match(MARKER);
  if (!match) return { ...spot, moreSpotsNearby: 0 };
  return { ...spot, notes: spot.notes!.replace(MARKER, "") || null, moreSpotsNearby: Number(match[1]) };
}
