# CLAUDE.md

Guidance for working in this repository. Read this before changing anything.

## What Orbit is

Orbit is a planned **personal AI assistant for everyday life**. It brings the things people juggle
across many apps (email, calendar, bills and subscriptions, bookings and travel, investments,
fitness and tasks) into one calm view, and lets people ask about their life in plain English
("What do I need to sort before Friday?").

The core idea: *one phone, too many moving parts.* People keep checking a dozen apps and hope the
thing that matters reaches them in time. Orbit is meant to connect the services they already use,
surface what matters today, and answer questions across all of it.

### Audience and positioning

- **Who it's for:** busy adults (roughly 25-55) running a household, a job and a social life from one
  phone: professionals, parents, frequent travellers. People who feel scattered, not people who want
  another productivity system to maintain.
- **The promise:** fewer apps to check, nothing important missed, a calmer start to the day.
- **Pillars shown across the site:** Ask anything (plain-English questions over your connected
  information) · Your day (daily briefing: schedule, important emails, tasks) · Your money (upcoming
  bills, subscriptions, investments at a glance) · Your plans (flights, hotels, reservations).
- **Personality:** warm, unhurried, grown-up, trustworthy. The design (oat paper, petrol teal,
  generous space) should feel handled rather than techy.
- **Call to action everywhere:** join the waitlist. Secondary: explore the live demo.

**Status: pre-launch.** The product does not exist yet. This repository is the **marketing and
waitlist site**, plus an **interactive front-end demo** of the product. Nothing connects to real
accounts, and no user data is processed.

## What this repo is (and is not)

It is:
- A scroll-driven 3D story (`#/story`) that demonstrates Orbit and collects waitlist signups.
- The Orbit app front end (`#/app`, `src/orbit/`): a full, working app running entirely on sample data
  held in the browser. Gated behind a password (static site, not security). No server, no database, no real connections.
- A folder of brand explorations (`brand/`): names, logos and colour schemes.

It is not:
- The Orbit product or its backend. **Do not build a backend**, auth, integrations or data sync here.
- A place for real customer data. Every preview uses illustrative demo data and is labelled as such.

## Hard rules

These come from the project owner and apply to every change.

1. **No backend.** The only network call is the waitlist insert in `src/lib/waitlist.ts`.
2. **No secrets in the client.** Only the Supabase *anon* key may appear, in a `VITE_` variable.
   Never a service-role key, never any other secret.
3. **Never store waitlist emails in `localStorage`/`sessionStorage`.** Browser storage holds only the
   light/dark preference (`orbit-theme`), the app's own sample data (`orbit.app.v1`, see `src/orbit/store.ts`),
   and the app gate unlock flag (`sessionStorage["orbit.unlock"]`).
4. **No invented facts.** No fake customers, testimonials, partnerships, press logos, user counts,
   ratings or "live" integrations.
5. **No unsupported claims** about security, privacy, compliance, accuracy or finance (no "bank-grade",
   "GDPR compliant", "never wrong", savings figures, etc.). Say what Orbit is *designed* to do.
6. **Demo data must look like demo data.** Previews carry a "Demo data" label; the story footer says
   "Scenes use illustrative demo data".
7. **Third-party brands:** the story shows real app logos (via `simple-icons`, CC0 paths) for
   illustration. Keep the trademark notice in the story's join section.
8. **Git:** develop on the assigned feature branch; never include AI model names in commits, code or
   docs. Commit messages end with the attribution lines the session provides.

## Tech stack

- **Vite 8**, **React 19**, **TypeScript 7** (`tsc -b` for type checking)
- **Tailwind CSS v4** via `@tailwindcss/vite`; tokens in `src/index.css` (`@theme inline`)
- **motion** (`motion/react`) for DOM animation, **lenis** for smooth scrolling on 3D pages
- **three** + **@react-three/fiber** for the 3D scenes (drei is installed but barely used)
- **@phosphor-icons/react** for UI icons, **simple-icons** for third-party brand glyphs
- Fonts: Geist Variable and Geist Mono Variable (`@fontsource-variable/*`)
- `vite-plugin-singlefile` for the standalone single-file build

## Commands

```bash
npm install
npm run dev               # dev server
npm run typecheck         # tsc -b
npm run build             # typecheck + production build to dist/
npm run preview           # serve dist/ (default port 4173)
npm run build:standalone  # one self-contained HTML file: dist-standalone/index.html
```

There is no test runner or linter config in the repo. "Checking" a change means: `npm run build`
passes, and the affected pages are looked at in a browser (see Visual testing below).

