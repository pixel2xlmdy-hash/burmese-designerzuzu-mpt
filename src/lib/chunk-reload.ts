// Recovers the screen when a route's code chunk can't be fetched.
// This happens when the browser holds an older module list than the server
// (a reload while the dev server restarts, or a fresh deploy in an open tab):
// the dynamic import of e.g. /src/routes/index.tsx rejects and the page goes blank.
// One automatic reload pulls the current chunks; a short cooldown stops a loop.

const RELOAD_KEY = "zuzu.chunkReload.v1";
const RELOAD_COOLDOWN_MS = 10_000;

const CHUNK_FAILURE =
  /Failed to fetch dynamically imported module|Error loading dynamically imported module|Importing a module script failed|unable to load chunk|ChunkLoadError|dynamically imported module/i;

/** True when a thrown value looks like "the code file for this page couldn't be loaded". */
export function isChunkLoadFailure(reason: unknown): boolean {
  if (reason instanceof Error) {
    if (reason.name === "ChunkLoadError") return true;
    const chain: unknown[] = [reason.message, reason.cause];
    for (const part of chain) {
      if (typeof part === "string" && CHUNK_FAILURE.test(part)) return true;
      if (part instanceof Error && CHUNK_FAILURE.test(part.message)) return true;
    }
    return false;
  }
  if (typeof reason === "string") return CHUNK_FAILURE.test(reason);
  return false;
}

/** Reloads the page at most once per cooldown window, so a genuinely missing file can't loop. */
export function reloadOnceForChunkFailure(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode): still reload, but the guard is gone.
  }
  window.location.reload();
  return true;
}

/** Call once, as early as the page code runs. Safe on the server (no-op). */
export function registerChunkRecovery() {
  if (typeof window === "undefined") return;

  // Vite's own signal for a dynamic import whose file is gone.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnceForChunkFailure();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadFailure(event.reason)) {
      event.preventDefault();
      reloadOnceForChunkFailure();
    }
  });

  window.addEventListener("error", (event) => {
    if (isChunkLoadFailure(event.error ?? event.message)) reloadOnceForChunkFailure();
  });
}
