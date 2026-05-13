import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // The existing /manifest.webmanifest in public/ is the source of
      // truth — don't have the plugin generate one. We do let it inject
      // the link tag.
      manifest: false,
      includeAssets: [
        'manifest.webmanifest',
        'favicon-32.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'fonts/UthmanicHafs1Ver18.woff2',
      ],
      workbox: {
        // Precache everything Vite builds plus the small set of always-
        // needed assets in public/. We deliberately do NOT precache the
        // 604 QPC v4 page fonts or the tajweed JSON: that's >10 MB of
        // data the user might never need. Both have runtime caching
        // rules instead, so they cache lazily on first use.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ico}'],
        globIgnores: [
          '**/fonts/qpc-v4/**',
          '**/data/ayahs-tajweed.json',
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // SPA fallback so deep links work offline.
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Per-page QPC v4 fonts: cache-first because each is fully
            // immutable (named after page number) and visiting a page
            // again should be instant.
            urlPattern: /\/fonts\/qpc-v4\/p\d+\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'qpc-v4-fonts',
              expiration: {
                maxEntries: 604,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tajweed JSON: stale-while-revalidate so a fresh visit
            // refreshes the data quietly while serving the cached copy
            // first.
            urlPattern: /\/data\/ayahs-tajweed\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tajweed-data',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Husary recitations from Tarteel's CDN — cache-first so once
            // you've heard an ayah it plays instantly the next time and
            // works offline.
            urlPattern: /^https:\/\/audio-cdn\.tarteel\.ai\/quran\/husary\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ayah-audio-husary',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2500,
  },
})
