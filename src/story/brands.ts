import * as THREE from "three";
import { theme } from "./state";
import {
  siGmail,
  siGooglecalendar,
  siX,
  siWhatsapp,
  siInstagram,
  siSpotify,
  siUber,
  siAirbnb,
  siNetflix,
  siStrava,
  siRevolut,
  siMonzo,
  siGooglemaps,
  siNotion,
  siMessenger,
  siTelegram,
  siTiktok,
  siZoom,
  siYoutube,
  siDiscord,
  siSnapchat,
  siDuolingo,
  siBookingdotcom,
  siDeliveroo,
  siPaypal,
  siTodoist,
  siReddit,
  siGoogledrive,
  siFacebook,
} from "simple-icons";
import { roundRect } from "../journey/textures";
import { aboveNames, belowNames } from "./apps";

/*
 * App icons for the story's "too many apps" scenes. Logos come from Simple Icons (CC0) and
 * remain trademarks of their owners; the page carries a no-affiliation notice.
 */

type Fill = string | [string, string, ...string[]];
export type Brand = { name: string; path: string; bg: Fill; fg: string; tiktok?: boolean };

const b = (name: string, icon: { path: string }, bg: Fill, fg: string, extra: Partial<Brand> = {}): Brand => ({ name, path: icon.path, bg, fg, ...extra });

/** Index 0 is Orbit itself and is drawn specially. */
export const brands: Brand[] = [
  { name: "Orbit", path: "", bg: "#0B0A10", fg: "#fff" },
  b("Gmail", siGmail, "#FFFFFF", "#EA4335"),
  b("Calendar", siGooglecalendar, "#FFFFFF", "#4285F4"),
  b("X", siX, "#000000", "#FFFFFF"),
  b("WhatsApp", siWhatsapp, "#25D366", "#FFFFFF"),
  b("Instagram", siInstagram, ["#FEDA75", "#FA7E1E", "#D62976", "#962FBF", "#4F5BD5"], "#FFFFFF"),
  b("Spotify", siSpotify, "#121212", "#1ED760"),
  b("Uber", siUber, "#000000", "#FFFFFF"),
  b("Airbnb", siAirbnb, "#FFFFFF", "#FF5A5F"),
  b("Netflix", siNetflix, "#000000", "#E50914"),
  b("Strava", siStrava, "#FC4C02", "#FFFFFF"),
  b("Revolut", siRevolut, "#191C1F", "#FFFFFF"),
  b("Monzo", siMonzo, "#14233C", "#FF6F61"),
  b("Maps", siGooglemaps, "#FFFFFF", "#34A853"),
  b("Notion", siNotion, "#FFFFFF", "#000000"),
  b("Messenger", siMessenger, ["#00B2FF", "#A033FF", "#FF5C87"], "#FFFFFF"),
  b("Telegram", siTelegram, "#26A5E4", "#FFFFFF"),
  b("TikTok", siTiktok, "#000000", "#FFFFFF", { tiktok: true }),
  b("Zoom", siZoom, "#0B5CFF", "#FFFFFF"),
  b("YouTube", siYoutube, "#FFFFFF", "#FF0000"),
  b("Discord", siDiscord, "#5865F2", "#FFFFFF"),
  b("Snapchat", siSnapchat, "#FFFC00", "#000000"),
  b("Duolingo", siDuolingo, "#58CC02", "#FFFFFF"),
  b("Booking.com", siBookingdotcom, "#003A9A", "#FFFFFF"),
  b("Deliveroo", siDeliveroo, "#00CCBC", "#FFFFFF"),
  b("PayPal", siPaypal, "#FFFFFF", "#002991"),
  b("Todoist", siTodoist, "#E44332", "#FFFFFF"),
  b("Reddit", siReddit, "#FF4500", "#FFFFFF"),
  b("Drive", siGoogledrive, "#FFFFFF", "#1FA463"),
  b("Facebook", siFacebook, "#0866FF", "#FFFFFF"),
];

export const ORBIT = 0;
export const brandIndex = (name: string) => brands.findIndex((x) => x.name === name);

/** The apps that break out of the reels and join Orbit's network, in scene order. */
export const aboveApps = aboveNames.map(brandIndex);
export const belowApps = belowNames.map(brandIndex);
export const networkApps = [...aboveApps, ...belowApps];

/* ------------------------------------------------------------------------------------------------
 * Drawing
 * ---------------------------------------------------------------------------------------------- */

/** Orbit's app icon: a lit sphere inside a tilted ring, with a satellite on the near side. */
export function drawOrbitIcon(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.save();
  roundRect(g, x, y, s, s, s * 0.225);
  const bg = g.createLinearGradient(x, y, x, y + s);
  bg.addColorStop(0, "#2A2723");
  bg.addColorStop(1, "#151412");
  g.fillStyle = bg;
  g.fill();
  // The Tracked mark: a monoline o and an accent tittle.
  const u = s * 0.00566;
  const ox = x + s * 0.217, oy = y + s * 0.217;
  g.beginPath();
  g.arc(ox + 44 * u, oy + 56 * u, 29 * u, 0, Math.PI * 2);
  g.strokeStyle = "#F5F3EF";
  g.lineWidth = 11 * u;
  g.stroke();
  g.beginPath();
  g.arc(ox + 84 * u, oy + 22 * u, 10 * u, 0, Math.PI * 2);
  g.fillStyle = "#5CC9BC";
  g.fill();
  g.restore();
  roundRect(g, x + 1, y + 1, s - 2, s - 2, s * 0.225);
  g.strokeStyle = "rgba(255,255,255,0.08)";
  g.lineWidth = Math.max(1, s * 0.01);
  g.stroke();
}

