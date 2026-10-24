const STORAGE_PREFIX = "spotsync:personal-released-spots:";
const UPDATED_EVENT = "spotsync:personal-released-spots-updated";

export function getPersonalReleasedSpotIds(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberPersonalReleasedSpot(userId: string, spotId: string) {
  if (typeof window === "undefined" || !userId || !spotId) return;
  const ids = getPersonalReleasedSpotIds(userId);
  if (!ids.includes(spotId)) ids.push(spotId);
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: { userId } }));
  } catch {
    // The map can still use the in-memory currentSpot if storage is unavailable.
  }
}

export function personalReleasedSpotsUpdatedEvent() {
  return UPDATED_EVENT;
}
