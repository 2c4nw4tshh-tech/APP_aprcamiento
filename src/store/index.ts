import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Spot, User, NearbySpot, Coordinates, Language, Theme, TranslationKey, TRANSLATIONS } from "@/types";

interface AppState {
  user: User | null;
  currentSpot: Spot | null;
  nearbySpots: NearbySpot[];
  userLocation: Coordinates | null;
  isRadarActive: boolean;

  // Theme & i18n
  language: Language;
  theme: Theme;
  accentColor: string;

  setUser: (user: User | null) => void;
  setCurrentSpot: (spot: Spot | null) => void;
  setNearbySpots: (spots: NearbySpot[]) => void;
  setUserLocation: (coords: Coordinates | null) => void;
  setIsRadarActive: (active: boolean) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      currentSpot: null,
      nearbySpots: [],
      userLocation: null,
      isRadarActive: false,
      language: "es",
      theme: "system",
      accentColor: "#5CFFC0",

      setUser: (user) => {
        set({ user });
        if (user) {
          set({
            language: (user.language as Language) || "es",
            theme: (user.theme as Theme) || "system",
            accentColor: user.accentColor || "#5CFFC0",
          });
        }
      },
      setCurrentSpot: (spot) => set({ currentSpot: spot }),
      setNearbySpots: (spots) => set({ nearbySpots: spots }),
      setUserLocation: (coords) => set({ userLocation: coords }),
      setIsRadarActive: (active) => set({ isRadarActive: active }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),

      t: (key, vars) => {
        const lang = get().language || "es";
        
        // Acceso seguro previniendo errores undefined
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const translationsDict = TRANSLATIONS as any;
        const currentLangDict = translationsDict?.[lang] || {};
        const fallbackLangDict = translationsDict?.es || {};

        let str: string = currentLangDict?.[key] ?? fallbackLangDict?.[key] ?? String(key);

        if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
            str = str.replace(`{${k}}`, String(v));
          });
        }
        
        return str;
      },

      reset: () => set({ currentSpot: null, isRadarActive: false }),
    }),
    { name: "spotsync-store", partialize: (s) => ({ language: s.language, theme: s.theme, accentColor: s.accentColor }) }
  )
);