export function drawBrandTile(g: CanvasRenderingContext2D, x: number, y: number, s: number, i: number) {
  if (i === ORBIT) return drawOrbitIcon(g, x, y, s);
  const br = brands[i];
  g.save();
  roundRect(g, x, y, s, s, s * 0.225);
  if (Array.isArray(br.bg)) {
    const grad = g.createLinearGradient(x, y + s, x + s, y);
    br.bg.forEach((c, n) => grad.addColorStop(n / (br.bg.length - 1), c));
    g.fillStyle = grad;
  } else g.fillStyle = br.bg;
  g.fill();
  g.clip();
  const hi = g.createLinearGradient(x, y, x, y + s);
  hi.addColorStop(0, "rgba(255,255,255,0.14)");
  hi.addColorStop(0.5, "rgba(255,255,255,0)");
  g.fillStyle = hi;
  g.fillRect(x, y, s, s);
  const glyph = new Path2D(br.path);
  const k = (s * 0.54) / 24;
  const draw = (dx: number, dy: number, color: string) => {
    g.save();
    g.translate(x + s * 0.23 + dx, y + s * 0.23 + dy);
    g.scale(k, k);
    g.fillStyle = color;
    g.fill(glyph);
    g.restore();
  };
  if (br.tiktok) {
    draw(-s * 0.018, -s * 0.012, "#25F4EE");
    draw(s * 0.018, s * 0.012, "#FE2C55");
  }
  draw(0, 0, br.fg);
  g.restore();
  if (br.bg === "#FFFFFF" || br.bg === "#FFFC00") return;
  roundRect(g, x + 1, y + 1, s - 2, s - 2, s * 0.225);
  g.strokeStyle = "rgba(255,255,255,0.08)";
  g.lineWidth = Math.max(1, s * 0.008);
  g.stroke();
}

function texture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export const brandGrid = { cols: 6, rows: 5 };

/** Every app icon in one texture: the reels and the network sprites sample from it. */
export function makeBrandAtlas() {
  const T = 256;
  const c = document.createElement("canvas");
  c.width = T * brandGrid.cols;
  c.height = T * brandGrid.rows;
  const g = c.getContext("2d")!;
  brands.forEach((_, i) => drawBrandTile(g, (i % brandGrid.cols) * T + 18, Math.floor(i / brandGrid.cols) * T + 18, T - 36, i));
  return texture(c);
}

/* Notification cards that burst out of the phone (same 2 x 6 layout as the journey atlas). */
const sans = '"Geist Variable", system-ui, sans-serif';

export const burstNotes: { app: string; title: string; meta: string }[] = [
  { app: "Gmail", title: "Priya: numbers for the Q4 review?", meta: "Gmail · now" },
  { app: "WhatsApp", title: "Family: 14 new messages", meta: "WhatsApp · 1m" },
  { app: "X", title: "You have 23 new notifications", meta: "X · 3m" },
  { app: "Calendar", title: "Dentist moved to 3:30pm", meta: "Calendar · 5m" },
  { app: "Monzo", title: "You spent £18.40 on coffee", meta: "Monzo · 9m" },
  { app: "Uber", title: "Your driver is 2 min away", meta: "Uber · 12m" },
  { app: "Airbnb", title: "Check-in details for Lisbon", meta: "Airbnb · 20m" },
  { app: "Strava", title: "Sam gave you kudos", meta: "Strava · 31m" },
  { app: "Netflix", title: "New episode available", meta: "Netflix · 40m" },
  { app: "Duolingo", title: "Keep your 12-day streak!", meta: "Duolingo · 1h" },
  { app: "Instagram", title: "3 people liked your photo", meta: "Instagram · 1h" },
  { app: "Deliveroo", title: "Your order is on its way", meta: "Deliveroo · 2h" },
];

export async function makeBrandCardAtlas() {
  const light = theme.mode === "light";
  try {
    await Promise.all([document.fonts.load(`600 34px ${sans}`), document.fonts.load(`400 26px ${sans}`)]);
  } catch {
    /* system font */
  }
  const W = 640, H = 160;
  const c = document.createElement("canvas");
  c.width = W * 2;
  c.height = H * 6;
  const g = c.getContext("2d")!;
  burstNotes.forEach((n, i) => {
    const x = (i % 2) * W, y = Math.floor(i / 2) * H;
    roundRect(g, x + 8, y + 8, W - 16, H - 16, 34);
    const body = g.createLinearGradient(x, y, x, y + H);
    body.addColorStop(0, light ? "rgba(255,255,255,0.98)" : "rgba(42,39,35,0.97)");
    body.addColorStop(1, light ? "rgba(245,243,239,0.98)" : "rgba(27,25,23,0.97)");
    g.fillStyle = body;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = light ? "rgba(199,191,178,0.95)" : "rgba(84,79,71,0.9)";
    g.stroke();
    drawBrandTile(g, x + 30, y + 34, 92, brandIndex(n.app));
    g.fillStyle = light ? "#1D1B18" : "#F2EFEA";
    g.font = `600 33px ${sans}`;
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    g.fillText(n.title, x + 146, y + 76, W - 146 - 36);
    g.fillStyle = light ? "#67625A" : "#A9A399";
    g.font = `400 26px ${sans}`;
    g.fillText(n.meta, x + 146, y + 114, W - 146 - 36);
  });
  return texture(c);
}
