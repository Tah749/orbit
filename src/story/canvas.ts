import * as THREE from "three";
import type { Icon } from "@phosphor-icons/react";
import {
  EnvelopeSimple,
  CalendarBlank,
  ChatCircleDots,
  At,
  Bank,
  AirplaneTilt,
  Heartbeat,
  ChartLineUp,
  CheckSquare,
  Receipt,
  House,
  SquaresFour,
  Sparkle,
} from "@phosphor-icons/react";
import { iconImage, roundRect } from "./textures";
import { brandIndex, drawBrandTile } from "./brands";
import { theme } from "./state";
import { events, type CalEvent } from "../orbit/data/calendar";
import { messages } from "../orbit/data/mail";
import { bills, holdings, portfolioHistory } from "../orbit/data/money";
import { bookings, trips } from "../orbit/data/plans";
import { tasks } from "../orbit/data/tasks";
import { sourceName, type SourceId } from "../orbit/data/sources";
import { dayLabel, daysFrom, longDate, on, relDay, time } from "../orbit/time";

/* Everything drawn here is illustrative demo content, labelled as such where it's legible. */

export type App = { name: string; icon: Icon; from: string; to: string };

export const apps: App[] = [
  { name: "Email", icon: EnvelopeSimple, from: "#FF6B93", to: "#D92D62" },
  { name: "Calendar", icon: CalendarBlank, from: "#FF7A5C", to: "#F0473F" },
  { name: "Messages", icon: ChatCircleDots, from: "#B69CFF", to: "#7C4DFF" },
  { name: "Social", icon: At, from: "#3A3548", to: "#16141D" },
  { name: "Banking", icon: Bank, from: "#FFB566", to: "#F07A2C" },
  { name: "Travel", icon: AirplaneTilt, from: "#8FA2FF", to: "#6A56F0" },
  { name: "Fitness", icon: Heartbeat, from: "#FF6A5E", to: "#E0344F" },
  { name: "Investments", icon: ChartLineUp, from: "#FFC2D1", to: "#F0527D" },
  { name: "Tasks", icon: CheckSquare, from: "#8D86A0", to: "#4A4458" },
  { name: "Bills", icon: Receipt, from: "#FFC074", to: "#FF6A45" },
];

const sans = '"Geist Variable", system-ui, sans-serif';
const mono = '"Geist Mono Variable", ui-monospace, monospace';
const serif = '"Newsreader Variable", Georgia, serif';

let glyphs: Promise<(HTMLImageElement | null)[]> | null = null;

/** Loads fonts and the white app glyphs once. */
export function loadGlyphs() {
  if (!glyphs) {
    glyphs = (async () => {
      try {
        await Promise.all([
          document.fonts.load(`600 40px ${sans}`),
          document.fonts.load(`400 24px ${sans}`),
          document.fonts.load(`500 20px ${mono}`),
          document.fonts.load('400 40px "Newsreader Variable"'),
        ]);
      } catch {
        /* system fonts are fine */
      }
      const extra = [House, SquaresFour, Sparkle];
      return Promise.all([...apps.map((a) => a.icon), ...extra].map((i) => iconImage(i, "#FFFFFF").catch(() => null)));
    })();
  }
  return glyphs;
}

function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, weight = 400, font = sans, align: CanvasTextAlign = "left", maxW?: number) {
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  g.fillText(s, x, y, maxW);
}

export function appTile(g: CanvasRenderingContext2D, x: number, y: number, s: number, i: number, glyph: HTMLImageElement | null) {
  const a = apps[i];
  const grad = g.createLinearGradient(x, y, x + s, y + s);
  grad.addColorStop(0, a.from);
  grad.addColorStop(1, a.to);
  roundRect(g, x, y, s, s, s * 0.26);
  g.fillStyle = grad;
  g.fill();
  // A soft top highlight, like a glass app icon.
  const hi = g.createLinearGradient(x, y, x, y + s);
  hi.addColorStop(0, "rgba(255,255,255,0.28)");
  hi.addColorStop(0.5, "rgba(255,255,255,0)");
  g.fillStyle = hi;
  g.fill();
  if (glyph) g.drawImage(glyph, x + s * 0.24, y + s * 0.24, s * 0.52, s * 0.52);
}

/* ------------------------------------------------------------------------------------------------
 * App icon atlas: 5 x 2 tiles, used by the reels and the network nodes.
 * ---------------------------------------------------------------------------------------------- */

export const iconGrid = { cols: 5, rows: 2 };

