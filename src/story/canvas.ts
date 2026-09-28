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
import { iconImage, roundRect } from "../journey/textures";
import { brandIndex, drawBrandTile, drawOrbitIcon } from "./brands";
import { theme } from "./state";

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

function wrap(g: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number, lh: number, size: number, color: string, weight = 400) {
  g.font = `${weight} ${size}px ${sans}`;
  g.fillStyle = color;
  g.textAlign = "left";
  let line = "";
  for (const word of s.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y);
      line = word;
      y += lh;
    } else line = test;
  }
  g.fillText(line, x, y);
  return y;
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

function mark(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, ink: string, accent: string) {
  const u = r / 40;
  g.beginPath();
  g.arc(cx - 6 * u, cy + 6 * u, 29 * u, 0, Math.PI * 2);
  g.strokeStyle = ink;
  g.lineWidth = 11 * u;
  g.stroke();
  g.beginPath();
  g.arc(cx + 34 * u, cy - 28 * u, 10 * u, 0, Math.PI * 2);
  g.fillStyle = accent;
  g.fill();
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

export async function makeLockScreen() {
  await loadGlyphs();
  const { w, h } = screenSize;
  const [c, g] = canvas(w, h);
  const texture = tex(c);
  let last = -1;

  const draw = (n: number) => {
    if (n === last) return;
    last = n;
    const bg = g.createRadialGradient(w * 0.5, h * 0.32, 0, w * 0.5, h * 0.4, h * 0.75);
    bg.addColorStop(0, "#3a2c47");
    bg.addColorStop(0.42, "#0f2a28");
    bg.addColorStop(1, "#0b0a09");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    const blob = g.createRadialGradient(w * 0.85, h * 0.78, 0, w * 0.85, h * 0.78, w * 0.8);
    blob.addColorStop(0, "rgba(92,201,188,0.24)");
    blob.addColorStop(1, "rgba(92,201,188,0)");
    g.fillStyle = blob;
    g.fillRect(0, 0, w, h);

    // Status bar and island
    roundRect(g, w / 2 - 72, 22, 144, 40, 20);
    g.fillStyle = "#000";
    g.fill();
    text(g, "9:41", 48, 54, 24, "#fff", 600);
    roundRect(g, w - 88, 36, 40, 18, 5);
    g.strokeStyle = "rgba(255,255,255,0.8)";
    g.lineWidth = 2;
    g.stroke();
    roundRect(g, w - 85, 39, 26, 12, 3);
    g.fillStyle = "#fff";
    g.fill();

    const shift = n > 0 ? 70 : 0;
    text(g, "Tuesday 14 October", w / 2, 150 - shift * 0.5, 28, "rgba(255,255,255,0.8)", 500, sans, "center");
    text(g, "9:41", w / 2, 300 - shift * 0.6, 150, "#fff", 600, sans, "center");

    // Notifications: newest on top, older ones stack underneath.
    const visible = Math.min(n, 7);
    let y = 330 - shift * 0.4;
    for (let i = 0; i < visible; i++) {
      const note = lockNotes[(n - 1 - i) % lockNotes.length];
      roundRect(g, 22, y, w - 44, 104, 30);
      g.fillStyle = "rgba(40,37,34,0.8)";
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.07)";
      g.stroke();
      drawBrandTile(g, 42, y + 22, 60, brandIndex(note.app));
      text(g, note.title, 122, y + 46, 25, "#fff", 600, sans, "left", w - 240);
      text(g, note.body, 122, y + 80, 22, "rgba(255,255,255,0.72)", 400, sans, "left", w - 180);
      text(g, note.t, w - 46, y + 44, 20, "rgba(255,255,255,0.5)", 400, sans, "right");
      y += 116;
    }
    if (n > 7) {
      for (let k = 0; k < 2; k++) {
        roundRect(g, 40 + k * 18, y - 8 + k * 14, w - 80 - k * 36, 26, 13);
        g.fillStyle = `rgba(40,37,34,${0.6 - k * 0.2})`;
        g.fill();
      }
      roundRect(g, w / 2 - 150, y + 44, 300, 50, 25);
      g.fillStyle = "rgba(240,122,104,0.95)";
      g.fill();
      text(g, `+${(n - 7) * 4} more notifications`, w / 2, y + 77, 22, "#151412", 600, sans, "center");
    }
    // Lock-screen buttons and home indicator
    for (const x of [86, w - 86]) {
      g.beginPath();
      g.arc(x, h - 120, 40, 0, Math.PI * 2);
      g.fillStyle = "rgba(255,255,255,0.12)";
      g.fill();
    }
    roundRect(g, w / 2 - 90, h - 30, 180, 9, 5);
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.fill();
    texture.needsUpdate = true;
  };
  draw(0);
  return { texture, draw };
}

