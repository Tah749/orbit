import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Small persisted preferences (AsyncStorage). Values are strings; parse in the caller. */
const cache = new Map<string, string>();
const subs = new Map<string, Set<(v: string | null) => void>>();

export async function getPref(key: string): Promise<string | null> {
  if (cache.has(key)) return cache.get(key)!;
  try {
    const v = await AsyncStorage.getItem(key);
    if (v !== null) cache.set(key, v);
    return v;
  } catch {
    return null;
  }
}

export function setPref(key: string, value: string) {
  cache.set(key, value);
  subs.get(key)?.forEach((f) => f(value));
  AsyncStorage.setItem(key, value).catch(() => {});
}

/** A persisted string preference with a default: `const [v, set] = usePref("orbit.x", "a")`. */
export function usePref<T extends string>(key: string, fallback: T, allowed?: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>((cache.get(key) as T | undefined) ?? fallback);
  useEffect(() => {
    let live = true;
    const ok = (v: string | null): v is T => v !== null && (!allowed || (allowed as readonly string[]).includes(v));
    getPref(key).then((v) => live && ok(v) && setValue(v));
    const f = (v: string | null) => ok(v) && setValue(v);
    if (!subs.has(key)) subs.set(key, new Set());
    subs.get(key)!.add(f);
    return () => {
      live = false;
      subs.get(key)!.delete(f);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((v: T) => setPref(key, v), [key]);
  return [value, set];
}

export type HomeMode = "minimal" | "jarvis";
export const HOME_MODE_KEY = "orbit.home.mode";
/** Which Home screen is showing. Remembered on the device. */
export const useHomeMode = () => usePref<HomeMode>(HOME_MODE_KEY, "minimal", ["minimal", "jarvis"]);
