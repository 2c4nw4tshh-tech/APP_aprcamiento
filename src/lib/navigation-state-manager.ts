import type { NavigationState } from "@/types/navigation";

const transitions: Record<NavigationState, ReadonlySet<NavigationState>> = {
  idle: new Set<NavigationState>(["idle", "searching", "destination_selected", "calculating_route", "error_recoverable"]),
  searching: new Set<NavigationState>(["searching", "destination_selected", "idle", "error_recoverable"]),
  destination_selected: new Set<NavigationState>(["calculating_route", "idle", "error_recoverable"]),
  calculating_route: new Set<NavigationState>(["calculating_route", "route_available", "error_recoverable", "idle"]),
  route_available: new Set<NavigationState>(["route_available", "calculating_route", "navigation_active", "location_unavailable", "error_recoverable", "idle"]),
  navigation_active: new Set<NavigationState>(["navigation_active", "updating_position", "rerouting", "location_unavailable", "destination_reached", "calculating_route", "error_recoverable", "idle"]),
  updating_position: new Set<NavigationState>(["updating_position", "navigation_active", "rerouting", "location_unavailable", "destination_reached", "calculating_route", "error_recoverable", "idle"]),
  rerouting: new Set<NavigationState>(["rerouting", "navigation_active", "location_unavailable", "destination_reached", "calculating_route", "error_recoverable", "idle"]),
  location_unavailable: new Set<NavigationState>(["location_unavailable", "updating_position", "navigation_active", "rerouting", "destination_reached", "calculating_route", "error_recoverable", "idle"]),
  destination_reached: new Set<NavigationState>(["destination_reached", "calculating_route", "idle"]),
  error_recoverable: new Set<NavigationState>(["error_recoverable", "calculating_route", "route_available", "navigation_active", "location_unavailable", "rerouting", "idle"]),
};

export class NavigationStateManager {
  private current: NavigationState = "idle";

  get state() {
    return this.current;
  }

  transition(next: NavigationState): NavigationState {
    if (!transitions[this.current].has(next)) {
      throw new Error(`Transición de navegación no permitida: ${this.current} -> ${next}`);
    }
    this.current = next;
    return this.current;
  }

  reset() {
    this.current = "idle";
    return this.current;
  }
}
