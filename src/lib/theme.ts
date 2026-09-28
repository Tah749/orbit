import { useSyncExternalStore } from "react";

/**
 * Light or dark. The page follows the system setting unless the visitor picks one, which is kept
 * as a display preference only. index.html applies it before first paint to avoid a flash.
 */
export type Mode = "light" | "dark";
const KEY = "orbit-theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

export function currentMode(): Mode {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return media().matches ? "dark" : "light";
}

export function setMode(mode: Mode) {
  const system: Mode = media().matches ? "dark" : "light";
  try {
    if (mode === system) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
  if (mode === system) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = mode;
  syncMeta();
}

function syncMeta() {
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#f5f3ef");
}

function subscribe(cb: () => void) {
  const mq = media();
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const onMedia = () => {
    syncMeta();
    cb();
  };
  mq.addEventListener("change", onMedia);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", onMedia);
  };
}

export function useMode(): Mode {
  return useSyncExternalStore(subscribe, currentMode, () => "light");
}