Deployment: `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on push. Base path is
relative (`base: "./"`) so the build works from any subpath.

## Routes (hash router in `src/App.tsx`)

| Hash | What it is | Entry |
| --- | --- | --- |
| `#/` (or none), `#/story`, unknown | Phone story: the 3D scroll narrative | `src/story/Story.tsx` |
| `#/privacy`, `#/terms` | Placeholder pages | `PlaceholderPage.tsx` |
| `#/app`, `#/app/<section>/<id>` | The Orbit app (sample data); requires password | lazy `AppGate.tsx` → `src/orbit/App.tsx` |

Heavy pages (`story`, `app`) are `lazy()` chunks.

## Directory map

```
index.html                 Vite entry; inline script applies the saved theme before first paint
public/                    favicon.svg (Tracked mark), og-image.png
src/
  main.tsx, App.tsx        bootstrap + hash router
  index.css                colour tokens (Oat light/dark), Tailwind aliases, keyframes
  lib/
    waitlist.ts            the ONLY backend touchpoint (Supabase REST insert, or dev-mode simulation)
    theme.ts               light/dark: currentMode(), setMode(), useMode()
  components/              page gates and minimal UI
    AppGate.tsx            lazy password gate; sets sessionStorage["orbit.unlock"]; loads App.tsx on success
    PlaceholderPage.tsx    #/privacy, #/terms
    ui/                    Button, Logo (Orb + Wordmark), OrbitAppIcon, ThemeToggle
    WaitlistForm.tsx       two-step signup form
  orbit/                   the Orbit app (see "The Orbit app" below and src/orbit/DESIGN.md)
    App.tsx, CommandPalette.tsx, router.ts, sections.ts, store.ts, time.ts
    data/                  types + sample data per domain (mail, calendar, tasks, money, plans, life, business)
    ui/                    the app's design kit
    sections/<key>/        one folder per section (today, ask, inbox, calendar, tasks, money, business,
                           plans, deliveries, health, people, admin, settings)
  story/                   the phone story (see below)
    glsl.ts                simplex noise and fbm helpers for shaders
    textures.ts            glow and card-atlas helpers
    previews.tsx           app-style feature chapter panels (acts 6–9)
brand/                     brand explorations, each with an index.html gallery
  names/  logos/  colours/  colours-v2/
brag-output/               promo video assets (work/ is ignored)
Plan.md                    product and integrations roadmap for the future app (not built in this repo)
```

## Design system

### Colour: the "Oat" scheme

Defined in `src/index.css`. Light is the default; dark applies when the OS prefers dark, unless
`<html data-theme="light|dark">` overrides it. The toggle (`ThemeToggle`) writes `data-theme` and
remembers a non-system choice in `localStorage["orbit-theme"]`.

Token names are the product design system's and must not be renamed:

| Token | Tailwind | Light | Dark | Notes |
| --- | --- | --- | --- | --- |
| `--paper` | `paper` | #F5F3EF | #151412 | page background |
| `--white` | `surface` | #FFFFFF | #1D1B19 | cards |
| `--soft` | `soft` | #ECE8E1 | #272522 | inputs, chips |
| `--line` | `line` | #DDD7CD | #35322D | borders |
| `--line-strong` | `line-strong` | #C7BFB2 | #4A463F | hover borders |
| `--ink` | `ink` | #1D1B18 | #F2EFEA | text |
| `--muted` | `muted` | #67625A | #A9A399 | secondary text |
| `--faint` | `faint` | #8A847A | #767067 | placeholders, idle icons |
| `--deep` | `deep` | #EFEBE4 | #100F0E | sidebars, preview frames |
| `--green` | `accent` | #0C6B66 | #5CC9BC | **petrol accent** (name is historical) |
| `--sage` / `--sageDeep` | `accent-bg` / `accent-fg` | | | accent tint + text on it |
| `--blue` | `info` | #6B4F8F | #BBA3DD | heather secondary |
| `--coral`, `--yellow` | `coral`, `warn` | | | alerts, due-soon |
| `--tint-info/warn/coral` | `tint-*` | | | tinted badge backgrounds |
| `--shade` | | | | shadow colour for arbitrary shadows |
| `--story-*` | `story-*` | | | story page backdrop, text, chips, gold hint |

Rules:
- **Never hard-code hex colours in components.** Use tokens/Tailwind aliases, or `var(--token)` in
  arbitrary values (`shadow-[0_40px_80px_-40px_var(--shade)]`). Buttons on accent use `text-paper`.
- Check new UI in **both** light and dark.

### Logo: "Tracked"

- `Wordmark` (`src/components/ui/Logo.tsx`): widely spaced lowercase monoline "orbit"; the i's tittle
  is the accent dot. Used in headers.
- `Orb`: the symbol, a monoline ring with an accent dot (stroke is `currentColor`). Used as the small
  mark and the assistant avatar in the app.
