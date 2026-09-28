import type { DayRevenue, Product, ShopOrder } from "../../data/business";
import type { Task } from "../../data/tasks";
import { daysFrom } from "../../time";

/* Figures for the business page, worked out from the shop's orders and daily totals. */

export type Totals = { revenue: number; orders: number; refunds: number; refundCount: number; aov: number };

export function totals(days: DayRevenue[], orders: ShopOrder[]): Totals {
  const revenue = days.reduce((s, d) => s + d.revenue, 0);
  const count = days.reduce((s, d) => s + d.orders, 0);
  const refunds = days.reduce((s, d) => s + (d.refunds ?? 0), 0);
  return { revenue, orders: count, refunds, refundCount: orders.filter((o) => o.status === "refunded").length, aov: count ? revenue / count : 0 };
}

/** Orders placed in the last `n` days, today included. */
export const within = (orders: ShopOrder[], n: number, offset = 0) =>
  orders.filter((o) => {
    const d = daysFrom(o.date) + offset;
    return d <= 0 && d > -n;
  });

/** "Up 12% on the previous 7 days". Undefined when there is nothing to compare with. */
export function change(now: number, before: number, period: string) {
  if (!before) return undefined;
  const pct = Math.round(((now - before) / before) * 100);
  if (Math.abs(pct) < 2) return `Level with the previous ${period}`;
  return `${pct > 0 ? "Up" : "Down"} ${Math.abs(pct)}% on the previous ${period}`;
}

export type Sold = { product: Product; units: number; value: number };

/** Units sold per product, refunds left out. */
export function sold(products: Product[], orders: ShopOrder[]): Sold[] {
  return products.map((product) => {
    let units = 0;
    for (const o of orders) {
      if (o.status === "refunded") continue;
      for (const it of o.items) if (it.productId === product.id) units += it.qty;
    }
    return { product, units, value: units * product.price };
  });
}

export const orderTaskTitle = (o: ShopOrder) => `Post order ${o.number} to ${o.shipTo}`;
export const findOrderTask = (tasks: Task[], o: ShopOrder) => tasks.find((t) => t.list === "shop" && t.title.includes(o.number));

/** An open restock task for this product, however it was worded ("Restock Juniper candles"). */
export const findRestockTask = (tasks: Task[], p: Product) =>
  tasks.find((t) => t.list === "shop" && !t.done && /restock|reorder/i.test(t.title) && t.title.toLowerCase().includes(p.name.toLowerCase()));

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
