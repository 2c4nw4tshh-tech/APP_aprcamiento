export function triggerHaptic(duration = 12) {
  if (typeof window !== "undefined" && window.navigator?.vibrate) {
    window.navigator.vibrate(duration);
  }
}
