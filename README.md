# testmyhifdh

A clean, focused tool for testing Quran memorization. Pick a range — a juz, a span of surahs (down to specific ayahs), or a page range — and the app rolls a random ayah from it. Recite what comes next from memory, then reveal the next ayah (or the next ten) to check yourself.

Live at **[testmyhifdh.com](https://testmyhifdh.com)**.

## Features

- **Three ways to scope the test**: by juz, by surah range, or by page range. In surah mode you can narrow the bounds to specific ayahs within the first and last surah (e.g. *Al-Baqarah 50 – Aal-Imran 100*).
- **Surah-uniform weighting**: every surah in your range is rolled with equal probability so short surahs don't get drowned out by long ones. Within a surah, ayahs are uniform.
- **Final ayahs are never the prompt**: the last ayah of any surah is excluded from the random roll. If you got rolled the ending there'd be nothing to recite. You can still reveal it.
- **Vertical reveal reel** with a soft top-fade mask: revealed ayahs flow through a fixed-height region; the page itself never scrolls.
- **Calligraphic Bismillah header** when reveals cross into a new surah, shown once as a ligature (﷽) above the next ayah card — never duplicated inline.
- **Mushaf-style ayah end markers**: the Arabic-Indic digits at the end of each ayah ligate into the KFGQPC rosette ornament.
- **Settings panel** (reachable from a cog on either screen, persisted to localStorage):
  - *Theme*: light or dark (with a one-click sun/moon toggle on the home screen)
  - *Text size*: SM / MD / LG / XL
  - *Hide surah names* — for a stricter test
  - *Test first ayahs* — when the random pick lands on ayah 1, show only the surah name and recall the opening from there
  - *Show ayah numbers* — show or hide the end-of-ayah marker
- **Range-pill picker** on the quiz screen: tap the range label in the top-right to switch juz / surah / page without leaving the test.
- **Last-ayah indicator** on revealed cards so you know when you've reached the end of a surah while checking.
- **PWA-ready**: web manifest, Apple touch icon, and theme-color meta tag that follows the active theme (the iPhone status-bar safe area tints accordingly).

## Stack

- [Vite](https://vitejs.dev/) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- [Vercel Analytics](https://vercel.com/docs/analytics) for usage metrics
- QPC Hafs word-by-word data preprocessed into `src/data/ayahs.json` (1.4 MB raw, ~400 KB gzipped) — bundled with the app, no runtime API calls
- Self-hosted KFGQPC Uthmanic Hafs woff2 font in `public/fonts/`
- Deployed on [Vercel](https://vercel.com/) with HSTS, CSP, X-Frame-Options, Referrer-Policy, and Permissions-Policy set in [`vercel.json`](./vercel.json)

## Local development

```bash
git clone https://github.com/yousefismail01/testmyhifdh.git
cd testmyhifdh
npm install
npm run dev
```

Open <http://localhost:5173>.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over `src/` |

## Project layout

```
src/
├── App.tsx                       state owner: range, settings, transition
├── main.tsx                      mounts the app + Vercel Analytics
├── index.css                     Tailwind, dark variant, fonts, mask gradient
├── components/
│   ├── RangeSelector.tsx         home screen — pick juz / surah / page range
│   ├── QuizScreen.tsx            quiz screen — current ayah + reveal reel
│   └── SettingsPanel.tsx         shared settings UI (theme, size, toggles)
├── data/
│   ├── ayahs.json                surah:ayah → Uthmani text (preprocessed)
│   ├── quran-api.ts              fetchAyahText reader over ayahs.json
│   └── quran-meta.ts             surahs[], juzData[], range helpers, weighted pick
├── hooks/
│   └── usePersistedState.ts      useState that mirrors to localStorage
public/
├── fonts/UthmanicHafs1Ver18.woff2
├── icon-*.png, apple-touch-icon.png, favicon-32.png
└── manifest.webmanifest
```

## Deployment

The app is a fully static SPA — any static host works. Production is on Vercel with framework preset **Vite** (auto-detected), output `dist`, and **no environment variables required at runtime**.

Security headers are defined in [`vercel.json`](./vercel.json):

- `Strict-Transport-Security` with preload
- `Content-Security-Policy` restricted to `'self'` plus the exact origins used (Google Fonts, Vercel Analytics)
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation, and FLoC

Vercel Analytics endpoints (`va.vercel-scripts.com`, `vitals.vercel-insights.com`) are explicitly whitelisted in the CSP.

## License

MIT
