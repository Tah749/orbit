# Orbit Mobile

The Orbit app front end as an Expo React Native application, running entirely on sample data held on the device. No backend, no network calls, no waitlist.

## Quick start

```bash
cd mobile
npm install
npx expo start             # start the dev server
                           # open in Expo Go on your phone, or press i/a for simulator
npx tsc --noEmit           # typecheck
npx expo export --platform ios  # create a production iOS bundle
```

There is no test runner or linter. "Checking" a change means `npx tsc --noEmit` passes and the app looks right on a device or simulator.

## App structure

**app/** — file-based routing (Expo Router). Tab navigator with Home, Ask, Inbox, Calendar, Money, More. Nested stack screens (event detail, compose, etc.).

**src/**
- `theme.ts` — Oat colour scheme (light and dark) and Jarvis palette; Geist and Newsreader font names.
- `store.ts` — device-local data store (AsyncStorage), same API as the web app. Hydrated on startup, saved on change.
- `prefs.ts` — small persisted preferences (theme, home mode).
- `intro/` — splash screen and onboarding.
- `home/` — Home tab: Minimal mode (list view) and Jarvis mode (assistant-like dashboard). Toggled via `orbit.home.mode` pref.
- `sections/` — lazy-loaded detail screens per app domain (ask, inbox, calendar, tasks, money, business, plans, health, people, admin, settings); structured like the web app.
- `ui/` — design kit (buttons, cards, forms, lists, charts, feedback components, loaders).

## Sharing data and logic with the web app

Pure logic is imported from `@orbit/*`, which resolves to `../src/orbit/` via `metro.config.js` and `tsconfig.json` paths:

**Can import from `@orbit/`:**
- `data/*.ts` — types and sample data
- `time.ts` — date/time helpers
- `format.ts` — money, Tone type
- `seed.ts` — seed, restore, serialize, KEY, Collection, Item
- `visible.ts` — filter by connection visibility
- `sections/*/lib.ts`, `sections/*/derive.ts`, `sections/*/engine.ts` — pure helpers

**Cannot import from `@orbit/`:**
- `@orbit/ui`, `@orbit/store`, `@orbit/router` — web-only
- `@orbit/**/*.tsx` — no React components from the web app
- Anything with DOM or React imports

Keep data logic (types, format, seed, derive) free of React and UI dependencies.

## Home screen modes

Two views on the Home tab, persisted via `orbit.home.mode` (AsyncStorage key):

- **Minimal** — list of today's items (mail, calendar, tasks, money alerts). Default.
- **Jarvis** — an assistant-like dashboard with panels and sparklines. Always dark; uses the `jarvis` colour palette (deep petrol with teal linework). Allowed a subtle glow as an exception to the Oat design system.

Toggle via `useHomeMode()` hook.

## Loading and skeletons

Sections use `useSimulatedLoad(key, refreshCount)` to show skeleton loaders while data "loads" (in reality, synchronously from the store). Call it in each section with a unique key; pass refresh count to retrigger.

## Storage keys (AsyncStorage)

- `orbit.app.v1` — all sample data (messages, events, tasks, accounts, etc.), synced on every change, with a 250ms debounce.
- `orbit.theme` — light/dark/system preference.
- `orbit.home.mode` — "minimal" or "jarvis".

On first launch, sample data dates are shifted forward so demo content stays current. Bump `SEED_VERSION` in `seed.ts` to replace saved copies when sample data changes shape.

## Design

Follows `src/orbit/DESIGN.md`: editorial, hairline rules, serif titles, ink buttons, no AI-looking patterns. Fonts are Geist (sans) and Newsreader (serif). Colours are the Oat scheme (light and dark), plus the Jarvis palette for the home dashboard.

Every surfaced item shows its source. More and Settings say "Sample data. Nothing is connected."

## No waitlist in the app

Unlike the web story, the mobile app does not collect email signups. There is no network call to Supabase or any backend.