/** The Orbit app itself, in the Oat scheme. */
const dashPal = {
  light: {
    bg: "#F5F3EF", glowA: "rgba(12,107,102,0.1)", glowB: "rgba(107,79,143,0.05)", glowEnd: "rgba(245,243,239,0)",
    ink: "#1D1B18", muted: "#67625A", soft: "#ECE8E1", card: "#FFFFFF", line: "#E4DFD6",
    sage: "#E1EFEC", sageLine: "#C9E0DB", sageInk: "#084B47",
    accent: "#0C6B66", info: "#6B4F8F", warn: "#8C5C00", tabs: "rgba(29,27,24,0.94)",
  },
  dark: {
    bg: "#151412", glowA: "rgba(92,201,188,0.14)", glowB: "rgba(187,163,221,0.06)", glowEnd: "rgba(21,20,18,0)",
    ink: "#F2EFEA", muted: "#A9A399", soft: "#272522", card: "#1D1B19", line: "#2B2926",
    sage: "#12302D", sageLine: "#1E4642", sageInk: "#A8E3DA",
    accent: "#5CC9BC", info: "#BBA3DD", warn: "#E4B458", tabs: "rgba(39,37,34,0.94)",
  },
};

export async function makeDashboard() {
  const gl = await loadGlyphs();
  const { w, h } = screenSize;
  const [c, g] = canvas(w, h);
  const D = dashPal[theme.mode];
  g.fillStyle = D.bg;
  g.fillRect(0, 0, w, h);
  const glow = g.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, h * 0.55);
  glow.addColorStop(0, D.glowA);
  glow.addColorStop(0.5, D.glowB);
  glow.addColorStop(1, D.glowEnd);
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);

  roundRect(g, w / 2 - 72, 22, 144, 40, 20);
  g.fillStyle = "#000";
  g.fill();
  text(g, "9:41", 48, 54, 24, D.ink, 600);

  drawOrbitIcon(g, 30, 102, 44);
  text(g, "orbit", 84, 133, 28, D.ink, 500);
  g.beginPath();
  g.arc(w - 52, 124, 22, 0, Math.PI * 2);
  g.fillStyle = D.soft;
  g.fill();
  text(g, "A", w - 52, 132, 22, D.info, 600, sans, "center");

  text(g, "Good morning, Alex.", 32, 222, 42, D.ink, 600);
  text(g, "Tuesday 14 October", 32, 260, 23, D.muted);

  // Briefing
  roundRect(g, 24, 290, w - 48, 200, 28);
  const bb = g.createLinearGradient(0, 290, 0, 490);
  bb.addColorStop(0, D.sage);
  bb.addColorStop(1, D.card);
  g.fillStyle = bb;
  g.fill();
  g.strokeStyle = D.sageLine;
  g.lineWidth = 2;
  g.stroke();
  mark(g, 56, 330, 11, D.sageInk, D.accent);
  text(g, "Your briefing", 76, 338, 21, D.sageInk, 600);
  wrap(g, "A lighter day than usual. Stand-up at 09:30, the review moved to 15:00, and you fly to Edinburgh tomorrow.", 48, 380, w - 96, 34, 24, D.ink);

  // Today
  text(g, "Today", 32, 540, 25, D.ink, 600);
  [
    ["09:30", "Team stand-up", D.accent],
    ["12:30", "Lunch with Tomás", D.info],
    ["15:00", "Q4 project review", D.warn],
  ].forEach(([t, e, col], i) => {
    const y = 566 + i * 76;
    roundRect(g, 24, y, w - 48, 64, 18);
    g.fillStyle = D.card;
    g.fill();
    g.strokeStyle = D.line;
    g.lineWidth = 2;
    g.stroke();
    roundRect(g, 40, y + 16, 5, 32, 3);
    g.fillStyle = col;
    g.fill();
    text(g, t, 62, y + 41, 21, D.muted, 500, mono);
    text(g, e, 150, y + 41, 23, D.ink, 500);
  });

  // Coming up: two tiles
  text(g, "Coming up", 32, 830, 25, D.ink, 600);
  const tiles = [
    { app: 9, t: "Electricity", s: "£68.32 · due Friday" },
    { app: 5, t: "LHR to EDI", s: "Tomorrow · 16:20" },
  ];
  tiles.forEach((it, i) => {
    const x = 24 + i * ((w - 48) / 2 + 8);
    const tw = (w - 48) / 2 - 8;
    roundRect(g, x, 852, tw, 150, 22);
    g.fillStyle = D.card;
    g.fill();
    g.strokeStyle = D.line;
    g.lineWidth = 2;
    g.stroke();
    appTile(g, x + 18, 870, 48, it.app, gl[it.app]);
    text(g, it.t, x + 18, 954, 23, D.ink, 600);
    text(g, it.s, x + 18, 984, 19, D.muted);
  });

  // Needs attention
  text(g, "Needs a reply", 32, 1054, 25, D.ink, 600);
  roundRect(g, 24, 1074, w - 48, 90, 20);
  g.fillStyle = D.card;
  g.fill();
  g.strokeStyle = D.line;
  g.lineWidth = 2;
  g.stroke();
  drawBrandTile(g, 40, 1092, 54, brandIndex("Gmail"));
  text(g, "Priya Shah", 112, 1112, 22, D.ink, 600);
  text(g, "Numbers for the Q4 review", 112, 1144, 20, D.muted);
  roundRect(g, w - 144, 1102, 100, 34, 17);
  g.fillStyle = D.sage;
  g.fill();
  text(g, "Draft", w - 94, 1126, 19, D.sageInk, 600, sans, "center");

  // Tab bar
  roundRect(g, 24, h - 118, w - 48, 84, 42);
  g.fillStyle = D.tabs;
  g.fill();
  const tabs = [10, 0, 11, 1, 12];
  tabs.forEach((gi, i) => {
    const x = 24 + ((w - 48) / tabs.length) * (i + 0.5);
    const img = gl[gi];
    if (i === 0) {
      g.beginPath();
      g.arc(x, h - 76, 30, 0, Math.PI * 2);
      g.fillStyle = D.accent;
      g.fill();
    }
    if (img) {
      g.globalAlpha = i === 0 ? 1 : 0.55;
      g.drawImage(img, x - 17, h - 93, 34, 34);
      g.globalAlpha = 1;
    }
  });
  return tex(c);
}