- `OrbitAppIcon`: the symbol in cream + teal on a charcoal tile. `drawOrbitIcon` in
  `src/story/brands.ts` draws the same icon on canvas for 3D textures. Keep the two in sync, and the
  favicon too.
- Other logo concepts live in `brand/logos/` for reference only.

### Type and tone

- Geist for everything, Geist Mono for numbers, times and small kicker labels.
- Copy is British English, plain and calm. Short sentences. No hype, no exclamation marks, no emoji.
- **The story page uses as few words as possible.** One short line per act; the animation carries the
  meaning. Don't add paragraphs back.

## The phone story (`src/story/`)

The flagship page. A scroll-driven film in five acts plus feature chapters and a join section:

| k | Act | What happens |
| --- | --- | --- |
| 0 | Open | A dark phone floats on a soft studio backdrop. "One phone. Too many moving parts." |
| 1 | Phone | Screen wakes, notifications pile up, cards burst out of the screen |
| 2 | Problem | Camera dives through the glass into a slot machine of real app icons. Reels land on Orbit: jackpot |
| 3 | Connection | Winning Orbit tokens form a sphere; the other apps become a network around it |
| 4 | Product | The sphere opens like a lens; Orbit's UI appears as flat app-style panels |
| 5 | Return | Pull back out through the glass; the phone now runs Orbit and projects a hologram |
| 6-9 | Inside Orbit | Ask, Your day, Your money, Your plans: flat app-style panels beside the phone |
| 10 | Join | Pull back; app icon, "Join the waitlist.", the form, trademark notice, footer |

Design: the story's UI follows `src/orbit/DESIGN.md`. Feature chapters use Newsreader serif titles,
hairline rules, ink buttons, square tags, and Source labels. Dashboard and hologram panels in `canvas.ts`
are flat app-style screens; no glows or gradients.

Files:
- `state.ts`: shared mutable state (`story.progress`, `story.stops`, `theme.mode`), `actCount = 11`,
  `actAt(p)` (scroll progress to an eased act position k), `smooth`, `ramp`.
- `Story.tsx`: DOM layer: each `<Act>` section, header with theme/sound toggles, flash overlay, Lenis setup,
  act stops measured on resize.
- `StoryScene.tsx`: the three.js scene. Camera `Rig` follows Catmull-Rom curves through 11 keyframes
  (`keys`), with separate desktop/mobile framing (`desk`, `mob`, `m`) and `setViewOffset` to shift the
  subject beside the text. Components: `Backdrop`, `Shadow`, `Phone`, `Burst`, `Machine`, `Jackpot`,
  `Sphere`, `Network`, `Hologram`, `Projection`.
- `canvas.ts`: canvas-drawn textures: lock screen, Orbit dashboard (`dashPal` per mode), flat app-style
  panels, machine marquee.
- `brands.ts`: `brands[]` (index 0 is Orbit, then ~29 apps via simple-icons), brand atlas for reels,
  notification card atlas, `drawOrbitIcon`, `drawBrandTile`.
- `apps.ts`: which apps sit above/below the payline and join the network.
- `glsl.ts`: simplex noise and fbm helpers for custom shaders.
- `textures.ts`: glow and card-atlas helpers.
- `previews.tsx`: app-style feature chapter panels (acts 6–9), built from `src/orbit/ui` and sample data.
- `sound.ts`: `sfx`, a WebAudio synth (lever, ticks, clunks, jackpot, whooshes). Off until the
  visitor turns it on.

Key mechanics:
- **Scroll never re-renders React.** Scroll writes `story.progress`; the scene reads it every frame.
  The rig eases its own `k` toward `actAt(progress)`; `live.k` / `live.prevK` hold it for the frame.
  Use `crossed(a)` for one-shot cues (sounds) when k passes a value going forward.
- **Slot machine:** `slot.pulledAt` / `slot.wonAt`. The lever is pulled by scrolling, k-driven
  (`stopAt`, `JACKPOT`). Scrolling back above k 1.8 resets it.
- **Theme in 3D:** `StoryScene` takes `mode`, sets `theme.mode` and `pal = palettes[mode]`, and keys
  the `<Canvas>` on mode, so a theme switch rebuilds the scene and its textures. Add any new colour
  to **both** palettes.
- **Light-mode "ink":** additive glow is invisible on a light background. Wrap additive
  `ShaderMaterial`s in `ink(material, gain, tone)`: in light mode it switches to normal blending and
  turns brightness into opacity with a deep tone. Use `glowBlend()` for sprites/basic materials.
- **Screen flash:** `#story-flash` fires only while the camera is actually moving through the glass.
- Reduced motion: camera eases fast and parallax/shake are skipped. No-WebGL: a static fallback.

## The Orbit app (`src/orbit/`)

