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
        // Precache only the app shell + small always-needed assets.
        // Everything in /data/ and /fonts/qpc-v4/ caches lazily on
        // first use through the runtimeCaching rules below.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}', 'fonts/UthmanicHafs1Ver18.woff2'],
        globIgnores: [
          '**/fonts/qpc-v4/**',
          '**/data/**',
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
            // Recitations from Tarteel's CDN. NetworkOnly so the
            // service worker doesn't intercept the audio request —
            // Workbox's range-response handling can confuse iOS Safari
            // and break playback on mobile. Trade-off: no offline
            // audio for now, but reliable mobile playback.
            urlPattern: /^https:\/\/audio-cdn\.tarteel\.ai\/quran\/.*\.mp3$/,
            handler: 'NetworkOnly',
          },
          {
            // Per-reciter segment-timing JSON for surah-mode recitations.
            urlPattern: /\/data\/segments-.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'reciter-segments',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Per-(reciter, surah) word-timing slices in
            // /data/words-{slug}/{surah}.json. ~3–10 KB gzipped each;
            // immutable per surah.
            urlPattern: /\/data\/words-.+\/\d+\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'reciter-words',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Per-surah translation slices in /data/translation-en-sahih/{surah}.json.
            // Tiny files, ~3 KB gzipped each — typical session touches a
            // handful of surahs. CacheFirst is fine since the content
            // for a given surah is immutable.
            urlPattern: /\/data\/translation-.*\/\d+\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'translations',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Similar-ayahs (mutashabihat) lookup table — small enough
            // that stale-while-revalidate is fine.
            urlPattern: /\/data\/similar-ayahs\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'similar-ayahs',
              cacheableResponse: { statuses: [0, 200] },
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
