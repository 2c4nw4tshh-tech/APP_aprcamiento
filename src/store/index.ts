import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Spot, User, NearbySpot, Coordinates, Language, Theme, TranslationKey, TRANSLATIONS, RealtimeParkingSpot } from "@/types";

interface AppState {
  user: User | null;
  currentSpot: Spot | null;
  nearbySpots: NearbySpot[];
  parkingSpots: RealtimeParkingSpot[];
  userLocation: Coordinates | null;
  isRadarActive: boolean;

  // Theme & i18n
  language: Language;
  theme: Theme;
  accentColor: string;

  setUser: (user: User | null) => void;
  setCurrentSpot: (spot: Spot | null) => void;
  setNearbySpots: (spots: NearbySpot[]) => void;
  setParkingSpots: (spots: RealtimeParkingSpot[]) => void;
  upsertParkingSpot: (spot: RealtimeParkingSpot) => void;
  removeParkingSpot: (spotId: string, legacySpotId?: string | null) => void;
  setUserLocation: (coords: Coordinates | null) => void;
  setIsRadarActive: (active: boolean) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  reset: () => void;
}

const createTranslator = (language: Language) =>
  (key: TranslationKey, vars?: Record<string, string | number>): string => {
    const dictionary = TRANSLATIONS[language] ?? TRANSLATIONS.es;
    let text: string = dictionary[key] ?? TRANSLATIONS.es[key] ?? String(key);

    if (vars) {
      Object.entries(vars).forEach(([name, value]) => {
        text = text.replace(`{${name}}`, String(value));
      });
    }

    return text;
  };

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentSpot: null,
      nearbySpots: [],
      parkingSpots: [],
      userLocation: null,
      isRadarActive: false,
      language: "es",
      theme: "system",
      accentColor: "#5CFFC0",
      t: createTranslator("es"),

      setUser: (user) => {
        const language = (user?.language as Language) || "es";
        set({
          user,
          ...(user ? {
            language,
            theme: (user.theme as Theme) || "system",
            accentColor: user.accentColor || "#5CFFC0",
            t: createTranslator(language),
          } : {}),
        });
      },
      setCurrentSpot: (spot) => set({ currentSpot: spot }),
      setNearbySpots: (spots) => set({ nearbySpots: spots }),
      setParkingSpots: (parkingSpots) => set({ parkingSpots }),
      upsertParkingSpot: (spot) => set((state) => ({
        parkingSpots: state.parkingSpots.some((current) => current.id === spot.id)
          ? state.parkingSpots.map((current) => current.id === spot.id ? spot : current)
          : [...state.parkingSpots, spot],
        nearbySpots: spot.status === "DISPONIBLE" || !spot.legacySpotId
          ? state.nearbySpots
          : state.nearbySpots.filter((nearbySpot) => nearbySpot.id !== spot.legacySpotId),
      })),
      removeParkingSpot: (spotId, legacySpotId) => set((state) => {
        const removed = state.parkingSpots.find((spot) => spot.id === spotId);
        const associatedLegacySpotId = legacySpotId ?? removed?.legacySpotId;
        return {
          parkingSpots: state.parkingSpots.filter((spot) => spot.id !== spotId),
          nearbySpots: associatedLegacySpotId
            ? state.nearbySpots.filter((spot) => spot.id !== associatedLegacySpotId)
            : state.nearbySpots,
        };
      }),
      setUserLocation: (coords) => set({ userLocation: coords }),
      setIsRadarActive: (active) => set({ isRadarActive: active }),
      setLanguage: (language) => set({ language, t: createTranslator(language) }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),

      reset: () => set({ currentSpot: null, isRadarActive: false }),
    }),
    {
      name: "spotsync-store",
      partialize: (state) => ({ language: state.language, theme: state.theme, accentColor: state.accentColor }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState>;
        const language = persisted.language ?? currentState.language;
        return { ...currentState, ...persisted, language, t: createTranslator(language) };
      },
    }
  )
);