export type SpotStatus = "AVAILABLE" | "OCCUPIED" | "EXPIRED";
export type VehicleSize = "MOTO" | "COMPACT" | "SUV" | "VAN";
export type SpotSize = "SMALL" | "MEDIUM" | "LARGE";
export type ParkingType = "PARALLEL" | "BATTERY" | "ANGLE";
export type ZoneType = "FREE" | "BLUE" | "GREEN";
export type Language = "es" | "en";
export type Theme = "light" | "dark" | "system";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: string;
  points: number;
  stars?: number;
  karmaScore: number;
  isVerified: boolean;
  language: Language;
  theme: Theme;
  accentColor: string;
  customMarker?: string;
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
  spotSize: SpotSize;
  parkingType: ParkingType;
  zoneType: ZoneType;
  isLeaving: boolean;
  moreSpotsNearby?: number;
  availableAt: string;
  expiresAt: string;
  createdAt: string;
  leaver?: Pick<User, "id" | "name" | "image" | "karmaScore" | "customMarker">;
  distance?: number;
  minutesAgo?: number;
  countdownMinutes?: number;
}

export interface NearbySpot extends Spot {
  distance: number;
  minutesAgo: number;
  leaver: Pick<User, "id" | "name" | "image" | "karmaScore" | "customMarker">;
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

export interface RealtimeParkingSpot {
  id: string;
  ownerId: string;
  legacySpotId?: string | null;
  lat: number;
  lng: number;
  status: "DISPONIBLE" | "RESERVADA_EN_CAMINO" | "OCUPADA" | "INACTIVA";
  lockedUntil: string | null;
  updatedAt: string;
}

export interface ReservationRecord {
  id: string;
  userId: string;
  parkingSpotId: string;
  status: "PENDING" | "EN_CAMINO" | "COMPLETADA" | "CANCELADA" | "EXPIRADA";
  originLat: number | null;
  originLng: number | null;
  etaMinutes: number | null;
  distanceKm: number | null;
  enRouteAt: string | null;
  arrivedAt: string | null;
  starsAwarded: number;
  parkingSpot?: RealtimeParkingSpot;
}

export interface ReleaseSpotPayload {
  latitude: number;
  longitude: number;
  locationDesc?: string;
  notes?: string;
  vehicleSize: VehicleSize;
  spotSize: SpotSize;
  parkingType: ParkingType;
  zoneType: ZoneType;
  isLeaving: boolean;
  moreSpotsNearby?: number;
  availableAt?: string;
  releaseDelayMinutes?: number;
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
    navigateInApp: "Navegar en la app",
    routeCardTitle: "Ruta hacia el aparcamiento",
    cancelRoute: "Cancelar ruta",
    routeCalculating: "Calculando ruta con tráfico…",
    routeEta: "Tiempo estimado",
    routeDistance: "Distancia",
    startRouteAndReserve: "Iniciar ruta y reservar",
    startingRoute: "Calculando ruta y bloqueando plaza…",
    routeInProgress: "En camino · check-in automático activo",
    checkingIn: "Confirmando llegada…",
    distanceToSpotMeters: "A {n} m de la plaza",
    arrivalConfirmed: "¡Has llegado!",
    reservationCompleted: "La reserva se completó correctamente.",
    driverStarsEarned: "Estrellas para ti",
    ownerStarsEarned: "Estrellas para el propietario",
    done: "Hecho",
    chooseNavigationApp: "Elige una aplicación de navegación",
    googleMaps: "Google Maps",
    waze: "Waze",
    appleMaps: "Apple Maps",
    gettingNavigationOrigin: "Obteniendo tu ubicación actual…",
    navigationLocationError: "No se pudo obtener tu ubicación actual. Activa el permiso para trazar la ruta desde tu posición.",
    retryLocation: "Volver a intentar ubicación",
    minutesAgo: "hace {n} min",
    hoursAgo: "hace {n} h",
    likelyOccupied: "Puede que ya esté ocupado",
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
    themeSavedLocally: "Tema guardado en este dispositivo.",
    save: "Guardar",
    locationSearching: "Buscando tu ubicación…",
    reminderTitle: "Recordatorio útil",
    reminderMessage: "Si sales de casa, publica tu plaza cuando te vayas para ayudar a otros vecinos.",
    dashboardEnableLocation: "Activa la ubicación para ver aparcamientos cerca de ti.",
    findDestination: "Buscar destino…",
    searchAddressPlaceholder: "Escribe una calle o dirección",
    selectOnMap: "Seleccionar en el mapa",
    searchingAddresses: "Buscando direcciones…",
    noAddressResults: "No se encontraron coincidencias.",
    clearSearch: "Borrar búsqueda",
    useMyLocation: "Mi ubicación",
    searchingAround: "Buscando plazas cerca de {place}",
    tapMapToChoose: "Toca el mapa para fijar el punto de búsqueda.",
    mapPoint: "Punto seleccionado en el mapa",
    radius: "Radio:",
    car: "Coche",
    fourByFour: "4x4",
    motorcycle: "Moto",
    van: "Furgoneta",
    freeZone: "Zona Gratis",
    blueZone: "Zona Azul",
    greenZone: "Zona Verde",
    smallSpot: "Pequeña",
    mediumSpot: "Mediana",
    largeSpot: "Grande",
    minutesShort: "min",
    closeNotice: "Cerrar aviso",
    radarSearch: "Buscar cerca de mí",
    spotsAvailable: "{n} disponibles",
    leavingSoon: "Sale pronto",
    locationExample: "Ej.: Frente al edificio azul, plaza #4",
    notesExample: "Ej.: Acera derecha, entre dos coches rojos…",
    spotSize: "Tamaño de plaza",
    releaseTime: "Tiempo de liberación",
    availableNow: "Ya disponible",
    releasingIn: "Dejo mi plaza en {n} min",
    moreSpotsToggle: "Hay más aparcamientos cerca",
    moreSpotsCount: "Cantidad de aparcamientos adicionales",
    moreSpotsInfo: "Hay {n} aparcamientos más cerca",
    occupySpot: "Ocupar este aparcamiento",
    shareCommunity: "Compartir hace comunidad",
    shareCommunityMessage: "Si cierras esta plaza sin reservar, compartirla ayuda a otros usuarios y reduce la presión sobre la ciudad.",
    availabilityWarning: "En zonas con alta demanda, la disponibilidad puede variar según el tiempo transcurrido desde su publicación.",
    ratePublisher: "Valora a quien publica la plaza",
    ratingHelps: "Tu valoración ayuda a mejorar la comunidad.",
    rewardsSubtitle: "Canjea tus puntos por recompensas visuales",
    rewardEarnTip: "Gana 10 puntos cada vez que liberas un aparcamiento.",
    active: "Activo",
    pointsCost: "{n} puntos",
    autoExpires: "Expira en 2 horas automáticamente",
    pointsEarned: "+10 puntos ganados",
    viewOnMap: "Ver en el mapa",
    broadcastCanceled: "Publicación cancelada.",
    signInSubtitle: "Aparcamiento urbano, reimaginado",
    yourEmail: "Tu email",
    enterEmail: "Introduce tu email para continuar",
    signInFailed: "No se pudo iniciar sesión. Inténtalo de nuevo.",
    signInButton: "Entrar →",
    oauthNote: "El acceso con Google estará disponible cuando se configure.",
    requiredName: "Tu nombre es requerido",
    namePlaceholder: "Tu nombre",
    mapPreparing: "Preparando el mapa…",
    mapLoadFailed: "No se pudo cargar el mapa.",
    dashboardError: "Ha ocurrido un problema al iniciar el dashboard. Puedes volver a intentarlo.",
    retryMap: "Reintentar cargar el mapa",
    geoBlocked: "El navegador tiene bloqueada la ubicación para este sitio. Habilítala desde el candado o los ajustes de la barra de direcciones.",
    geoHttp: "La geolocalización no está disponible por HTTP en esta red. Accede por HTTPS para activar la ubicación.",
    geoUnavailable: "La ubicación no está disponible temporalmente. Inténtalo de nuevo en unos segundos.",
    geoUnsupported: "La geolocalización no está disponible en este navegador.",
    geoGeneral: "No se pudo obtener la ubicación del dispositivo.",
    mapNotConfigured: "El mapa no está configurado. Comprueba el token de Mapbox.",
    mapLoading: "Cargando mapa…",
    mapStylePickerLabel: "Estilo del mapa",
    mapLayers: "Capas",
    mapStyleStreets: "Calles",
    mapStyleSatellite: "Satélite",
    mapStyleDark: "Oscuro",
    mapStyleTerrain: "Terreno 3D",
    occupyThanks: "Plaza ocupada. Gracias por compartir y valorar al usuario.",
    occupyFailed: "No se pudo ocupar la plaza.",
    closeDetails: "Cerrar detalle de plaza",
    rateWithStars: "Valorar con {n} estrellas",
    radarFound: "He encontrado {n} plaza(s) cerca de ti.",
    radarEmpty: "No hay plazas libres cerca de ti en este momento.",
    rewardActivated: "¡{name} activado!",
    unlockedRewards: "Premios desbloqueados",
    restoreOriginalColor: "Restaurar color original",
    originalColorRestored: "Color original restaurado.",
    rewardsCatalog: "Recompensas",
    noUnlockedRewards: "Aún no has desbloqueado marcadores personalizados.",
    appColor: "Color de la aplicación",
    spotEmoji: "Marcador personalizado",
    preferenceApplied: "Preferencia aplicada.",
    nameUpdated: "Nombre actualizado.",
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
    navigateInApp: "Navigate in app",
    routeCardTitle: "Route to parking spot",
    cancelRoute: "Cancel route",
    routeCalculating: "Calculating route with traffic…",
    routeEta: "Estimated time",
    routeDistance: "Distance",
    startRouteAndReserve: "Start route and reserve",
    startingRoute: "Calculating route and locking spot…",
    routeInProgress: "En route · automatic check-in active",
    checkingIn: "Confirming arrival…",
    distanceToSpotMeters: "{n} m from the spot",
    arrivalConfirmed: "You have arrived!",
    reservationCompleted: "The reservation was completed successfully.",
    driverStarsEarned: "Stars for you",
    ownerStarsEarned: "Stars for the owner",
    done: "Done",
    chooseNavigationApp: "Choose a navigation app",
    googleMaps: "Google Maps",
    waze: "Waze",
    appleMaps: "Apple Maps",
    gettingNavigationOrigin: "Getting your current location…",
    navigationLocationError: "Could not get your current location. Enable location access to route from where you are.",
    retryLocation: "Retry location",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    likelyOccupied: "Might already be taken",
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
    themeSavedLocally: "Theme saved on this device.",
    save: "Save",
    locationSearching: "Finding your location…",
    reminderTitle: "Helpful reminder",
    reminderMessage: "If you are heading out, post your spot as you leave to help nearby drivers.",
    dashboardEnableLocation: "Enable location to see nearby parking spots.",
    findDestination: "Search destination…",
    searchAddressPlaceholder: "Enter a street or address",
    selectOnMap: "Select on map",
    searchingAddresses: "Searching addresses…",
    noAddressResults: "No matching addresses found.",
    clearSearch: "Clear search",
    useMyLocation: "My location",
    searchingAround: "Searching for spots near {place}",
    tapMapToChoose: "Tap the map to set the search point.",
    mapPoint: "Point selected on map",
    radius: "Radius:",
    car: "Car",
    fourByFour: "4x4",
    motorcycle: "Motorcycle",
    van: "Van",
    freeZone: "Free zone",
    blueZone: "Blue zone",
    greenZone: "Green zone",
    smallSpot: "Small",
    mediumSpot: "Medium",
    largeSpot: "Large",
    minutesShort: "min",
    closeNotice: "Close notice",
    radarSearch: "Search near me",
    spotsAvailable: "{n} available",
    leavingSoon: "Leaving soon",
    locationExample: "E.g. In front of the blue building, spot #4",
    notesExample: "E.g. Right-hand sidewalk, between two red cars…",
    spotSize: "Spot size",
    releaseTime: "Release time",
    availableNow: "Available now",
    releasingIn: "Leaving in {n} min",
    moreSpotsToggle: "There are more parking spots nearby",
    moreSpotsCount: "Number of additional spots",
    moreSpotsInfo: "There are {n} more spots nearby",
    occupySpot: "Occupy this parking spot",
    shareCommunity: "Sharing builds community",
    shareCommunityMessage: "If you close this spot without reserving it, sharing helps other users and reduces pressure on the city.",
    availabilityWarning: "In high-demand areas, availability may change depending on how long ago the spot was posted.",
    ratePublisher: "Rate the person who posted this spot",
    ratingHelps: "Your rating helps improve the community.",
    rewardsSubtitle: "Redeem your points for visual rewards",
    rewardEarnTip: "Earn 10 points every time you release a parking spot.",
    active: "Active",
    pointsCost: "{n} points",
    autoExpires: "Expires automatically in 2 hours",
    pointsEarned: "+10 points earned",
    viewOnMap: "View on map",
    broadcastCanceled: "Broadcast canceled.",
    signInSubtitle: "Urban parking, reimagined",
    yourEmail: "Your email",
    enterEmail: "Enter your email to continue",
    signInFailed: "Could not sign in. Please try again.",
    signInButton: "Sign in →",
    oauthNote: "Google sign-in will be available once configured.",
    requiredName: "Your name is required",
    namePlaceholder: "Your name",
    mapPreparing: "Preparing the map…",
    mapLoadFailed: "Could not load the map.",
    dashboardError: "There was a problem starting the dashboard. You can try again.",
    retryMap: "Retry loading map",
    geoBlocked: "This site is blocked from accessing your location. Enable it using the lock icon or address-bar site settings.",
    geoHttp: "Geolocation is unavailable over HTTP on this network. Use HTTPS to enable location.",
    geoUnavailable: "Location is temporarily unavailable. Please try again in a few seconds.",
    geoUnsupported: "Geolocation is unavailable in this browser.",
    geoGeneral: "Could not get the device location.",
    mapNotConfigured: "The map is not configured. Check the Mapbox token.",
    mapLoading: "Loading map…",
    mapStylePickerLabel: "Map style",
    mapLayers: "Layers",
    mapStyleStreets: "Streets",
    mapStyleSatellite: "Satellite",
    mapStyleDark: "Dark",
    mapStyleTerrain: "3D terrain",
    occupyThanks: "Spot marked occupied. Thanks for sharing and rating the user.",
    occupyFailed: "Could not mark this spot as occupied.",
    closeDetails: "Close spot details",
    rateWithStars: "Rate with {n} stars",
    radarFound: "Found {n} parking spot(s) near you.",
    radarEmpty: "There are no available parking spots nearby right now.",
    rewardActivated: "{name} activated!",
    unlockedRewards: "Unlocked rewards",
    restoreOriginalColor: "Restore original color",
    originalColorRestored: "Original color restored.",
    rewardsCatalog: "Rewards",
    noUnlockedRewards: "You have not unlocked any custom markers yet.",
    appColor: "App color",
    spotEmoji: "Custom marker",
    preferenceApplied: "Preference applied.",
    nameUpdated: "Name updated.",
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
