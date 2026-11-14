import { useSyncExternalStore } from "react";

// Shared "may this person see ads?" flag. The bottom AdBanner owns the VIP check
// and publishes the result here so other ad spots (header) follow the same rule.
let adsAllowed = false;
const listeners = new Set<() => void>();

export function setAdsAllowed(next: boolean) {
  if (adsAllowed === next) return;
  adsAllowed = next;
  listeners.forEach((l) => l());
}

export function useAdsAllowed() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => adsAllowed,
    () => false,
  );
}
