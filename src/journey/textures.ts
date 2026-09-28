import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import type { Icon } from "@phosphor-icons/react";
import {
  EnvelopeSimple,
  CalendarBlank,
  Receipt,
  AirplaneTilt,
  Bank,
  Heartbeat,
  CheckSquare,
  ChartLineUp,
  ChatCircle,
  Bed,
  Bell,
  CreditCard,
} from "@phosphor-icons/react";

/** Soft radial falloff used for every glow sprite in the scene. */
export function makeGlowTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.14)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Demo notifications. Illustrative only, like the rest of the site's previews. */
export const notes: { icon: Icon; title: string; meta: string; tone: string }[] = [
  { icon: ChatCircle, title: "Sam: still on for Friday?", meta: "Messages · 2m", tone: "#A78BFA" },
  { icon: Receipt, title: "Council tax due in 3 days", meta: "Bills · today", tone: "#FFA24D" },
  { icon: AirplaneTilt, title: "Check-in opens for LIS", meta: "Travel · 1h", tone: "#A78BFA" },
  { icon: CalendarBlank, title: "Dentist moved to 3:30pm", meta: "Calendar · 5m", tone: "#FF4D7A" },
  { icon: Bank, title: "Your statement is ready", meta: "Banking · 9:02", tone: "#FFB0C4" },
  { icon: CreditCard, title: "Streaming plan renews", meta: "Subscriptions · Fri", tone: "#FF5A4F" },
  { icon: EnvelopeSimple, title: "14 unread from school", meta: "Email · 12m", tone: "#FF4D7A" },
  { icon: Heartbeat, title: "Spin class at 7:00am", meta: "Fitness · tomorrow", tone: "#FF5A4F" },
  { icon: CheckSquare, title: "Reply to the landlord", meta: "Tasks · overdue", tone: "#FFB0C4" },
  { icon: ChartLineUp, title: "Portfolio weekly update", meta: "Investments · 8:00", tone: "#FFA24D" },
  { icon: Bed, title: "Hotel booking confirmed", meta: "Travel · Sat", tone: "#A78BFA" },
  { icon: Bell, title: "3 new notifications", meta: "Everywhere · now", tone: "#FF4D7A" },
];

export const atlasGrid = { cols: 2, rows: 6 };
const tileW = 640;
const tileH = 160;

export function iconImage(icon: Icon, color: string): Promise<HTMLImageElement> {
  const host = document.createElement("div");
  const root = createRoot(host);
  flushSync(() => root.render(createElement(icon, { size: 64, color, weight: "bold" })));
  const svg = host.innerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  root.unmount();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Draws every notification card into one texture atlas, in the site's own type and colours. */
export async function makeCardAtlas() {
  const c = document.createElement("canvas");
  c.width = tileW * atlasGrid.cols;
  c.height = tileH * atlasGrid.rows;
  const g = c.getContext("2d")!;
  try {
    await Promise.all([document.fonts.load('600 36px "Geist Variable"'), document.fonts.load('400 26px "Geist Variable"')]);
  } catch {
    /* fall back to the system font */
  }
  const icons = await Promise.all(notes.map((n) => iconImage(n.icon, n.tone).catch(() => null)));

  notes.forEach((n, i) => {
    const x = (i % atlasGrid.cols) * tileW;
    const y = Math.floor(i / atlasGrid.cols) * tileH;
    const pad = 8;
    // Card body
    roundRect(g, x + pad, y + pad, tileW - pad * 2, tileH - pad * 2, 34);
    const body = g.createLinearGradient(x, y, x, y + tileH);
    body.addColorStop(0, "rgba(34,31,43,0.97)");
    body.addColorStop(1, "rgba(22,20,29,0.97)");
    g.fillStyle = body;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = "rgba(78,70,98,0.9)";
    g.stroke();
    // Icon tile
    roundRect(g, x + 30, y + 34, 92, 92, 24);
    g.fillStyle = "#0B0A10";
    g.fill();
    g.strokeStyle = "rgba(46,42,58,1)";
    g.stroke();
    const img = icons[i];
    if (img) g.drawImage(img, x + 44, y + 48, 64, 64);
    // Text
    g.fillStyle = "#F8F6FB";
    g.font = '600 34px "Geist Variable", system-ui, sans-serif';
    g.textBaseline = "alphabetic";
    g.fillText(n.title, x + 146, y + 76, tileW - 146 - 36);
    g.fillStyle = "#A39DB0";
    g.font = '400 26px "Geist Variable", system-ui, sans-serif';
    g.fillText(n.meta, x + 146, y + 114, tileW - 146 - 36);
    // Unread dot
    g.beginPath();
    g.arc(x + tileW - 42, y + 44, 8, 0, Math.PI * 2);
    g.fillStyle = n.tone;
    g.fill();
  });

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
