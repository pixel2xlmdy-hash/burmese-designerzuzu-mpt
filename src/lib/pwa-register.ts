// The ONLY place the offline service worker is registered.
// Never registers in dev, inside iframes, or on Lovable preview hosts; there it removes stale copies.

const SW_URL = "/sw.js";
const PROJECT_ID = "89da7936-6005-4cd0-86a4-15d0710ae9ed";
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const LOVABLE_PREVIEW_DOMAINS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const firstLabel = host.split(".")[0] ?? "";
  const onLovableDomain = LOVABLE_PREVIEW_DOMAINS.some((d) => host.endsWith(d));
  if (onLovableDomain && PREVIEW_LABEL.test(firstLabel)) return true;
  if (onLovableDomain && firstLabel === `project--${PROJECT_ID}-dev`) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith(SW_URL)))
      .map((r) => r.unregister()),
  );
}

/** Call once from a useEffect. */
export function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    void unregisterAppWorkers().catch(() => undefined);
    return;
  }
  void navigator.serviceWorker
    .register(SW_URL, { scope: "/" })
    .then(async () => {
      await navigator.serviceWorker.ready;
      // Warm the page cache so the app opens offline even after its first visit.
      try {
        const cache = await caches.open("zuzu-pages");
        const res = await fetch("/", { credentials: "same-origin" });
        if (res.ok) await cache.put("/", res);
      } catch {
        /* offline right now — the next visit will cache it */
      }
    })
    .catch((e) => console.warn("Offline support unavailable", e));
}
