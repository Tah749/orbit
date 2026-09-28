# Orbit waitlist site

Marketing and waitlist landing page for **Orbit, the AI assistant for your life.**
Built with React, TypeScript, Vite, Tailwind CSS v4, Motion and Phosphor icons.

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build into dist/
npm run preview   # serve the production build
npm run build:standalone   # one self-contained file: dist-standalone/index.html
```

Don't open the root `index.html` directly: it's the Vite source entry and needs `npm run dev`.
To view the site without a server, run `npm run build:standalone` and open
`dist-standalone/index.html` (JS, CSS and fonts are all inlined). The normal `dist/` build uses
relative asset paths, so it can be hosted from any folder or subpath, such as GitHub Pages.

## Structure

```
src/
  index.css                 colour tokens (CSS variables) + Tailwind theme aliases
  lib/waitlist.ts           waitlist integration layer (the only place that talks to a backend)
  data/integrations.ts      integration tiles and their status badges (edit statuses here)
  components/
    Navbar, Hero, Problem, Features, Assistant, Privacy, Integrations, Faq, FinalCta, Footer
    WaitlistForm.tsx        two-step signup form (email, then optional name + interest)
    PlaceholderPage.tsx     #/privacy, #/terms, #/sign-in placeholders
    ui/                     Button, Logo (orb mark), Reveal (scroll fade-in), SectionHeading
    previews/               product UI previews (all content is illustrative demo data)
```

Colour tokens use the product names (`--paper`, `--white`, `--soft`, `--line`, `--ink`, `--muted`,
`--green`, `--sage`, `--sageDeep`, `--coral`, `--blue`, `--yellow`). In Tailwind they are exposed as
`paper`, `surface`, `soft`, `line`, `ink`, `muted`, `accent`, `accent-bg`, `accent-fg`, `coral`, `info`, `warn`.
`--green` is the rose-pink accent `#FF4D7A` on purpose.

## Waitlist backend

No backend is included. Without configuration the form runs in **development mode**: it validates,
shows loading/success/duplicate states, logs the payload to the console, stores nothing, and shows a
visible "Development mode ... not saved" note. For testing, emails starting with `taken@` simulate a
duplicate and `fail@` simulates an error.

To save real signups, copy `.env.example` to `.env.local` and set:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
```

Only ever use the **anon** key here. The service-role key must never be in a `VITE_` variable.
The form inserts into `waitlist_signups` via Supabase's REST API with `Prefer: return=minimal`,
and treats HTTP 409 (unique violation) as "already on the list". The table it expects:

```sql
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and length(email) <= 254),
  first_name text check (length(first_name) <= 80),
  interest text check (length(interest) <= 200),
  source text check (length(source) <= 40),
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;

-- Anonymous visitors may insert only. No select/update/delete policies, so the list
-- cannot be read, enumerated or modified from the browser.
create policy "anon can join waitlist" on public.waitlist_signups
  for insert to anon with check (true);
```

Spam protection on the client is a hidden honeypot field plus a minimum time on the form. For
production traffic, consider adding rate limiting or a CAPTCHA at the edge as well.

## Notes

- All product previews use fictional demo data and are labelled as such.
- Integration statuses live in `src/data/integrations.ts`. None are claimed as live.
- `public/og-image.png` (1200x630) and `public/favicon.svg` provide the social card and favicon.
