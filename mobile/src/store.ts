import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEY, restore, seed, serialize, type Collection, type DB, type Item } from "@orbit/seed";
import { visible } from "@orbit/visible";

export type { Collection, DB, Item };

/**
 * The whole app's data, held on the device. Same API as the web store (src/orbit/store.ts).
 * It starts as sample data; `hydrate()` loads the saved copy from AsyncStorage before first render.
 */
let state: DB = seed();
let hydrated = false;
const listeners = new Set<() => void>();
const hydrationListeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(KEY, serialize(state)).catch(() => {});
  }, 250);
}

function emit() {
  listeners.forEach((l) => l());
  save();
}

export async function hydrate() {
  if (hydrated) return;
  try {
    state = restore(await AsyncStorage.getItem(KEY));
  } catch {
    state = seed();
  }
  hydrated = true;
  viewCache = null;
  listeners.forEach((l) => l());
  hydrationListeners.forEach((l) => l());
}

/** True once the saved data has been read. */
export function useHydrated() {
  const [ok, setOk] = useState(hydrated);
  useEffect(() => {
    if (hydrated) return setOk(true);
    const l = () => setOk(true);
    hydrationListeners.add(l);
    return () => void hydrationListeners.delete(l);
  }, []);
  return ok;
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

/** The store as sections see it: without data from connections switched off in Settings. */
let viewCache: { s: DB; v: DB } | null = null;
export function view(): DB {
  if (!viewCache || viewCache.s !== state) viewCache = { s: state, v: visible(state) };
  return viewCache.v;
}

/** Subscribe to part of the store: `useDB((d) => d.tasks.filter((t) => !t.done))`. Derived arrays are safe. */
export function useDB<T>(select: (d: DB) => T): T {
  const cache = useRef<{ s: DB; f: (d: DB) => T; v: T } | null>(null);
  const get = () => {
    const c = cache.current;
    if (!c || c.s !== state || c.f !== select) cache.current = { s: state, f: select, v: select(view()) };
    return cache.current!.v;
  };
  return useSyncExternalStore(db.subscribe, get, get);
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