/* ------------------------------------------------------------------------------------------------
 * Hologram panels (light on transparent, lit up additively in the scene)
 * ---------------------------------------------------------------------------------------------- */

const holo = { ink: "#EFFBF8", muted: "#A8CFC9", rose: "#F4A393", amber: "#EFC77A", violet: "#8FE0D5", line: "rgba(143,224,213,0.55)" };
export const panelSize = { w: 800, h: 500 };

function frame(g: CanvasRenderingContext2D, title: string, glyph: HTMLImageElement | null) {
  const { w, h } = panelSize;
  roundRect(g, 6, 6, w - 12, h - 12, 30);
  g.fillStyle = "rgba(92,201,188,0.08)";
  g.fill();
  g.lineWidth = 2.5;
  g.strokeStyle = holo.line;
  g.stroke();
  // Corner brackets
  g.strokeStyle = "rgba(236,251,248,0.95)";
  g.lineWidth = 4;
  const b = 34;
  for (const [x, y, dx, dy] of [
    [6, 6, 1, 1],
    [w - 6, 6, -1, 1],
    [6, h - 6, 1, -1],
    [w - 6, h - 6, -1, -1],
  ]) {
    g.beginPath();
    g.moveTo(x, y + dy * b);
    g.lineTo(x, y + dy * 12);
    g.quadraticCurveTo(x, y, x + dx * 12, y);
    g.lineTo(x + dx * b, y);
    g.stroke();
  }
  if (glyph) g.drawImage(glyph, 34, 30, 34, 34);
  text(g, title, 80, 58, 30, holo.ink, 600);
  roundRect(g, w - 170, 30, 136, 30, 15);
  g.strokeStyle = "rgba(143,224,213,0.5)";
  g.lineWidth = 1.5;
  g.stroke();
  text(g, "DEMO DATA", w - 102, 51, 15, holo.muted, 500, mono, "center");
  g.fillStyle = "rgba(143,224,213,0.25)";
  g.fillRect(34, 84, w - 68, 1.5);
}

