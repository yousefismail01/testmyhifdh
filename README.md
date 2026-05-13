# testmyhifdh

A focused tool for testing Quran memorization. Pick a range — juz(s), a span of surahs (down to specific ayahs), or a page range — and the app rolls a random ayah from it. Recite what comes next from memory, then reveal the next ayah to check yourself, optionally with audio, translation, and similar-verse hints.

Live at **[testmyhifdh.com](https://testmyhifdh.com)**.

## Features

### Range selection

- **Three modes**: by juz, by surah range, or by page range. Surah mode lets you narrow to specific ayahs at either end (e.g. *Al-Baqarah 50 – Aal-Imran 100*).
- **Multi-juz selection**: pick any combination of juzs — consecutive (1–5), non-consecutive (1, 5, 30), or anything in between. The roll pool is the union; gap juzs are excluded.
- **Anchor-fill range pattern**: tap two juzs (or two ayahs in the customizer) to fill everything between them. Tap a selected item to uncheck.
- **Drag-to-select**: drag across the juz/ayah grid to fill the range between drag-start and the pointer. Drag back and cells revert to their pre-drag state, spreadsheet-style.
- **Customize range** drill-down from the Juz tab on either screen: juz(s) → list of surahs → per-ayah picker. Tap, two-tap anchor-fill, or drag to refine.
- **Surah combobox**: type-to-filter picker (search by number, English name, or Arabic name) with arrow-key nav. Replaces the native 114-entry `<select>`.
- **Mutashabihat-only mode**: restrict the roll pool to ayahs with at least one recorded similar verse (~2,500 ayahs).
- **Range survives back navigation**: clicking Back from the quiz returns to the picker with your last selection still in place.

### Quiz mechanics

- **Per-ayah uniform weighting**: every eligible ayah has equal probability of being rolled.
- **Smart pool filtering**: the rolled prompt is never the last ayah of its surah *and* never the last ayah of your selected range — in both cases there'd be nothing to reveal next.
- **Range pill** on the quiz screen: tap the range label in the top-right to switch juzs / surahs / pages (or customize) without leaving the test.
- **Vertical reveal reel** with a top-fade mask: revealed ayahs flow through a fixed-height region; the page itself never scrolls.
- **Calligraphic Bismillah header** (﷽) when reveals cross into a new surah, shown once.
- **Last-ayah indicator** and **end-of-range** marker on the reveal reel.

### Hints

- Hint button next to "Reveal next ayah". Tap to open a menu offering three progressive hint types targeted at the **next** ayah (the one you're trying to recite from memory):
  - **First word** — first N words shown in QPC v4 font; each press reveals one more word.
  - **Audio** — plays the first 1.5 s of the next ayah; each press extends by another 1.5 s, capped at the ayah's natural end.
  - **Translation** — first N×8 words of the English translation with a trailing ellipsis; each press reveals more.
- **Long-press the Hint button** to skip the menu and cycle through hint types directly (first-word → audio → translation → …).
- Hint card sits at the tail of the reveal stream (or in the desktop sidebar) so it's always where the eye is. Resets on every roll and every reveal — fresh hint budget per "what comes next" question.

### Audio

- **6 reciters** from Tarteel's CDN, with two delivery modes:
  - *Ayah-mode* (one MP3 per verse): Husary (default), Alafasy, Minshawi, Maher Al-Muaiqly.
  - *Surah-mode* (one MP3 per surah, seek into it with shipped segment timings): Abdul Basit (Mujawwad), Yasser Al-Dosari.
- **Word-by-word highlighting**: a soft gray block slides under the currently-spoken word as audio plays. Pixel-positioned via the `Range` API so the QPC v4 font's contextual word-spacing stays intact. Sticky — the highlight stays on the last word while audio is between word segments rather than popping in and out.
- **Audio overlay** triggered by the speaker icon: reciter, volume slider, 7-stop playback speed (0.5×–2×), loop toggle, autoplay toggle, audio-only toggle. Single popover, no settings sub-page.
- **Audio-only mode**: the latest card in the reveal stream is reduced to a big play button with no Arabic text — you listen and recite from memory. Once you reveal past it, that card reverts to a regular text card and the freshly-revealed ayah becomes the new audio-only card.
- **Autoplay** fires on every fresh prompt and on every newly-revealed ayah when enabled. Coordinated with the audio-focus mutex so only one ayah plays at a time — the latest play call always wins.
- **Surah-mode replay-from-end**: clicking play after the ayah finishes seeks back to its `fromMs` rather than bleeding into the next ayah from the same surah-wide MP3.

### Reading aids

- **Tajweed mode**: toggles between the QPC v4 font's tajweed-colored CPAL palette and the plain Mushaf palette.
- **English translation** (Sahih International, ~290 KB gzipped, lazy-loaded): toggles an italic line under every ayah card.
- **Mutashabihat / similar verses**: opt-in chip under each ayah lists other verses with overlapping wording (built by merging the Mutashabihat-ul-Quran scholarly index with high-confidence machine matches). On wide screens this lives in the sidebar.
- **Text-size slider** (16–48 px) in the preferences sub-page.

### Settings

Reached from the cog. Persisted to localStorage; reset-to-defaults clears every key.

- *Hide surah names* — for a stricter test.
- *Test first ayahs* — when ayah 1 is rolled, show only the surah name and recall the opening.
- *Show ayah numbers* — toggle the end-of-ayah rosette marker.
- *Tajweed* — color letters by their tajweed rule.
- *Show translation* — English meaning beneath each ayah.
- *Show similar verses* — flag ayahs with known mutashabih pairs.
- *Mutashabihat only* — restrict the roll pool to those ayahs.
- *Preferences*: text size, theme (light / dark), language (English / العربية / اردو), reset.
- *Audio* lives in the speaker-icon overlay rather than a sub-page (reciter, volume, speed, loop, autoplay, audio-only).

### Keyboard

Form fields are skipped so you can still type juz/page/ayah numbers. Desktop screens (≥ md) show small `kbd` chips next to action buttons.

| Where | Key | Action |
|---|---|---|
| Quiz | `Space` / `Enter` / `→` / `↓` | Reveal next ayah |
| Quiz | `N` / `R` | Next random ayah |
| Quiz | `H` | Open hint menu |
| Quiz | `Esc` / `Backspace` | Back / close topmost overlay |
| Quiz | `S` | Toggle settings |
| Quiz | `T` | Toggle theme |
| Quiz | `?` | Keyboard shortcut help |
| Home | `1` / `2` / `3` | Switch to Juz / Surah / Page tab |
| Home | `Enter` | Begin |
| Home | `←` / `→` | Cycle tabs when focused |
| Home | `S` | Toggle settings |
| Home | `T` | Toggle theme |
| Anywhere | `Esc` | Close the active overlay |

### Layout

- **Phone / tablet**: single-column reveal reel with translation, similar-verses, and the hint card all rendered inline beneath each ayah.
- **Desktop** (`lg:` and up): the content widens to `max-w-6xl` and a sidebar appears on the right hosting the hint card and a "Now reading" panel (similar-verses references for the current ayah). The translation continues to render inline under each ayah card across all breakpoints.
- All three header buttons (range pill, audio, settings) enforce a single-panel mutex — opening one closes the others.

### Platform

- **PWA-ready**: web manifest, Apple touch icon, and theme-color meta tag that follows the active theme.
- **Service worker** precaches the app shell and runtime-caches per-page fonts (CacheFirst, 1 year), tajweed JSON (SWR), translation JSON (SWR), word-timing tables (CacheFirst, 90 days), and audio MP3s from Tarteel (CacheFirst, 90 days). Works fully offline once you've used the app once.
- **Swipe-right** anywhere on the quiz screen to go back, on touch devices.

## Stack

- [Vite](https://vitejs.dev/) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- [Vercel Analytics](https://vercel.com/docs/analytics) for usage metrics
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for the service worker
- QPC v4 per-page tajweed-tagged runs in `src/data/ayahs-tajweed.json` (~60 KB gzipped) — bundled
- Per-reciter word-timing tables in `public/data/words-*.json` (~270–500 KB gzipped each, lazy-loaded)
- Sahih International translation in `public/data/translation-en-sahih.json` (~290 KB gzipped, lazy-loaded)
- Mutashabihat / similar-verses index in `public/data/similar-ayahs.json` (~24 KB gzipped, lazy-loaded)
- Self-hosted QPC v4 woff2 fonts in `public/fonts/qpc-v4/` (604 files, lazy-registered via `FontFace`)
- Audio streamed from `audio-cdn.tarteel.ai` (verified URL patterns, no key required)
- Deployed on [Vercel](https://vercel.com/) with HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy in [`vercel.json`](./vercel.json)

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
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |

## Project layout

```
src/
├── App.tsx                       state owner: range, lastRange, settings
├── main.tsx                      mounts the app + Vercel Analytics + SW
├── index.css                     Tailwind, dark variant, fonts, mask gradient
├── components/
│   ├── RangeSelector.tsx         home screen — pick juzs / surahs / pages
│   ├── QuizScreen.tsx            quiz screen — prompt + reveal reel + sidebar
│   ├── QuizSidebar.tsx           desktop-only context sidebar (hint + similar)
│   ├── JuzCustomizer.tsx         drill-down range refinement (juz → surah → ayah)
│   ├── AyahText.tsx              renders QPC v4 PUA runs + sliding word highlight
│   ├── AyahAudioButton.tsx       single-track audio with volume/speed/loop/autoplay
│   ├── AyahTranslation.tsx       Sahih-International translation line
│   ├── AyahSimilarHint.tsx       mutashabihat references chip
│   ├── TranslationHint.tsx       progressive translation hint with word budget
│   ├── HintButton.tsx            tap-or-long-press hint trigger
│   ├── KbdHint.tsx               desktop-only keyboard shortcut chip
│   ├── KeyboardHelp.tsx          `?` shortcut help modal
│   ├── SurahCombobox.tsx         type-to-filter surah picker
│   ├── AudioOverlay.tsx          speaker-icon overlay (reciter/vol/speed/loop)
│   ├── VolumeIcon.tsx            level-adaptive speaker glyph
│   ├── SettingsOverlay.tsx       floating settings overlay
│   └── SettingsPanel.tsx         settings panel (main + preferences sub-page)
├── data/
│   ├── ayahs-tajweed.json        surah:ayah → tajweed-tagged PUA runs by page
│   ├── quran-meta.ts             surahs[], juzData[], range helpers, weighted pick
│   ├── quran-tajweed.ts          per-page FontFace registry + CPAL palette CSS
│   ├── reciters.ts               reciter catalog + segment / word-timing loaders
│   ├── translations-en.ts        lazy loader for translation JSON
│   └── similar-ayahs.ts          lazy loader for mutashabihat JSON
├── hooks/
│   ├── usePersistedState.ts      useState that mirrors to localStorage
│   ├── useDragSelect.ts          drag-to-range-fill multi-select with tap fallback
│   ├── useKeyboard.ts            global keydown handler (form-field aware)
│   ├── useTajweedReady.ts        readiness hook for the tajweed JSON
│   ├── useTranslationReady.ts    readiness hook for the translation JSON
│   ├── useSimilarReady.ts        readiness hook for the similar-ayahs JSON
│   └── usePageFontsReady.ts      per-page font readiness for hint pre-warming
├── lib/
│   └── audio-focus.ts            module-level single-track audio mutex
├── i18n/
│   ├── translations.ts           en / ar / ur dictionaries + RTL helper
│   └── useT.ts                   tiny translation hook
└── types/
    └── range.ts                  SelectedRange + juz normalization helpers
public/
├── data/
│   ├── translation-en-sahih.json (~290 KB gzipped)
│   ├── similar-ayahs.json        (~24 KB gzipped)
│   ├── segments-*.json           per-surah-mode reciter (~60 KB gzipped each)
│   └── words-*.json              per-reciter word timings (~270–500 KB gzipped)
├── fonts/qpc-v4/p{1..604}.woff2  per-page QPC v4 color fonts (CPAL palettes)
├── fonts/UthmanicHafs1Ver18.woff2  legacy Bismillah glyph
├── icon-*.png, apple-touch-icon.png, favicon-32.png
└── manifest.webmanifest
```

## Deployment

Fully static SPA. Production is on Vercel with framework preset **Vite** (auto-detected), output `dist`, **no environment variables required at runtime**.

Security headers in [`vercel.json`](./vercel.json):

- `Strict-Transport-Security` with preload
- `Content-Security-Policy` restricted to `'self'` plus the exact origins used (Vercel Analytics, Tarteel audio CDN)
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation, and FLoC
- `worker-src 'self'` for the service worker

## License

MIT
