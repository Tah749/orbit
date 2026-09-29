import { daysFrom, on, shiftDates } from "./time";
import { messages } from "./data/mail";
import { events } from "./data/calendar";
import { tasks } from "./data/tasks";
import { accounts, bills, budgets, holdings, portfolioHistory, txns } from "./data/money";
import { bookings, orders, trips } from "./data/plans";
import { contacts, daily, docs, workouts } from "./data/life";
import { payouts, products, revenue, shopOrders } from "./data/business";
import { connections, settings } from "./data/connections";

/**
 * The whole app's data, held in the browser. There is no server: this is sample data that the
 * app reads and edits locally, saved to localStorage so changes survive a reload.
 */
export function seed() {
  return {
    messages,
    events,
    tasks,
    accounts,
    txns,
    bills,
    budgets,
    holdings,
    portfolioHistory,
    trips,
    bookings,
    orders,
    contacts,
    docs,
    workouts,
    daily,
    products,
    revenue,
    shopOrders,
    payouts,
    connections,
    settings,
  };
}

export type DB = ReturnType<typeof seed>;
/** Collections that are arrays of items with an `id`. */
export type Collection = {
  [K in keyof DB]: DB[K] extends { id: string }[] ? K : never;
}[keyof DB];
export type Item<K extends Collection> = DB[K][number];

export const KEY = "orbit.app.v1";
/** Bump when the sample data changes shape or content, so saved copies are replaced. */
export const SEED_VERSION = 3;
export type Saved = { seededOn: string; version?: number; db: DB };

/** Turns saved text back into a store. Any problem at all gives fresh sample data. */
export function restore(raw: string | null): DB {
  try {
    if (raw) {
      const saved = JSON.parse(raw) as Saved;
      if (saved.version !== SEED_VERSION) return seed();
      // Keep sample data current: move every date forward by the days since it was saved.
      const gap = -daysFrom(saved.seededOn);
      const db = shiftDates(saved.db, gap);
      return { ...seed(), ...db };
    }
  } catch {
    /* corrupt: start fresh */
  }
  return seed();
}

export function serialize(db: DB): string {
  return JSON.stringify({ seededOn: on(0), version: SEED_VERSION, db } satisfies Saved);
}
