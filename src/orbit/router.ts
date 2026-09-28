import { useSyncExternalStore } from "react";

/**
 * App routes live under the site's hash router: `#/app/<section>/<...rest>`.
 * `go("inbox/msg-priya")` opens a message; `go("today")` goes home.
 */
export type Route = { section: string; rest: string[] };

function read(): Route {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  // parts[0] is "app"
  return { section: parts[1] ?? "today", rest: parts.slice(2).map(decodeURIComponent) };
}

let current = read();
const listeners = new Set<() => void>();
window.addEventListener("hashchange", () => {
  current = read();
  listeners.forEach((l) => l());
});

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => current,
  );
}

export function go(path: string) {
  const next = `#/app/${path.replace(/^\/+/, "")}`;
  if (window.location.hash !== next) window.location.hash = next;
}

export const href = (path: string) => `#/app/${path.replace(/^\/+/, "")}`;
