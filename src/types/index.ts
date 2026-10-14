export type SpotStatus = "AVAILABLE" | "OCCUPIED" | "EXPIRED";
export type VehicleSize = "COMPACT" | "SUV" | "VAN";
export type ParkingType = "PARALLEL" | "BATTERY" | "ANGLE";
export type ZoneType = "FREE" | "METERED" | "BLUE" | "GREEN";
export type Language = "es" | "en";
export type Theme = "light" | "dark" | "system";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: string;
  points: number;
  karmaScore: number;
  isVerified: boolean;
  language: Language;
  theme: Theme;
  accentColor: string;
  onboarded: boolean;
  createdAt: string;
}

export interface Spot {
  id: string;
  leaverId: string;
  status: SpotStatus;
  latitude: number;
  longitude: number;
  locationDesc?: string;
  notes?: string;
  vehicleSize: VehicleSize;
  parkingType: ParkingType;
  zoneType: ZoneType;
  isLeaving: boolean;
  expiresAt: string;
  createdAt: string;
  leaver?: Pick<User, "id" | "name" | "image" | "karmaScore">;
  distance?: number;
  minutesAgo?: number;
}

export interface NearbySpot extends Spot {
  distance: number;
  minutesAgo: number;
  leaver: Pick<User, "id" | "name" | "image" | "karmaScore">;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  type: string;
  value: string;
  cost: number;
  emoji: string;
}

export interface Redemption {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
  item: RewardItem;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ReleaseSpotPayload {
  latitude: number;
  longitude: number;
  locationDesc?: string;
  notes?: string;
  vehicleSize: VehicleSize;
  parkingType: ParkingType;
  zoneType: ZoneType;
  isLeaving: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface OnboardingPayload {
  name: string;
  language: Language;
}

export const TRANSLATIONS = {
  es: {
    appName: "SpotSync",
    tagline: "Aparcamiento urbano, reimaginado",
    dashboard: "Mapa",
    find: "Buscar",
    release: "Liberar",
    rewards: "Recompensas",
    profile: "Perfil",
    settings: "Ajustes",
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    withGoogle: "Continuar con Google",
    withEmail: "Continuar con Email",
    withApple: "Continuar con Apple",
    iAmLeaving: "Me voy pronto",
    available: "Disponible",
    occupied: "Ocupado",
    reportOccupied: "Reportar como ocupado",
    navigateTo: "Cómo llegar",
    minutesAgo: "hace {n} min",
    hoursAgo: "hace {n} h",
    likelyOccupied: "⚠️ Puede que ya esté ocupado",
    points: "puntos",
    earnPoints: "Ganas {n} puntos por liberar",
    redeem: "Canjear",
    redeemed: "Canjeado",
    notEnoughPoints: "Puntos insuficientes",
    yourPoints: "Tus puntos",
    rewardsShop: "Tienda de recompensas",
    accentColor: "Color principal",
    name: "Nombre",
    language: "Idioma",
    theme: "Tema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystem: "Sistema",
    save: "Guardar",
    cancel: "Cancelar",
    welcome: "¡Bienvenido a SpotSync!",
    onboardingSubtitle: "Cuéntanos un poco sobre ti para empezar",
    yourName: "Tu nombre",
    preferredLanguage: "Idioma preferido",
    continue: "Continuar",
    noSpotsNearby: "No hay aparcamientos cerca",
    checkLater: "Inténtalo más tarde o amplía el radio",
    releaseYours: "Libera el tuyo",
    spotDetails: "Detalles del aparcamiento",
    notes: "Notas",
    vehicleSize: "Tamaño del vehículo",
    parkingType: "Tipo de aparcamiento",
    zone: "Zona",
    leavingIn: "Me voy en",
    broadcastSpot: "Publicar mi aparcamiento",
    broadcasting: "Publicando",
    spotIsLive: "Tu aparcamiento está en el mapa",
    cancelBroadcast: "Cancelar publicación",
    spotReported: "¡Gracias! Aparcamiento reportado como ocupado",
    spotReleased: "¡Genial! Has ganado {n} puntos",
    enableLocation: "Activa la ubicación para ver aparcamientos cercanos",
    allowLocation: "Permitir ubicación",
    spanish: "Español",
    english: "English",
  },
  en: {
    appName: "SpotSync",
    tagline: "Urban parking, reimagined",
    dashboard: "Map",
    find: "Find",
    release: "Release",
    rewards: "Rewards",
    profile: "Profile",
    settings: "Settings",
    signIn: "Sign in",
    signOut: "Sign out",
    withGoogle: "Continue with Google",
    withEmail: "Continue with Email",
    withApple: "Continue with Apple",
    iAmLeaving: "Leaving soon",
    available: "Available",
    occupied: "Occupied",
    reportOccupied: "Report as occupied",
    navigateTo: "Navigate",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    likelyOccupied: "⚠️ Might already be taken",
    points: "points",
    earnPoints: "Earn {n} points for releasing",
    redeem: "Redeem",
    redeemed: "Redeemed",
    notEnoughPoints: "Not enough points",
    yourPoints: "Your points",
    rewardsShop: "Rewards Shop",
    accentColor: "Accent color",
    name: "Name",
    language: "Language",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    save: "Save",
    cancel: "Cancel",
    welcome: "Welcome to SpotSync!",
    onboardingSubtitle: "Tell us a bit about yourself to get started",
    yourName: "Your name",
    preferredLanguage: "Preferred language",
    continue: "Continue",
    noSpotsNearby: "No spots nearby",
    checkLater: "Try again later or expand the radius",
    releaseYours: "Release yours",
    spotDetails: "Spot details",
    notes: "Notes",
    vehicleSize: "Vehicle size",
    parkingType: "Parking type",
    zone: "Zone",
    leavingIn: "Leaving in",
    broadcastSpot: "Broadcast my spot",
    broadcasting: "Broadcasting",
    spotIsLive: "Your spot is live on the map",
    cancelBroadcast: "Cancel broadcast",
    spotReported: "Thanks! Spot reported as occupied",
    spotReleased: "Nice! You earned {n} points",
    enableLocation: "Enable location to see nearby spots",
    allowLocation: "Allow location",
    spanish: "Español",
    english: "English",
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.es;