A full front end for the product, on sample data (persona: Alex Rowe in London, with a small shop,
Fern & Thread, on Shopify and Etsy). **Read `src/orbit/DESIGN.md` before touching it**: it sets the
look (editorial, hairline rules, serif titles, ink buttons, no AI-looking patterns) and the kit.

- `store.ts`: all data in one local store (`useDB`, `db.patch/insert/remove/set/reset`), saved to
  `localStorage["orbit.app.v1"]`. On load, saved dates are shifted forward so sample data stays current.
  `SEED_VERSION` replaces saved copies when sample data changes. `useDB` hides data from connections
  switched off in Settings (`visible.ts`).
- `data/*.ts`: types and sample data per domain, written relative to today with `at()` / `on()`.
- `sections.ts`: the section registry (nav, icons, lazy pages). Each section owns its folder.
- `router.ts`: `useRoute()` gives `{ section, rest }` for `#/app/<section>/<...rest>`; `go(path)`, `href(path)`.
- Every surfaced item shows its source (`<Source />`). The sidebar says "Sample data. Nothing is connected."
- Newsreader (`font-serif`) is loaded only by the app.

## Waitlist

- `WaitlistForm` is two steps: email, then optional first name + interest. Pass a `source` string
  (`story-final`).
- `submitWaitlist` (`src/lib/waitlist.ts`) inserts into Supabase `waitlist_signups` with the anon key
  and `Prefer: return=minimal`; HTTP 409 means "already on the list".
- Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` it runs in **development mode**: validates,
  simulates latency, stores nothing, and the UI says "not saved". Test emails: `taken@...` gives
  duplicate, `fail@...` gives error.
- The expected table and RLS policy (insert-only for anon) are in `README.md`.

## Brand explorations (`brand/`)

Reference material, not shipped UI. Each folder has an `index.html` gallery:
- `names/`: 16 name ideas with SVG marks. `logos/`: 16 minimal logo concepts (the site uses `tracked`).
- `colours/`: first round (7 schemes). `colours-v2/`: 10 schemes in light and dark with contrast
  checks; `oat-tokens.css` is the source of the live tokens.

## Working on the 3D scenes: gotchas

- Custom shaders end with `${outro}` (`"\n#include <colorspace_fragment>\n"`). Keep the newlines:
  an include on the same line as other code fails to compile.
- The canvas is `flat` (no tone mapping) and opaque (`alpha: false`). Colours from `THREE.Color` are
  linear; canvas textures are SRGB.
- **Atlas lookups:** round interpolated tile indices (`floor(vTile + 0.5)`). Without that, pixels read
  the neighbouring tile and shimmer.
- Transparent instanced cards use `depthWrite: false` so their edges don't cut each other.
- `live.inner` scales the inside-the-phone world down on mobile (0.5); `live.mobile` is aspect < 0.8.
- DOM text sits over the scene with a text shadow in the story background colour; on mobile, feature
  chapters get a scrim (`flow` prop).
- Performance: dpr is capped at 1.75; avoid per-frame allocations (reuse the `tmp` vectors).

## Visual testing

There are no automated tests. Verify visually with Playwright + Chromium (preinstalled in cloud
sessions; don't run `playwright install`):

- Serve with `npm run build && npx vite preview --port 4173`.
- Launch Chromium with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`
  for WebGL. Swiftshader renders at about 2fps, so anything time-based needs long waits (7-16s per
  scroll position). A blurry frame mid-dive usually means the camera hasn't arrived yet.
- Scroll the story to an act by centring its `[data-act]` section; check 1440x900 and 390x844, and
  both `colorScheme: "light"` and `"dark"`.
- Check: no console errors, no horizontal overflow, text readable over the scene, slot machine responds
  to scroll.
- Test the app gate at `#/app`: enter the password and verify it sets `sessionStorage["orbit.unlock"]`
  and loads the app.
- Stop the preview server with `fuser -k 4173/tcp`. (`pkill -f "vite preview"` also matches and
  kills the shell running it.)

## Publishing the prototype

A single-file build is published as a private claude.ai artifact for sharing:
`npm run build:standalone`, then strip the doctype, `<html>`/`<head>`/`<body>` wrappers, charset,
viewport and title from `dist-standalone/index.html`, prefix `<title>Orbit Prototype</title>`, and
publish. The published file is a build output; regenerate it from source rather than editing it.

## Conventions

- Match surrounding code: small components, comments only where the *why* isn't obvious.
- Keep new UI accessible: real buttons/links, `aria-label` on icon buttons, visible focus
  (`:focus-visible` outline uses the accent), `prefers-reduced-motion` respected.
- Mobile first-class: no horizontal scroll at 390px, 16px side gutters, tap targets of at least 40px.
- Keep bundle-heavy features lazy. Don't add dependencies without a clear need.
- When in doubt about a claim or a number on the page, leave it out.
