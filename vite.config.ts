// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      // Offline support. Registration happens only in src/lib/pwa-register.ts (guarded).
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        manifest: false, // public/manifest.webmanifest is the manifest
        filename: "sw.js",
        outDir: "dist/client",
        devOptions: { enabled: false },
        workbox: {
          globPatterns: ["**/*.{js,css,png,svg,ico,webmanifest,woff2}"],
          // SSR app: no static HTML shell to fall back to; pages are cached NetworkFirst below.
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: { cacheName: "zuzu-pages", networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "zuzu-fonts",
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: ({ url }) => url.origin === "https://i.ibb.co",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "zuzu-logo", expiration: { maxEntries: 10 } },
            },
          ],
        },
      }),
    ],
  },
});
