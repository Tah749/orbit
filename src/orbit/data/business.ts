import { at, on } from "../time";
import type { SourceId } from "./sources";

/* Fern & Thread: Alex's small online shop (candles and prints), selling on Shopify and Etsy. */

export type Channel = "shopify" | "etsy" | "stripe";

export type ShopOrder = {
  id: string;
  number: string;
  channel: Channel;
  date: string;
  items: { productId: string; qty: number }[];
  total: number;
  status: "unfulfilled" | "fulfilled" | "refunded";
  /** Town only; Orbit doesn't need customer details. */
  shipTo: string;
};

export type Product = { id: string; name: string; price: number; stock: number; reorderAt: number };

export type Payout = { id: string; channel: Channel; date: string; amount: number; status: "paid" | "in-transit" | "scheduled" };

export type DayRevenue = { date: string; revenue: number; orders: number };

export const shop = { name: "Fern & Thread", channels: ["shopify", "etsy"] as SourceId[] };

export const products: Product[] = [
  { id: "p-juniper", name: "Juniper candle", price: 24, stock: 3, reorderAt: 8 },
  { id: "p-fig", name: "Fig & cedar candle", price: 24, stock: 17, reorderAt: 8 },
  { id: "p-tin", name: "Travel tin trio", price: 18, stock: 26, reorderAt: 10 },
  { id: "p-print-a3", name: "Heath print, A3", price: 32, stock: 11, reorderAt: 5 },
  { id: "p-print-a4", name: "Heath print, A4", price: 22, stock: 2, reorderAt: 5 },
  { id: "p-card", name: "Gift card", price: 25, stock: 999, reorderAt: 0 },
];

/** Last 30 days, oldest first. Deterministic so charts don't jump. */
export const revenue: DayRevenue[] = Array.from({ length: 30 }, (_, i) => {
  const d = i - 29;
  const weekday = (new Date().getDay() + d + 70) % 7;
  const weekend = weekday === 0 || weekday === 6 ? 1.45 : 1;
  const base = 70 + i * 2.4 + Math.sin(i * 0.8) * 22;
  const orders = Math.max(1, Math.round((base * weekend) / 26));
  return { date: on(d), orders, revenue: Math.round(base * weekend * 100) / 100 };
});

let k = 1040;
const o = (days: number, hhmm: string, channel: Channel, items: ShopOrder["items"], status: ShopOrder["status"], shipTo: string): ShopOrder => {
  const total = items.reduce((s, it) => s + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0) + 3.95;
  return { id: `so-${k}`, number: `#${k++}`, channel, date: at(days, hhmm), items, total: Math.round(total * 100) / 100, status, shipTo };
};

export const shopOrders: ShopOrder[] = [
  o(-6, "10:12", "shopify", [{ productId: "p-fig", qty: 2 }], "fulfilled", "Leeds"),
  o(-5, "21:40", "etsy", [{ productId: "p-print-a3", qty: 1 }], "fulfilled", "Brighton"),
  o(-4, "08:03", "shopify", [{ productId: "p-tin", qty: 1 }, { productId: "p-juniper", qty: 1 }], "fulfilled", "Glasgow"),
  o(-3, "19:55", "shopify", [{ productId: "p-card", qty: 1 }], "fulfilled", "London"),
  o(-3, "12:30", "etsy", [{ productId: "p-print-a4", qty: 2 }], "refunded", "Cardiff"),
  o(-2, "16:18", "shopify", [{ productId: "p-juniper", qty: 2 }], "fulfilled", "York"),
  o(-1, "09:44", "shopify", [{ productId: "p-fig", qty: 1 }, { productId: "p-print-a4", qty: 1 }], "unfulfilled", "Bath"),
  o(-1, "20:05", "etsy", [{ productId: "p-print-a3", qty: 1 }], "unfulfilled", "Norwich"),
  o(0, "07:21", "shopify", [{ productId: "p-tin", qty: 2 }], "unfulfilled", "Manchester"),
  o(0, "08:50", "shopify", [{ productId: "p-juniper", qty: 1 }], "unfulfilled", "Bristol"),
];

export const payouts: Payout[] = [
  { id: "po-1", channel: "shopify", date: on(-8), amount: 356.1, status: "paid" },
  { id: "po-2", channel: "etsy", date: on(-7), amount: 142.75, status: "paid" },
  { id: "po-3", channel: "shopify", date: on(-1), amount: 412.6, status: "in-transit" },
  { id: "po-4", channel: "etsy", date: on(6), amount: 96.4, status: "scheduled" },
  { id: "po-5", channel: "shopify", date: on(6), amount: 288.0, status: "scheduled" },
];
