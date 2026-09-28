import { at, daysFrom, on, parse } from "../time";
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

export type DayRevenue = {
  date: string;
  /** Takings from orders placed that day, postage included. */
  revenue: number;
  orders: number;
  /** Value of that day's orders that were later refunded. */
  refunds?: number;
};

export const shop = { name: "Fern & Thread", channels: ["shopify", "etsy"] as SourceId[] };

export const products: Product[] = [
  { id: "p-juniper", name: "Juniper candle", price: 24, stock: 3, reorderAt: 8 },
  { id: "p-fig", name: "Fig & cedar candle", price: 24, stock: 17, reorderAt: 8 },
  { id: "p-tin", name: "Travel tin trio", price: 18, stock: 26, reorderAt: 10 },
  { id: "p-print-a3", name: "Heath print, A3", price: 32, stock: 11, reorderAt: 5 },
  { id: "p-print-a4", name: "Heath print, A4", price: 22, stock: 2, reorderAt: 5 },
  { id: "p-card", name: "Gift card", price: 25, stock: 999, reorderAt: 0 },
];

/** Gift cards are digital: their stock figure is a placeholder, not a count. */
export const untracked = (p: Product) => p.reorderAt === 0 && p.stock >= 999;

const orderTotal = (items: ShopOrder["items"]) =>
  Math.round((items.reduce((s, it) => s + (products.find((p) => p.id === it.productId)?.price ?? 0) * it.qty, 0) + 3.95) * 100) / 100;

let k = 1040;
const o = (days: number, hhmm: string, channel: Channel, items: ShopOrder["items"], status: ShopOrder["status"], shipTo: string): ShopOrder => {
  return { id: `so-${k}`, number: `#${k++}`, channel, date: at(days, hhmm), items, total: orderTotal(items), status, shipTo };
};

/** The most recent orders, written out by hand (other sections refer to these ids). */
const recent: ShopOrder[] = [
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

/* The rest of the order history is generated from a fixed seed, so figures and charts are the same on every visit. */

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const towns = ["Leeds", "Bristol", "Edinburgh", "Hove", "Frome", "Sheffield", "Oxford", "Totnes", "Cambridge", "Durham", "Exeter", "Belfast", "Stroud", "Whitby", "Ludlow", "London", "Kendal", "Margate"];

/** How often each product sells, and how likely an order for it comes through Etsy rather than Shopify. */
const mix: { id: string; weight: number; etsy: number }[] = [
  { id: "p-fig", weight: 26, etsy: 0.25 },
  { id: "p-juniper", weight: 24, etsy: 0.25 },
  { id: "p-tin", weight: 18, etsy: 0.3 },
  { id: "p-print-a3", weight: 12, etsy: 0.6 },
  { id: "p-print-a4", weight: 15, etsy: 0.6 },
  { id: "p-card", weight: 5, etsy: 0 },
];

type Draft = Omit<ShopOrder, "id" | "number">;

function generate(from: number, to: number, seed: number): Draft[] {
  const r = seeded(seed);
  const total = mix.reduce((s, m) => s + m.weight, 0);
  const pick = () => {
    let n = r() * total;
    return mix.find((m) => (n -= m.weight) < 0) ?? mix[0];
  };
  const out: Draft[] = [];
  for (let d = from; d <= to; d++) {
    const weekday = parse(on(d)).getDay();
    const weekend = weekday === 0 || weekday === 6 ? 1.4 : 1;
    const written = recent.filter((x) => daysFrom(x.date) === d).length;
    let count = Math.round((2.4 + (d + 60) * 0.022) * weekend + r() * 1.6) - written;
    if (d === -3) count = Math.max(1, count);
    const day: Draft[] = [];
    for (let i = 0; i < count; i++) {
      const first = pick();
      const items = [{ productId: first.id, qty: r() < 0.82 ? 1 : 2 }];
      if (r() < 0.28) {
        const second = pick();
        if (second.id !== first.id) items.push({ productId: second.id, qty: 1 });
      }
      const hh = String(7 + Math.floor(r() * 16)).padStart(2, "0");
      const mm = String(Math.floor(r() * 60)).padStart(2, "0");
      day.push({
        channel: r() < first.etsy ? "etsy" : "shopify",
        date: at(d, `${hh}:${mm}`),
        items,
        total: orderTotal(items),
        status: r() < 0.035 ? "refunded" : "fulfilled",
        shipTo: towns[Math.floor(r() * towns.length)],
      });
    }
    out.push(...day.sort((a, b) => a.date.localeCompare(b.date)));
  }
  return out;
}

const history = generate(-29, -1, 7);
// One order from a few days back is still waiting to be posted.
const waiting = history.filter((x) => daysFrom(x.date) === -3).pop();
if (waiting) waiting.status = "unfulfilled";
const firstNumber = 1040 - history.length;

/** Every order from the last 30 days, oldest first. */
export const shopOrders: ShopOrder[] = [
  ...history.map((x, i) => ({ ...x, id: `so-${firstNumber + i}`, number: `#${firstNumber + i}` })),
  ...recent,
].sort((a, b) => a.date.localeCompare(b.date));

function byDay(list: Draft[], from: number, to: number): DayRevenue[] {
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const day = list.filter((x) => daysFrom(x.date) === from + i);
    const sum = (xs: Draft[]) => Math.round(xs.reduce((s, x) => s + x.total, 0) * 100) / 100;
    return { date: on(from + i), orders: day.length, revenue: sum(day), refunds: sum(day.filter((x) => x.status === "refunded")) };
  });
}

/** Last 30 days, oldest first, summed from the orders above. */
export const revenue: DayRevenue[] = byDay(shopOrders, -29, 0);

/** The 30 days before that, for comparisons. Only the daily totals are kept. */
export const revenueBefore: DayRevenue[] = byDay(generate(-59, -30, 11), -59, -30);

export const payouts: Payout[] = [
  { id: "po-8", channel: "shopify", date: on(-22), amount: 318.45, status: "paid" },
  { id: "po-9", channel: "etsy", date: on(-21), amount: 121.3, status: "paid" },
  { id: "po-10", channel: "shopify", date: on(-18), amount: 329.75, status: "paid" },
  { id: "po-6", channel: "shopify", date: on(-15), amount: 344.9, status: "paid" },
  { id: "po-7", channel: "etsy", date: on(-14), amount: 133.2, status: "paid" },
  { id: "po-11", channel: "shopify", date: on(-11), amount: 371.4, status: "paid" },
  { id: "po-1", channel: "shopify", date: on(-8), amount: 356.1, status: "paid" },
  { id: "po-12", channel: "shopify", date: on(-4), amount: 338.2, status: "paid" },
  { id: "po-2", channel: "etsy", date: on(-7), amount: 142.75, status: "paid" },
  { id: "po-3", channel: "shopify", date: on(-1), amount: 412.6, status: "in-transit" },
  { id: "po-4", channel: "etsy", date: on(6), amount: 96.4, status: "scheduled" },
  { id: "po-5", channel: "shopify", date: on(6), amount: 288.0, status: "scheduled" },
];
