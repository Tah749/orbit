import { useRef, useSyncExternalStore } from "react";
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
function seed() {
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

const KEY = "orbit.app.v1";
type Saved = { seededOn: string; db: DB };

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Saved;
      // Keep sample data current: move every date forward by the days since it was saved.
      const gap = -daysFrom(saved.seededOn);
      const db = shiftDates(saved.db, gap);
      return { ...seed(), ...db };
    }
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return seed();
}

let state: DB = load();
const listeners = new Set<() => void>();
let saveTimer = 0;

function emit() {
  listeners.forEach((l) => l());
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ seededOn: on(0), db: state } satisfies Saved));
    } catch {
      /* ignore quota or privacy mode */
    }
  }, 250);
}

export const db = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Replace a top-level key. */
  set<K extends keyof DB>(key: K, value: DB[K] | ((prev: DB[K]) => DB[K])) {
    const next = typeof value === "function" ? (value as (p: DB[K]) => DB[K])(state[key]) : value;
    state = { ...state, [key]: next };
    emit();
  },
  patch<K extends Collection>(key: K, id: string, change: Partial<Item<K>>) {
    db.set(key, ((list: Item<K>[]) => list.map((x) => (x.id === id ? { ...x, ...change } : x))) as never);
  },
  insert<K extends Collection>(key: K, item: Item<K>, where: "start" | "end" = "start") {
    db.set(key, ((list: Item<K>[]) => (where === "start" ? [item, ...list] : [...list, item])) as never);
  },
  remove<K extends Collection>(key: K, id: string) {
    db.set(key, ((list: Item<K>[]) => list.filter((x) => x.id !== id)) as never);
  },
  find<K extends Collection>(key: K, id: string): Item<K> | undefined {
    return (state[key] as Item<K>[]).find((x) => x.id === id);
  },
  /** Back to the original sample data. */
  reset() {
    state = seed();
    emit();
  },
};

/**
 * Subscribe to part of the store: `useDB((d) => d.tasks.filter((t) => !t.done))`.
 * The result is cached until the store or the selector changes, so derived arrays are safe.
 */
export function useDB<T>(select: (d: DB) => T): T {
  const cache = useRef<{ s: DB; f: (d: DB) => T; v: T } | null>(null);
  const get = () => {
    const c = cache.current;
    if (!c || c.s !== state || c.f !== select) cache.current = { s: state, f: select, v: select(state) };
    return cache.current!.v;
  };
  return useSyncExternalStore(db.subscribe, get, get);
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
