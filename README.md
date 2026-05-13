# testmyhifdh

A clean, focused tool for testing Quran memorization. Pick a range — juz(s), a span of surahs (down to specific ayahs), or a page range — and the app rolls a random ayah from it. Recite what comes next from memory, then reveal the next ayah (or the next ten) to check yourself.

Live at **[testmyhifdh.com](https://testmyhifdh.com)**.

## Features

### Range selection

- **Three ways to scope the test**: by juz, by surah range, or by page range. In surah mode you can narrow the bounds to specific ayahs within the first and last surah (e.g. *Al-Baqarah 50 – Aal-Imran 100*).
- **Multi-juz selection**: pick any combination of juzs — consecutive (1–5), non-consecutive (1, 5, 30), or anything in between. The roll pool is the union; gap juzs are excluded.
- **Two-tap range fill**: tap one juz, then tap another — every juz between them joins the selection. The anchor highlights amber until the second tap. Same pattern works for ayah ranges inside the drill-down customizer.
- **Drag to select**: drag across the juz grid (or ayah grid) to fill the range between drag start and pointer. The selection always matches "everything between anchor and current pointer" — drag back and cells revert.
- **Customize range** (drill-down from the Juz tab on either screen): from selected juz(s) → list of surahs → ayah-by-ayah picker. Tap, drag, or two-tap to refine; uncheck individual ayahs you want to skip.
- **Clear button** on the juz grid resets the selection. Begin / Apply disable while nothing is selected.

### Quiz mechanics

- **Per-ayah uniform weighting**: every ayah in your selected range has the same probability of being rolled, so longer surahs, pages, and ayah subranges proportionally show up more often.
- **Final ayahs are never the prompt**: the last ayah of any surah *and* the last ayah of your selected range are excluded from the random roll — if either got rolled there'd be nothing to recite. You can still reveal them.
- **Range pill** on the quiz screen: tap the range label in the top-right to switch juzs / surahs / pages (or open the customizer) without leaving the test.
- **Range survives back navigation**: tapping Back on the quiz screen returns to the home picker with your last selection still seeded — no need to reselect every juz.
- **Vertical reveal reel** with a soft top-fade mask: revealed ayahs flow through a fixed-height region; the page itself never scrolls.
- **Calligraphic Bismillah header** when reveals cross into a new surah, shown once as a ligature (﷽) above the next ayah card — never duplicated inline.
- **Last-ayah indicator** on revealed cards so you know when you've reached the end of a surah while checking; an "End of range" line shows when you've revealed past the last ayah of your selection.

### Typography

- **QPC v4 per-page Hafs fonts**: each of the Mushaf's 604 pages is rendered with its own font file — words ligate as their original PUA glyphs (no Unicode reflow), the layout matches the printed Mushaf.
- **Tajweed mode**: unified rendering pipeline uses CPAL color palettes to switch between plain and tajweed-colored letters at runtime — same font, no extra download, theme-aware (palette flips for dark mode).
- **Mushaf-style ayah end markers**: the Arabic-Indic digits at the end of each ayah ligate into the KFGQPC rosette ornament.

### Settings

Reachable from a cog on either screen, persisted to localStorage.

- *Theme*: light or dark (one-click sun/moon toggle on the home screen)
- *Text size*: a granular slider, 16–48 px
- *Hide surah names* — for a stricter test
- *Test first ayahs* — when the random pick lands on ayah 1, show only the surah name and recall the opening from there
- *Show ayah numbers* — show or hide the end-of-ayah marker
- *Tajweed* — color letters by their tajweed rule
- *Language* — English / العربية / اردو (RTL handled via `<html dir="rtl">`)

### Keyboard shortcuts

The whole app is keyboard-navigable. Form fields are skipped so you can still type juz / page / ayah numbers.

| Where | Key | Action |
|---|---|---|
| Quiz | `Space` | Reveal next ayah |
| Quiz | `Shift+Space` / `Enter` | Reveal next 10 |
| Quiz | `→` / `↓` | Reveal next ayah |
| Quiz | `N` / `R` | Next random ayah |
| Quiz | `Esc` / `Backspace` | Back to home (or close topmost overlay) |
| Quiz | `S` | Toggle settings |
| Quiz | `T` | Toggle theme |
| Home | `1` / `2` / `3` | Switch to Juz / Surah / Page tab |
| Home | `Enter` | Begin |
| Home | `S` | Toggle settings |
| Home | `T` | Toggle theme |
| Anywhere | `Esc` | Close the active overlay (settings, range picker, or customizer) |
| Customizer | `Enter` | Apply (surah list) / step back (ayah view) |

### Platform

- **PWA-ready**: web manifest, Apple touch icon, and theme-color meta tag that follows the active theme (the iPhone status-bar safe area tints accordingly).
- **Swipe-right** anywhere on the quiz screen to go back, on touch devices.

## Stack

- [Vite](https://vitejs.dev/) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- [Vercel Analytics](https://vercel.com/docs/analytics) for usage metrics
- QPC v4 tajweed runs preprocessed into `src/data/ayahs-tajweed.json` (~648 KB raw, ~60 KB gzipped) — bundled with the app, no runtime API calls
- Self-hosted QPC v4 per-page woff2 fonts in `public/fonts/qpc-v4/` (604 files, lazy-registered via the `FontFace` API as ayahs need them)
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
├── App.tsx                       state owner: range, lastRange, settings
├── main.tsx                      mounts the app + Vercel Analytics
├── index.css                     Tailwind, dark variant, fonts, mask gradient
├── components/
│   ├── RangeSelector.tsx         home screen — pick juzs / surahs / pages
│   ├── QuizScreen.tsx            quiz screen — current ayah + reveal reel + range popover
│   ├── JuzCustomizer.tsx         drill-down range refinement (juz → surah → ayah)
│   ├── AyahText.tsx              renders QPC v4 PUA runs as page-tagged spans
│   ├── SettingsOverlay.tsx       floating settings overlay + backdrop
│   └── SettingsPanel.tsx         settings UI (toggles + preferences sub-page)
├── data/
│   ├── ayahs-tajweed.json        surah:ayah → tajweed-tagged PUA runs by page
│   ├── quran-meta.ts             surahs[], juzData[], range helpers, weighted pick
│   └── quran-tajweed.ts          per-page FontFace registry + CPAL palette CSS
├── hooks/
│   ├── usePersistedState.ts      useState that mirrors to localStorage
│   ├── useDragSelect.ts          drag-to-range-fill multi-select with tap fallback
│   └── useKeyboard.ts            global keydown handler (form-field aware)
├── i18n/
│   ├── translations.ts           en / ar / ur dictionaries + RTL helper
│   └── useT.ts                   tiny translation hook
└── types/
    └── range.ts                  SelectedRange + juz normalization helpers
public/
├── fonts/qpc-v4/p{1..604}.woff2  per-page QPC v4 color fonts (CPAL palettes)
├── fonts/UthmanicHafs1Ver18.woff2  legacy fallback for the Bismillah glyph
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