export async function makeIconAtlas() {
  const gl = await loadGlyphs();
  const T = 256;
  const [c, g] = canvas(T * iconGrid.cols, T * iconGrid.rows);
  apps.forEach((_, i) => appTile(g, (i % 5) * T + 22, Math.floor(i / 5) * T + 22, T - 44, i, gl[i]));
  const t = tex(c);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/* ------------------------------------------------------------------------------------------------
 * Phone screens
 * ---------------------------------------------------------------------------------------------- */

export const screenSize = { w: 600, h: 1314 };

const lockNotes = [
  { app: "Gmail", title: "Priya Shah", body: "Numbers for the Q4 review?", t: "now" },
  { app: "WhatsApp", title: "Family", body: "Mum: who's picking up Dad?", t: "1m" },
  { app: "X", title: "23 new notifications", body: "You were mentioned in a thread", t: "3m" },
  { app: "Calendar", title: "Dentist", body: "Moved to Thursday, 3:30pm", t: "5m" },
  { app: "Monzo", title: "£18.40 on coffee", body: "That's your third this week", t: "9m" },
  { app: "Uber", title: "Your driver is 2 min away", body: "Silver hatchback, look out front", t: "12m" },
  { app: "Airbnb", title: "Lisbon check-in details", body: "Your host sent you a message", t: "20m" },
  { app: "Strava", title: "Sam gave you kudos", body: "Morning Run · 5.2 km", t: "31m" },
  { app: "Todoist", title: "3 tasks overdue", body: "Reply to the landlord", t: "40m" },
  { app: "Duolingo", title: "Don't lose your streak!", body: "12 days and counting", t: "1h" },
  { app: "Netflix", title: "New episode available", body: "Continue watching tonight?", t: "1h" },
  { app: "Instagram", title: "3 people liked your photo", body: "and 12 others", t: "2h" },
  { app: "Deliveroo", title: "Your order is on its way", body: "Arriving in 12 minutes", t: "2h" },
  { app: "Revolut", title: "Payment received", body: "£24.00 from Sam", t: "3h" },
];

/** Flat lock screen: the dark Oat surface, square-ish notification cards. */
export async function makeLockScreen() {
  await loadGlyphs();
  const { w, h } = screenSize;
  const [c, g] = canvas(w, h);
  const texture = tex(c);
  const L = dashPal.dark;
  let last = -1;

  const draw = (n: number) => {
    if (n === last) return;
    last = n;
    g.fillStyle = L.paper;
    g.fillRect(0, 0, w, h);

    // Status bar and island
    roundRect(g, w / 2 - 72, 22, 144, 40, 20);
    g.fillStyle = "#000";
    g.fill();
    text(g, "9:41", 48, 54, 24, L.ink, 600);
    roundRect(g, w - 88, 36, 40, 18, 5);
    g.strokeStyle = L.muted;
    g.lineWidth = 2;
    g.stroke();
    roundRect(g, w - 85, 39, 26, 12, 3);
    g.fillStyle = L.ink;
    g.fill();

    const shift = n > 0 ? 70 : 0;
    text(g, longDate(on(0)), w / 2, 150 - shift * 0.5, 28, L.muted, 400, serif, "center");
    text(g, "9:41", w / 2, 300 - shift * 0.6, 150, L.ink, 400, serif, "center");

    // Notifications: newest on top, older ones stack underneath.
    const visible = Math.min(n, 7);
    let y = 330 - shift * 0.4;
    for (let i = 0; i < visible; i++) {
      const note = lockNotes[(n - 1 - i) % lockNotes.length];
      roundRect(g, 22, y, w - 44, 104, 14);
      g.fillStyle = L.surface;
      g.fill();
      g.strokeStyle = L.line;
      g.lineWidth = 2;
      g.stroke();
      drawBrandTile(g, 42, y + 22, 60, brandIndex(note.app));
      text(g, note.title, 122, y + 46, 25, L.ink, 600, sans, "left", w - 240);
      text(g, note.body, 122, y + 80, 22, L.muted, 400, sans, "left", w - 180);
      text(g, note.t, w - 46, y + 44, 20, L.faint, 400, sans, "right");
      y += 116;
    }
    if (n > 7) {
      for (let k = 0; k < 2; k++) {
        roundRect(g, 40 + k * 18, y - 8 + k * 14, w - 80 - k * 36, 26, 8);
        g.fillStyle = k ? L.soft : L.surface;
        g.fill();
        g.strokeStyle = L.line;
        g.stroke();
      }
      roundRect(g, w / 2 - 150, y + 44, 300, 50, 11);
      g.fillStyle = L.coral;
      g.fill();
      text(g, `+${(n - 7) * 4} more notifications`, w / 2, y + 77, 22, L.paper, 600, sans, "center");
    }
    // Lock-screen buttons and home indicator
    for (const x of [86, w - 86]) {
      roundRect(g, x - 40, h - 160, 80, 80, 20);
      g.fillStyle = L.soft;
      g.fill();
    }
    roundRect(g, w / 2 - 90, h - 30, 180, 9, 5);
    g.fillStyle = L.ink;
    g.fill();
    texture.needsUpdate = true;
  };
  draw(0);
  return { texture, draw };
}

/**
 * The Orbit app's Oat tokens as hex (canvas can't read CSS variables).
 * KEEP IN SYNC with the light and dark token blocks in src/index.css. Sage and the tints are the
 * accent and badge backgrounds; `sageDeep` is text on sage.
 */
const dashPal = {
  light: {
    paper: "#F5F3EF", surface: "#FFFFFF", soft: "#ECE8E1", line: "#DDD7CD", lineStrong: "#C7BFB2",
    ink: "#1D1B18", muted: "#67625A", faint: "#8A847A", deep: "#EFEBE4",
    accent: "#0C6B66", sage: "#E1EFEC", sageDeep: "#084B47",
    coral: "#B8382A", info: "#6B4F8F", warn: "#8C5C00",
    tintInfo: "#ECE6F3", tintWarn: "#F6ECD9", tintCoral: "#F7E3DF",
  },
  dark: {
    paper: "#151412", surface: "#1D1B19", soft: "#272522", line: "#35322D", lineStrong: "#4A463F",
    ink: "#F2EFEA", muted: "#A9A399", faint: "#767067", deep: "#100F0E",
    accent: "#5CC9BC", sage: "#12302D", sageDeep: "#A8E3DA",
    coral: "#F07A68", info: "#BBA3DD", warn: "#E4B458",
    tintInfo: "#231D2C", tintWarn: "#2A2114", tintCoral: "#2C1A17",
  },
};
type Pal = (typeof dashPal)["light"];

/* Small drawing kit in the app's language: hairline rules, mono labels, serif titles. -------------- */

const caps = (s: string) => s.toUpperCase();

function spaced(g: CanvasRenderingContext2D, px: number, draw: () => void) {
  const ctx = g as CanvasRenderingContext2D & { letterSpacing?: string };
  ctx.letterSpacing = `${px}px`;
  draw();
  ctx.letterSpacing = "0px";
}

/** Mono uppercase kicker. */
function label(g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left") {
  spaced(g, size * 0.12, () => text(g, caps(s), x, y, size, color, 500, mono, align));
}

function rule(g: CanvasRenderingContext2D, x0: number, x1: number, y: number, color: string, lw = 2) {
  g.fillStyle = color;
  g.fillRect(x0, y - lw / 2, x1 - x0, lw);
}

/** Square-ish mono tag, 4px radius at app scale. */
function tag(g: CanvasRenderingContext2D, s: string, xRight: number, yMid: number, size: number, fg: string, bg: string | null, border: string | null) {
  g.font = `500 ${size}px ${mono}`;
  const ctx = g as CanvasRenderingContext2D & { letterSpacing?: string };
  ctx.letterSpacing = `${size * 0.1}px`;
  const tw = g.measureText(caps(s)).width;
  ctx.letterSpacing = "0px";
  const pw = size * 0.7;
  const bw = tw + pw * 2;
  const bh = size * 1.75;
  roundRect(g, xRight - bw, yMid - bh / 2, bw, bh, 6);
  if (bg) {
    g.fillStyle = bg;
    g.fill();
  }
  if (border) {
    g.strokeStyle = border;
    g.lineWidth = 1.5;
    g.stroke();
  }
  spaced(g, size * 0.1, () => text(g, caps(s), xRight - bw + pw, yMid + size * 0.35, size, fg, 500, mono));
  return bw;
}

/** Ink primary button, 7px radius at app scale. */
function inkButton(g: CanvasRenderingContext2D, s: string, xRight: number, yMid: number, P: Pal) {
  g.font = `500 21px ${sans}`;
  const bw = g.measureText(s).width + 44;
  roundRect(g, xRight - bw, yMid - 25, bw, 50, 11);
  g.fillStyle = P.ink;
  g.fill();
  text(g, s, xRight - bw / 2, yMid + 7.5, 21, P.paper, 500, sans, "center");
  return bw;
}

type Line = { lead?: string; title: string; detail?: string; source?: string; right?: string; rightColor?: string };

/** One hairline-ruled row of `h` px starting at y: optional mono lead, title, muted detail, mono source. */
function line(g: CanvasRenderingContext2D, P: Pal, x0: number, x1: number, y: number, h: number, l: Line, s = 1, leadW = 0, rightW = 0) {
  const tx = x0 + (l.lead ? leadW : 0);
  if (l.lead) text(g, l.lead, x0, y + h * 0.42, 20 * s, P.muted, 500, mono);
  const maxW = x1 - tx - rightW;
  text(g, l.title, tx, y + (l.detail || l.source ? h * 0.4 : h * 0.6), 25 * s, P.ink, 500, sans, "left", maxW);
  if (l.detail || l.source) {
    let dx = tx;
    if (l.detail) {
      text(g, l.detail, dx, y + h * 0.72, 19 * s, P.muted, 400, sans, "left", maxW - (l.source ? 100 * s : 0));
      g.font = `400 ${19 * s}px ${sans}`;
      dx += Math.min(g.measureText(l.detail).width, maxW - 100 * s) + 14 * s;
    }
    if (l.source) label(g, l.source, dx, y + h * 0.72, 13.5 * s, P.faint);
  }
  if (l.right) text(g, l.right, x1, y + h * 0.42, 22 * s, l.rightColor ?? P.ink, 500, mono, "right");
  rule(g, x0, x1, y + h, P.line);
}

/* Sample facts for the story, read from the app's data files (not its store). -------------------- */

const src = (id: SourceId) => sourceName[id];
const evToday = () => events.filter((e) => daysFrom(e.start) === 0 && !e.allDay).sort((a, b) => a.start.localeCompare(b.start));
const msg = (id: string) => messages.find((m) => m.id === id)!;
const booking = (id: string) => bookings.find((b) => b.id === id)!;
const gbp = (n: number, dp = 2) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const inDays = (s: string) => {
  const n = daysFrom(s);
  return n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
};
const eventLine = (e: CalEvent, detail?: string): Line => ({
  lead: time(e.start),
  title: e.title,
  detail: detail ?? e.location ?? (e.video ? `${e.video} call` : undefined),
  source: src(e.source),
});

/** Today screen: what the phone shows once it runs Orbit. */
export async function makeDashboard() {
  await loadGlyphs();
  const { w, h } = screenSize;
  const [c, g] = canvas(w, h);
  const P = dashPal[theme.mode];
  const X0 = 34, X1 = w - 34;
  g.fillStyle = P.paper;
  g.fillRect(0, 0, w, h);

  // Status bar
  roundRect(g, w / 2 - 72, 22, 144, 40, 20);
  g.fillStyle = "#000";
  g.fill();
  text(g, "9:41", 48, 54, 24, P.ink, 600);

  label(g, longDate(on(0)), X0, 122, 17, P.faint);
  text(g, "Good morning, Alex.", X0, 178, 47, P.ink, 400, serif, "left", w - 68);
  text(g, "Your flight to Edinburgh is tomorrow.", X0, 216, 22, P.muted, 400, sans, "left", w - 68);

  const section = (title: string, meta: string, y: number) => {
    label(g, title, X0, y, 15, P.muted);
    label(g, meta, X1, y, 13, P.faint, "right");
    rule(g, X0, X1, y + 14, P.line);
  };
  const RH = 88;

  // Today's schedule
  let y = 272;
  const sched = evToday().slice(0, 4);
  section("Today's schedule", `${sched.length} events`, y);
  y += 14;
  sched.forEach((e) => {
    line(g, P, X0, X1, y, RH, eventLine(e, e.id === "ev-review" ? "Room 4, moved from 11:00" : undefined), 1, 92);
    y += RH;
  });

  // Needs you
  y += 40;
  section("Needs you", "2 things", y);
  y += 14;
  const priya = msg("msg-priya");
  line(g, P, X0, X1, y, RH, { title: `Reply to ${priya.from.name.split(" ")[0]}`, detail: priya.why, source: src(priya.source) }, 1, 0, 170);
  inkButton(g, "Draft reply", X1, y + RH * 0.4, P);
  y += RH;
  const brisa = msg("msg-brisa");
  line(g, P, X0, X1, y, RH, { title: "Check in for BZ 1452", detail: "Check-in is open", source: src(brisa.source) });
  y += RH;

  // Coming up
  y += 40;
  section("Coming up", "Next 10 days", y);
  y += 14;
  const elec = bills.find((b) => b.id === "bill-electric")!;
  line(g, P, X0, X1, y, RH, { title: elec.name, detail: `Due ${inDays(elec.due)}`, source: src(elec.source), right: gbp(elec.amount) });
  y += RH;
  const out = booking("bk-flight-out");
  line(g, P, X0, X1, y, RH, { title: out.title, detail: `${relDay(out.start)} ${time(out.start)}`, source: src(out.source) });

  // Tab bar: flat, hairline top, active tab in accent
  const tabTop = h - 118;
  g.fillStyle = P.paper;
  g.fillRect(0, tabTop, w, 118);
  rule(g, 0, w, tabTop, P.line);
  const tabs: [Icon, string][] = [
    [House, "Today"],
    [Sparkle, "Ask"],
    [EnvelopeSimple, "Inbox"],
    [Receipt, "Money"],
    [AirplaneTilt, "Plans"],
  ];
  const icons = await Promise.all(tabs.map(([ic], i) => iconImage(ic, i === 0 ? P.accent : P.faint).catch(() => null)));
  tabs.forEach(([, name], i) => {
    const x = (w / tabs.length) * (i + 0.5);
    const img = icons[i];
    if (img) g.drawImage(img, x - 15, tabTop + 20, 30, 30);
    label(g, name, x, tabTop + 76, 13, i === 0 ? P.accent : P.faint, "center");
  });
  roundRect(g, w / 2 - 70, h - 18, 140, 6, 3);
  g.fillStyle = P.ink;
  g.globalAlpha = 0.7;
  g.fill();
  g.globalAlpha = 1;
  return tex(c);
}

/* ------------------------------------------------------------------------------------------------
 * Floating app panels: flat Orbit screens (surface, hairline border, serif title, demo tag).
 * ---------------------------------------------------------------------------------------------- */

export const panelSize = { w: 800, h: 500 };

function frame(g: CanvasRenderingContext2D, P: Pal, kicker: string, title: string) {
  const { w, h } = panelSize;
  roundRect(g, 2, 2, w - 4, h - 4, 14);
  g.fillStyle = P.surface;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = P.line;
  g.stroke();
  label(g, kicker, 36, 54, 15, P.faint);
  text(g, title, 36, 100, 42, P.ink, 400, serif, "left", w - 300);
  tag(g, "Demo data", w - 36, 50, 13, P.muted, null, P.lineStrong);
  rule(g, 36, w - 36, 124, P.line);
}

export async function makeHoloPanels() {
  await loadGlyphs();
  const P = dashPal[theme.mode];
  const make = (paint: (g: CanvasRenderingContext2D) => void) => {
    const [c, g] = canvas(panelSize.w, panelSize.h);
    paint(g);
    const t = tex(c);
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  };
  const W = panelSize.w;
  const X0 = 36, X1 = W - 36;
  const RH = 94;
  const rows = (ls: Line[], y0 = 124, leadW = 100, rightW = 0) => ls.forEach((l, i) => line(g0!, P, X0, X1, y0 + i * RH, RH, l, 1.08, leadW, rightW));
  let g0: CanvasRenderingContext2D | null = null;
  const paint = (kicker: string, title: string, body: (g: CanvasRenderingContext2D) => void) =>
    make((g) => {
      g0 = g;
      frame(g, P, kicker, title);
      body(g);
    });

  // Your day
  const today = paint(longDate(on(0)), "Today", () => {
    const evs = evToday().slice(0, 4);
    rows(evs.map((e) => eventLine(e, e.id === "ev-review" ? "Moved from 11:00" : undefined)), 124, 100);
  });

  // Ask anything
  const ask = paint("Ask Orbit", "Ask anything", (g) => {
    roundRect(g, X0, 146, X1 - X0, 60, 11);
    g.fillStyle = P.soft;
    g.fill();
    g.strokeStyle = P.line;
    g.lineWidth = 2;
    g.stroke();
    text(g, "What do I need to sort before Friday?", X0 + 22, 185, 24, P.ink, 400, sans, "left", X1 - X0 - 60);
    label(g, "Orbit found", X0, 250, 14, P.faint);
    const tk = (id: string) => tasks.find((t) => t.id === id)!;
    ["tk-numbers", "tk-checkin", "tk-boiler"].forEach((id, i) => {
      const t = tk(id);
      line(g, P, X0, X1, 266 + i * 74, 74, { title: t.title, source: src(msg(t.from?.kind === "message" ? t.from.id : "msg-brisa").source), right: relDay(t.due!), rightColor: P.muted }, 1.05);
    });
  });

  // Your money
  const dueSoon = bills.filter((b) => daysFrom(b.due) >= 0 && daysFrom(b.due) <= 7).sort((a, b) => a.due.localeCompare(b.due));
  const money = paint("Due in the next 7 days", "Bills", (g) => {
    text(g, gbp(dueSoon.reduce((s, b) => s + b.amount, 0)), X1, 100, 42, P.ink, 400, serif, "right");
    rows(dueSoon.slice(0, 3).map((b) => ({ title: b.name, detail: `Due ${inDays(b.due)}`, source: src(b.source), right: gbp(b.amount), rightColor: P.ink })), 124, 0);
  });

  // Inbox
  const inbox = paint("Gmail", "Needs a reply", (g) => {
    const list = ["msg-priya", "msg-brisa", "msg-northgrid"].map(msg);
    list.forEach((m, i) => {
      const y = 124 + i * RH;
      line(g, P, X0, X1, y, RH, { title: m.from.name, detail: m.subject, right: time(m.date), rightColor: P.faint }, 1.08, 0, m.needsReply ? 190 : 0);
      if (m.needsReply) tag(g, "Needs reply", X1 - 90, y + RH * 0.4 - 4, 13, P.warn, P.tintWarn, null);
    });
  });

  // Investments
  const total = holdings.reduce((s, h) => s + h.units * h.price, 0);
  const invest = paint("Portfolio value", "Investments", (g) => {
    text(g, gbp(total, 0), X1, 100, 42, P.ink, 400, serif, "right");
    const s = [...portfolioHistory, total];
    const x0 = X0, x1 = X1, y0 = 448, y1 = 176;
    const mn = Math.min(...s), mx = Math.max(...s);
    for (let i = 0; i < 4; i++) rule(g, x0, x1, y1 + ((y0 - y1) * i) / 3, P.line, 1.5);
    const pts = s.map((v, i) => [x0 + ((x1 - x0) * i) / (s.length - 1), y0 - ((v - mn) / (mx - mn)) * (y0 - y1)]);
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = P.accent;
    g.lineWidth = 3.5;
    g.lineJoin = "round";
    g.stroke();
    const [lx, ly] = pts[pts.length - 1];
    g.beginPath();
    g.arc(lx, ly, 6, 0, Math.PI * 2);
    g.fillStyle = P.accent;
    g.fill();
    label(g, `Last ${portfolioHistory.length} weeks`, X0, 152, 13, P.faint);
    label(g, "Trading 212, Vanguard", X1, 152, 13, P.faint, "right");
  });

  // Your plans
  const trip = trips.find((t) => t.id === "trip-edi")!;
  const plans = paint(`${dayLabel(trip.start)} to ${dayLabel(trip.end)}`, trip.title, () => {
    rows(["bk-flight-out", "bk-hotel", "bk-dinner"].map(booking).map((b) => ({
      lead: undefined,
      title: b.title,
      detail: `${relDay(b.start)} ${time(b.start)}`,
      source: src(b.source),
    })), 124, 0);
  });

  // Desktop order: top row left to right, then bottom row.
  return [today, ask, money, inbox, invest, plans];
}

/** Marquee over the machine: two lines of copy, each with two bulb phases for the chase lights. */
export function makeMarquee(label: string, phase: 0 | 1, win = false) {
  const [c, g] = canvas(1024, 176);
  roundRect(g, 4, 4, 1016, 168, 36);
  g.fillStyle = win ? "#1f1810" : "#161412";
  g.fill();
  g.strokeStyle = win ? "rgba(255,210,122,0.8)" : "rgba(240,122,104,0.5)";
  g.lineWidth = 3;
  g.stroke();
  for (let i = 0; i < 26; i++) {
    for (const y of [22, 154]) {
      const lit = (i + (y > 100 ? 1 : 0) + phase) % 2 === 0;
      g.beginPath();
      g.arc(40 + i * 37.6, y, 5.5, 0, Math.PI * 2);
      g.fillStyle = lit ? (win ? "#FFE6A8" : "#FFE0D9") : win ? "#7a5a2a" : "#4a2d27";
      g.fill();
    }
  }
  text(g, label, 512, 116, win ? 92 : 78, win ? "#FFF6DC" : "#FFEDE8", 600, mono, "center");
  return tex(c);
}