function row(g: CanvasRenderingContext2D, y: number, left: string, mid: string, right: string, rightColor = holo.muted, midColor = holo.ink) {
  text(g, left, 34, y, 22, holo.muted, 500, mono);
  text(g, mid, 150, y, 25, midColor, 500, sans, "left", 440);
  text(g, right, panelSize.w - 34, y, 21, rightColor, 500, sans, "right");
}

export async function makeHoloPanels() {
  const gl = await loadGlyphs();
  const make = (paint: (g: CanvasRenderingContext2D) => void) => {
    const [c, g] = canvas(panelSize.w, panelSize.h);
    paint(g);
    const t = tex(c);
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  };
  const W = panelSize.w;

  const calendar = make((g) => {
    frame(g, "Today", gl[1]);
    [
      ["09:30", "Team stand-up", "30 min"],
      ["12:30", "Lunch with Tomás", "Dishoom"],
      ["15:00", "Q4 project review", "Moved"],
      ["16:20", "Flight to Edinburgh", "Tomorrow"],
    ].forEach(([t, e, r], i) => {
      const y = 150 + i * 82;
      g.fillStyle = i === 2 ? "rgba(244,163,147,0.12)" : "rgba(143,224,213,0.06)";
      roundRect(g, 24, y - 44, W - 48, 64, 16);
      g.fill();
      row(g, y, t, e, r, i === 2 ? holo.rose : holo.muted);
    });
  });

  const briefing = make((g) => {
    frame(g, "Good morning, Alex", gl[12]);
    wrap(g, "A lighter day than usual. Your stand-up is at 09:30, the project review moved to 15:00, and you fly to Edinburgh tomorrow afternoon.", 34, 140, W - 68, 40, 27, holo.ink);
    text(g, "PRIORITIES", 34, 300, 17, holo.muted, 500, mono);
    ["Send numbers to Priya", "Renew car insurance", "Pack for Edinburgh"].forEach((p, i) => {
      const y = 330 + i * 50;
      g.beginPath();
      g.arc(50, y + 12, 15, 0, Math.PI * 2);
      g.fillStyle = "rgba(244,163,147,0.25)";
      g.fill();
      text(g, String(i + 1), 50, y + 19, 18, holo.rose, 600, mono, "center");
      text(g, p, 80, y + 21, 24, holo.ink, 500);
    });
  });

  const bills = make((g) => {
    frame(g, "Bills", gl[9]);
    text(g, "NEXT 30 DAYS", 34, 130, 17, holo.muted, 500, mono);
    text(g, "£285.80", 34, 190, 54, holo.ink, 600, mono);
    text(g, "DUE THIS WEEK", W - 34, 130, 17, holo.muted, 500, mono, "right");
    text(g, "£98.31", W - 34, 190, 54, holo.amber, 600, mono, "right");
    [
      ["Electricity", "£68.32", "in 3 days"],
      ["Broadband", "£29.99", "in 4 days"],
      ["Music streaming", "£10.99", "in 10 days"],
    ].forEach(([n, a, d], i) => {
      const y = 262 + i * 70;
      g.fillStyle = "rgba(143,224,213,0.06)";
      roundRect(g, 24, y - 40, W - 48, 58, 14);
      g.fill();
      text(g, n, 44, y, 24, holo.ink, 500);
      text(g, a, W - 190, y, 23, holo.ink, 500, mono, "right");
      text(g, d, W - 44, y, 20, i < 2 ? holo.amber : holo.muted, 500, sans, "right");
    });
  });

  const inbox = make((g) => {
    frame(g, "Important emails", gl[0]);
    [
      ["Priya Shah", "Numbers for the Q4 review", "Needs reply", holo.rose],
      ["Lumen Fibre", "Your October bill is ready", "Bill", holo.amber],
      ["Hotel Calder", "Your booking is confirmed", "Travel", holo.violet],
    ].forEach(([f, s, tag, col], i) => {
      const y = 108 + i * 118;
      g.fillStyle = "rgba(143,224,213,0.06)";
      roundRect(g, 24, y, W - 48, 100, 18);
      g.fill();
      g.beginPath();
      g.arc(74, y + 50, 26, 0, Math.PI * 2);
      g.fillStyle = "rgba(143,224,213,0.16)";
      g.fill();
      text(g, f[0], 74, y + 59, 24, holo.ink, 600, sans, "center");
      text(g, f, 118, y + 42, 25, holo.ink, 600);
      text(g, s, 118, y + 76, 22, holo.muted);
      g.font = `600 17px ${sans}`;
      const tw = g.measureText(tag).width + 28;
      roundRect(g, W - 44 - tw, y + 34, tw, 32, 16);
      g.strokeStyle = col;
      g.lineWidth = 1.5;
      g.stroke();
      text(g, tag, W - 44 - tw / 2, y + 56, 17, col, 600, sans, "center");
    });
  });

  const investments = make((g) => {
    frame(g, "Investments", gl[7]);
    text(g, "PORTFOLIO", 34, 130, 17, holo.muted, 500, mono);
    text(g, "£24,832", 34, 186, 52, holo.ink, 600, mono);
    text(g, "1M", W - 34, 130, 17, holo.muted, 500, mono, "right");
    const s = [22.9, 23.1, 22.8, 23.4, 23.2, 23.6, 23.5, 23.9, 23.7, 24.1, 24.0, 24.3, 24.1, 24.5, 24.4, 24.83];
    const x0 = 34, x1 = W - 34, y0 = 450, y1 = 230;
    const mn = Math.min(...s), mx = Math.max(...s);
    const pts = s.map((v, i) => [x0 + ((x1 - x0) * i) / (s.length - 1), y0 - ((v - mn) / (mx - mn)) * (y0 - y1)]);
    const fill = g.createLinearGradient(0, y1, 0, y0);
    fill.addColorStop(0, "rgba(244,163,147,0.35)");
    fill.addColorStop(1, "rgba(244,163,147,0)");
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineTo(x1, y0);
    g.lineTo(x0, y0);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = holo.rose;
    g.lineWidth = 4;
    g.stroke();
    const [lx, ly] = pts[pts.length - 1];
    g.beginPath();
    g.arc(lx, ly, 8, 0, Math.PI * 2);
    g.fillStyle = "#fff";
    g.fill();
  });

  const bookings = make((g) => {
    frame(g, "Bookings", gl[5]);
    text(g, "Edinburgh", 34, 142, 34, holo.ink, 600);
    text(g, "Wed 15 to Fri 17 October · 3 bookings", 34, 178, 21, holo.muted);
    [
      [5, "Flight BZ 1452, LHR to EDI", "Wed · 16:20"],
      [4, "Hotel Calder, 2 nights", "Check-in 15:00"],
      [1, "Dinner at The Kitchin", "Thu · 19:30"],
    ].forEach(([a, t, r], i) => {
      const y = 214 + i * 82;
      g.fillStyle = "rgba(143,224,213,0.06)";
      roundRect(g, 24, y, W - 48, 68, 16);
      g.fill();
      appTile(g, 38, y + 12, 44, a as number, gl[a as number]);
      text(g, t as string, 100, y + 43, 23, holo.ink, 500, sans, "left", 420);
      text(g, r as string, W - 44, y + 43, 20, holo.muted, 500, sans, "right");
    });
  });

  // Desktop order: top row left to right, then bottom row.
  return [calendar, briefing, bills, inbox, investments, bookings];
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
      if (lit) {
        g.shadowColor = win ? "#FFD27A" : "#F07A68";
        g.shadowBlur = 14;
      }
      g.fill();
      g.shadowBlur = 0;
    }
  }
  const glow = win ? "#FFB84D" : "#F07A68";
  const fill = win ? "#FFD98A" : "#F58B7A";
  g.shadowColor = glow;
  g.shadowBlur = 30;
  for (let k = 0; k < 2; k++) text(g, label, 512, 116, win ? 92 : 78, fill, 600, mono, "center");
  g.shadowBlur = 0;
  text(g, label, 512, 116, win ? 92 : 78, win ? "#FFF6DC" : "#FFEDE8", 600, mono, "center");
  return tex(c);
}
