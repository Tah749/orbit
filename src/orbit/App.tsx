import { Suspense, useEffect, useState } from "react";
import "@fontsource-variable/newsreader";
import { DotsThree, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Wordmark } from "../components/ui/Logo";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { sections, sectionByKey, type Section } from "./sections";
import { href, useRoute } from "./router";
import { useDB } from "./store";
import { cx, Kbd, Skeleton, Toasts } from "./ui";
import { CommandPalette } from "./CommandPalette";
import { on, stamp } from "./time";

const groups: { key: Section["group"]; label?: string }[] = [
  { key: "main" },
  { key: "life", label: "Life" },
  { key: "admin", label: "Admin" },
];

/** Little counts beside nav items, so the sidebar says what's waiting. */
function useBadges(): Record<string, number> {
  return useDB((d) => ({
    inbox: d.messages.filter((m) => m.folder === "inbox" && !m.read).length,
    tasks: d.tasks.filter((t) => !t.done && t.due && t.due <= on(0)).length,
    deliveries: d.orders.filter((o) => o.status === "out-for-delivery").length,
    business: d.shopOrders.filter((o) => o.status === "unfulfilled").length,
  }));
}

function NavItem({ s, active, badge, onNavigate }: { s: Section; active: boolean; badge?: number; onNavigate?: () => void }) {
  const Icon = s.icon;
  return (
    <a
      href={href(s.key)}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group flex h-8 items-center gap-2.5 rounded-[7px] px-2 text-[13.5px] transition-colors",
        active ? "bg-soft font-medium text-ink" : "text-muted hover:bg-soft/60 hover:text-ink",
      )}
    >
      <Icon size={17} weight={active ? "fill" : "regular"} className={active ? "text-accent" : "text-faint group-hover:text-muted"} />
      <span className="flex-1 truncate">{s.label}</span>
      {!!badge && <span className="font-mono text-[11px] tabular-nums text-faint">{badge}</span>}
    </a>
  );
}

function Sidebar({ current, onNavigate, onSearch }: { current: string; onNavigate?: () => void; onSearch: () => void }) {
  const badges = useBadges();
  const lastSync = useDB((d) => d.connections.reduce((a, c) => (c.lastSync && c.lastSync > a ? c.lastSync : a), ""));
  return (
    <nav aria-label="Orbit" className="flex h-full flex-col gap-5 px-3 pb-4 pt-5">
      <div className="flex items-center justify-between px-2">
        <a href="#/" aria-label="Orbit website" className="text-ink">
          <Wordmark className="h-[17px]" />
        </a>
        <ThemeToggle className="size-8" />
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="mx-1 flex h-8 items-center gap-2 rounded-[7px] border border-line bg-surface px-2.5 text-[13px] text-faint transition-colors hover:border-line-strong hover:text-muted"
      >
        <MagnifyingGlass size={14} />
        <span className="flex-1 text-left">Search or ask</span>
        <Kbd>⌘K</Kbd>
      </button>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.key} className="flex flex-col gap-0.5">
            {g.label && <p className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{g.label}</p>}
            {sections
              .filter((s) => s.group === g.key)
              .map((s) => (
                <NavItem key={s.key} s={s} active={current === s.key} badge={badges[s.key]} onNavigate={onNavigate} />
              ))}
          </div>
        ))}
      </div>
      <div className="mx-2 border-t border-line pt-3 text-[11.5px] leading-snug text-faint">
        <p>Sample data. Nothing is connected.</p>
        {lastSync && <p className="mt-0.5">Refreshed {stamp(lastSync)}</p>}
      </div>
    </nav>
  );
}

function MobileBar({ current, onMore }: { current: string; onMore: () => void }) {
  const tabs = sections.filter((s) => s.tab);
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {tabs.map((s) => {
          const Icon = s.icon;
          const on = current === s.key;
          return (
            <a key={s.key} href={href(s.key)} className={cx("flex h-14 flex-col items-center justify-center gap-1 text-[10.5px]", on ? "text-ink" : "text-faint")}>
              <Icon size={21} weight={on ? "fill" : "regular"} className={on ? "text-accent" : ""} />
              {s.label}
            </a>
          );
        })}
        <button type="button" onClick={onMore} className="flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] text-faint">
          <DotsThree size={21} weight="bold" />
          More
        </button>
      </div>
    </nav>
  );
}

export default function OrbitApp() {
  const route = useRoute();
  const section = sectionByKey(route.section);
  const Page = section.page;
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    document.title = `${section.label} · Orbit`;
    setMenu(false);
    window.scrollTo(0, 0);
  }, [section.key, section.label]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="orbit-app min-h-dvh bg-paper text-ink">
      <a href="#orbit-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[232px] border-r border-line bg-paper md:block">
        <Sidebar current={section.key} onSearch={() => setPalette(true)} />
      </aside>

      {/* Phone header */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur md:hidden">
        <a href="#/" aria-label="Orbit website" className="text-ink">
          <Wordmark className="h-[15px]" />
        </a>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Search or ask" onClick={() => setPalette(true)} className="grid size-9 place-items-center rounded-[7px] text-muted">
            <MagnifyingGlass size={18} />
          </button>
          <ThemeToggle className="size-9" />
        </div>
      </header>

      <main id="orbit-main" className="md:pl-[232px]">
        <Suspense
          fallback={
            <div className="mx-auto max-w-[1080px] px-4 pt-10 sm:px-8">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-3 h-10 w-72" />
              <Skeleton className="mt-8 h-64 w-full" />
            </div>
          }
        >
          <Page key={section.key} />
        </Suspense>
      </main>

      <MobileBar current={section.key} onMore={() => setMenu(true)} />
      {menu && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="All sections">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[color-mix(in_srgb,var(--ink)_28%,transparent)]" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 w-[78%] max-w-[300px] border-r border-line bg-paper">
            <div className="absolute right-2 top-4">
              <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="grid size-9 place-items-center rounded-[7px] text-muted">
                <X size={18} />
              </button>
            </div>
            <Sidebar current={section.key} onNavigate={() => setMenu(false)} onSearch={() => (setMenu(false), setPalette(true))} />
          </div>
        </div>
      )}
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <Toasts />
    </div>
  );
}
