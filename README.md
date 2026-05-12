# testmyhifdh

A clean, focused tool for testing Quran memorization. Pick a range — a juz, a span of surahs, or a page range — and the app rolls a random ayah from it. Recite what comes next from memory, then reveal the next ayah (or the next ten) to check yourself.

Live at **[testmyhifdh.com](https://testmyhifdh.com)**.

## Features

- **Three ways to scope the test**: by juz, by surah range, or by page range.
- **Surah-uniform weighting**: every surah in your range is rolled with equal probability, so short surahs don't get drowned out by long ones. Within a surah, ayahs are uniform.
- **Final ayahs are never the prompt**: the last ayah of any surah is excluded from the random roll (you can still reveal it). This keeps the test honest — if you got rolled the ending, there'd be nothing to recite.
- **Vertical wheel reveal**: revealed ayahs flow through a fixed-height reel with a soft mask at the top and bottom. Cards curve away at the edges like an iOS picker. The page itself never scrolls.
- **Calligraphic Bismillah header**: when a reveal crosses into a new surah, the Bismillah is shown once as a ligature (﷽) above the next ayah card — never duplicated inline.
- **Uthmani script** via the Amiri Quran font, fetched from the alquran.cloud API.
- **Settings**:
  - *Hide surah names* — for a stricter test where you have to identify the location too.
  - *Test first ayahs* — when the random pick lands on ayah 1, show only the surah name and recall the opening from there.
- **Last-ayah indicator** on revealed cards, so you know when you've reached the end of a surah while checking.

## Stack

- [Vite](https://vitejs.dev/) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [alquran.cloud API](https://alquran.cloud/api) for Uthmani-script ayah text
- Deployed on [Vercel](https://vercel.com/) with HTTPS, HSTS, and a locked-down CSP

## Local development

```bash
git clone https://github.com/yousefismail01/testmyhifdh.git
cd testmyhifdh
npm install
npm run dev
```

Open <http://localhost:5173>.

### Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production into `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Deployment

The app is a fully static SPA — any static host works. The production deploy is on Vercel with framework preset **Vite** (auto-detected), output `dist`, no environment variables required.

Security headers (HSTS, CSP, X-Frame-Options, etc.) are set in [`vercel.json`](./vercel.json).

## License

MIT
