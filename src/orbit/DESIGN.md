# Orbit app: design and build guide

The Orbit app lives in `src/orbit/` and runs at `#/app/<section>`. It is a real, working front end on
**sample data held in the browser** (`store.ts`). There is no server, no network calls, no accounts.

Read this before building a section. The goal: an app that feels **made by a careful human designer**,
calm and editorial, like a well-made native app. It must not look AI-generated.

## The look

- **Colour:** the Oat scheme, via Tailwind tokens only (`bg-paper`, `bg-surface`, `bg-soft`, `border-line`,
  `text-ink`, `text-muted`, `text-faint`, `text-accent`, `bg-accent-bg`, `text-accent-fg`, `text-info`,
  `text-warn`, `text-coral`, `bg-tint-info/warn/coral`). **Never hard-code a hex colour.** Everything must
  work in light and dark mode.
- **Type:** Geist for UI (13-15px), Geist Mono for small uppercase labels and data, and **Newsreader serif**
  (`font-serif`) for page titles, big dates and the occasional editorial line. Numbers use `tabular-nums`.
- **Structure over decoration.** Content sits on the page, separated by **hairline rules** (`border-line`,
  `divide-y divide-line`). Use `<Panel>` (bordered, no shadow) only where grouping truly helps.
- **Primary buttons are ink** (`<Button variant="primary">`). Use the petrol `accent` sparingly: one
  highlight per view, checked states, positive money, the current day.
- Radius is small and consistent: 10px panels, 7px controls, 4px tags. Tags are square-ish, not pills.
- Density like a good desktop app: 44-52px list rows, compact metadata, left-aligned text.

## Never do these (they read as AI-made)

- Gradients, glassmorphism, glows, blurred blobs, drop shadows on cards.
- Emoji, sparkles icons, "✨ AI" labels, exclamation marks, hype words ("supercharge", "seamless", "effortless").
- Rows of identical cards each with an icon in a coloured circle, a bold title and a grey sentence.
- Big centred hero text inside the app, gradient text, purple.
- Oversized rounded-2xl everything, pill buttons everywhere, badges on everything.
- Generic filler ("Welcome back!", "Here's your overview", "Lorem ipsum", "Coming soon" sprinkled around).
- Fake precision or fake claims ("99% accurate", "bank-grade security").

## Do these instead

- Write like a thoughtful assistant, in British English: "Priya asked for the Q3 numbers by Thursday."
  Short, specific, concrete. Sentence case everywhere.
- Show **where each thing came from** with `<Source id="gmail" />`. Orbit never presents a fact without a source.
- Make every view **useful and interactive**: filters that work, items you can open, complete, snooze,
  archive, add and edit. Changes go through `db.patch / db.insert / db.remove` and persist.
- Real empty states (`<Empty title="Nothing waiting">...`), keyboard access, visible focus, `aria-label`s on
  icon buttons, and layouts that work at 390px wide (no horizontal scroll, 16px gutters).
- Use relative dates from `time.ts` (`relDay`, `inDays`, `stamp`, `time`, `longDate`); sample data is
  always relative to today.
- Confirm changes with `toast("Archived", { label: "Undo", run: ... })` where undo makes sense.

## Building blocks (import from `src/orbit/ui`)

`Page` (eyebrow, serif title, lede, actions), `Section`, `Panel`, `Label`, `List` + `Row`, `Facts`,
`Figure`, `Amount`, `money()`, `Source`, `Tag`, `Dot`, `Kbd`, `Avatar`, `Button`, `IconButton`, `Input`,
`Textarea`, `Select`, `Field`, `Check`, `Switch`, `Tabs`, `Segmented`, `Sheet` (side sheet / bottom sheet),
`Empty`, `Skeleton`, `Sparkline`, `Bars`, `Meter`, `toast`, `cx`.

Icons: `@phosphor-icons/react`, regular weight, 16-18px, `text-faint` or `text-muted`; `fill` weight only for
an active state. Don't put icons in coloured circles.

## Data and routing

- `useDB((d) => d.tasks.filter(...))` reads (derived arrays are safe). It sees the store *without* data from
  connections switched off in Settings (`visible.ts`); `db.get()` is the raw store. `db.patch("tasks", id, {...})`,
  `db.insert("tasks", item)`, `db.remove("tasks", id)`, `db.set("settings", ...)`, `newId("tk")`.
- Types and sample data are in `src/orbit/data/*.ts`. Items link to each other with `Ref` (`{kind, id}`);
  open a linked item with `go("<section>/<id>")` or `<a href={href("inbox/msg-priya")}>`.
- Deep links: your section gets `useRoute().rest` (e.g. `#/app/inbox/msg-priya` → `rest = ["msg-priya"]`).
  Support opening an item from its id, because the command palette and other sections link to it.
- Section paths used by others: `inbox/<messageId>`, `calendar/<eventId>`, `tasks/<taskId>`,
  `money/bills/<billId>`, `money/transactions/<txnId>`, `business/<orderId>`, `health/<workoutId>`, `plans/<bookingId>`, `plans/trip/<tripId>`, `deliveries/<orderId>`, `people/<contactId>`,
  `admin/<docId>`, `ask/<question>`.

## Gotchas

- In a `Sheet` footer, give swapped buttons distinct `key`s (e.g. Edit → Save). Otherwise React reuses the
  element and a button that becomes `type="submit"` mid-click submits the form immediately.
- When sample data changes, bump `SEED_VERSION` in `store.ts` so saved copies in browsers are replaced.
- Sample text that names a weekday should use `weekday(n)` from `time.ts`, so it matches the relative dates.
