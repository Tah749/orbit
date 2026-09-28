import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import {
  House,
  Tray,
  CalendarBlank,
  EnvelopeSimple,
  Receipt,
  ChartLineUp,
  AirplaneTilt,
  Heartbeat,
  CheckSquare,
  Sparkle,
  GearSix,
  MagnifyingGlass,
  DotsNine,
  ArrowLeft,
  X,
  Info,
} from "@phosphor-icons/react";
import { Orb } from "../components/ui/Logo";
import { StoreProvider, useStore } from "./store";
import { bookings, calEvents, inboxItems, mails, bills, type TabKey } from "./data";
import { HomeScreen } from "./screens/Home";
import { InboxScreen } from "./screens/Inbox";
import { CalendarScreen } from "./screens/Calendar";
import { EmailScreen } from "./screens/Email";
import { BillsScreen } from "./screens/Bills";
import { InvestmentsScreen } from "./screens/Investments";
import { BookingsScreen } from "./screens/Bookings";
import { FitnessScreen } from "./screens/Fitness";
import { TasksScreen } from "./screens/Tasks";
import { AssistantScreen } from "./screens/Assistant";
import { SettingsScreen } from "./screens/Settings";

export const navItems: { key: TabKey; label: string; icon: Icon }[] = [
  { key: "home", label: "Home", icon: House },
  { key: "inbox", label: "Life Inbox", icon: Tray },
  { key: "assistant", label: "Assistant", icon: Sparkle },
  { key: "calendar", label: "Calendar", icon: CalendarBlank },
  { key: "email", label: "Email", icon: EnvelopeSimple },
  { key: "bills", label: "Bills", icon: Receipt },
  { key: "investments", label: "Investments", icon: ChartLineUp },
  { key: "bookings", label: "Bookings", icon: AirplaneTilt },
  { key: "fitness", label: "Fitness", icon: Heartbeat },
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "settings", label: "Settings", icon: GearSix },
];

const mobileTabs: TabKey[] = ["home", "inbox", "assistant", "calendar"];

const screens: Record<TabKey, () => ReactNode> = {
  home: () => <HomeScreen />,
  inbox: () => <InboxScreen />,
  calendar: () => <CalendarScreen />,
  email: () => <EmailScreen />,
  bills: () => <BillsScreen />,
  investments: () => <InvestmentsScreen />,
  bookings: () => <BookingsScreen />,
  fitness: () => <FitnessScreen />,
  tasks: () => <TasksScreen />,
  assistant: () => <AssistantScreen />,
  settings: () => <SettingsScreen />,
};

function Sidebar() {
  const { tab, go, tasks, readInbox } = useStore();
  const counts: Partial<Record<TabKey, number>> = {
    inbox: inboxItems.filter((i) => i.important && !readInbox.includes(i.id)).length,
    tasks: tasks.filter((t) => t.group === "today" && !t.done).length,
  };
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-line bg-[#0e0d13] lg:flex">
      <a href="#/" className="flex items-center gap-2.5 px-5 pb-4 pt-5" aria-label="Back to the Orbit website">
        <Orb className="size-5" />
        <span className="text-[16px] font-medium tracking-[-0.02em]">Orbit</span>
      </a>
      <nav aria-label="App" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {navItems.map(({ key, label, icon: I }) => {
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => go(key)}
              aria-current={on ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors ${
                on ? "bg-soft text-ink" : "text-muted hover:bg-surface hover:text-ink"
              } ${key === "settings" ? "mt-auto mb-3" : ""}`}
            >
              <I size={17} weight={on ? "fill" : "regular"} className={on ? "text-accent" : ""} />
              <span className="flex-1">{label}</span>
              {counts[key] ? (
                <span className="rounded-full bg-accent px-1.5 text-[10.5px] font-semibold leading-[18px] text-paper">{counts[key]}</span>
              ) : null}
            </button>
          );
        })}
      </nav>
      <div className="m-3 flex items-center gap-2.5 rounded-xl border border-line p-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-[#2a2140] text-[12px] font-medium text-info">AR</span>
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink">Alex Rowe</p>
          <p className="text-[11px] text-muted">Demo account</p>
        </div>
      </div>
    </aside>
  );
}

type Hit = { label: string; meta: string; tab: TabKey };

function useSearchIndex(): Hit[] {
  return useMemo(
    () => [
      ...mails.map((m) => ({ label: m.subject, meta: `Email from ${m.from}`, tab: "email" as TabKey })),
      ...inboxItems.map((i) => ({ label: i.title, meta: `Life Inbox · ${i.source}`, tab: "inbox" as TabKey })),
      ...bookings.map((b) => ({ label: b.title, meta: `Booking · ${b.when}`, tab: "bookings" as TabKey })),
      ...calEvents.map((e) => ({ label: e.title, meta: `Calendar${e.where ? ` · ${e.where}` : ""}`, tab: "calendar" as TabKey })),
      ...bills.map((b) => ({ label: b.name, meta: `Bills · ${b.due}`, tab: "bills" as TabKey })),
    ],
    [],
  );
}

function Search({ onDone }: { onDone?: () => void }) {
  const { go, ask } = useStore();
  const index = useSearchIndex();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const hits = q.trim().length > 1 ? index.filter((h) => `${h.label} ${h.meta}`.toLowerCase().includes(q.toLowerCase())).slice(0, 7) : [];
  const pick = (h: Hit) => {
    go(h.tab);
    setQ("");
    setOpen(false);
    onDone?.();
  };
  return (
    <div className="relative w-full">
      <label htmlFor="app-search" className="sr-only">
        Search Orbit
      </label>
      <MagnifyingGlass size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        id="app-search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hits[0]) pick(hits[0]);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search emails, bookings, bills..."
        autoComplete="off"
        className="h-10 w-full rounded-full border border-line bg-soft pl-10 pr-4 text-[13.5px] text-ink placeholder:text-[#8a8398] focus:border-accent focus:outline-none"
      />
      {open && q.trim().length > 1 && (
        <div className="absolute inset-x-0 top-12 z-30 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
          {hits.length ? (
            <ul>
              {hits.map((h) => (
                <li key={h.label + h.meta}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(h)} className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-soft">
                    <span className="truncate text-[13px] text-ink">{h.label}</span>
                    <span className="truncate text-[11.5px] text-muted">{h.meta}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-[13px] text-muted">No matches in your demo data.</p>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              ask(q);
              setQ("");
              setOpen(false);
              onDone?.();
            }}
            className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-[13px] text-accent-fg hover:bg-soft"
          >
            <Sparkle size={14} weight="fill" /> Ask Orbit: "{q}"
          </button>
        </div>
      )}
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { tab, go } = useStore();
  const [searching, setSearching] = useState(false);
  const current = navItems.find((n) => n.key === tab)!;
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-xl md:px-6">
      {searching ? (
        <div className="flex w-full items-center gap-2 md:hidden">
          <Search onDone={() => setSearching(false)} />
          <button type="button" aria-label="Close search" onClick={() => setSearching(false)} className="grid size-10 shrink-0 place-items-center rounded-full text-muted">
            <X size={18} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 lg:hidden">
            <Orb className="size-5" />
            <span className="text-[15px] font-medium">{current.label}</span>
          </div>
          <div className="hidden max-w-md flex-1 md:block">
            <Search />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" aria-label="Search" onClick={() => setSearching(true)} className="grid size-10 place-items-center rounded-full text-muted hover:text-ink md:hidden">
              <MagnifyingGlass size={18} />
            </button>
            <button
              type="button"
              onClick={() => go("assistant")}
              className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] text-ink transition-colors hover:border-[#433d52] sm:inline-flex"
            >
              <Sparkle size={14} weight="fill" className="text-accent" /> Ask Orbit
            </button>
            <button type="button" aria-label="More sections" onClick={onMenu} className="grid size-10 place-items-center rounded-full text-muted hover:text-ink lg:hidden">
              <DotsNine size={20} />
            </button>
          </div>
        </>
      )}
    </header>
  );
}

function MobileTabBar({ onMore }: { onMore: () => void }) {
  const { tab, go } = useStore();
  const moreActive = !mobileTabs.includes(tab);
  return (
    <nav aria-label="App" className="grid shrink-0 grid-cols-5 border-t border-line bg-paper px-1 pb-[max(8px,env(safe-area-inset-bottom,0px))] pt-1.5 lg:hidden">
      {mobileTabs.map((k) => {
        const item = navItems.find((n) => n.key === k)!;
        const I = item.icon;
        const on = tab === k;
        return (
          <button key={k} type="button" onClick={() => go(k)} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-1 text-[10.5px] ${on ? "text-accent" : "text-muted"}`}>
            <I size={21} weight={on ? "fill" : "regular"} />
            {k === "inbox" ? "Inbox" : item.label}
          </button>
        );
      })}
      <button type="button" onClick={onMore} className={`flex flex-col items-center gap-0.5 py-1 text-[10.5px] ${moreActive ? "text-accent" : "text-muted"}`}>
        <DotsNine size={21} weight={moreActive ? "fill" : "regular"} />
        More
      </button>
    </nav>
  );
}

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tab, go } = useStore();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
          <motion.div
            role="dialog"
            aria-label="All sections"
            initial={reduce ? false : { y: 40 }}
            animate={{ y: 0 }}
            exit={reduce ? {} : { y: 40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface p-4 pb-[max(20px,env(safe-area-inset-bottom,0px))]"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <div className="grid grid-cols-3 gap-2">
              {navItems.map(({ key, label, icon: I }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    go(key);
                    onClose();
                  }}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-[12px] ${tab === key ? "bg-accent-bg text-accent-fg" : "bg-soft text-ink"}`}
                >
                  <I size={20} />
                  {label}
                </button>
              ))}
            </div>
            <a href="#/" className="mt-4 flex items-center justify-center gap-1.5 py-2 text-[13px] text-muted">
              <ArrowLeft size={13} /> Back to the Orbit website
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.p
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="rounded-full border border-line bg-soft px-4 py-2.5 text-[13px] text-ink shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]"
          >
            {t.text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Shell() {
  const { tab } = useStore();
  const [more, setMore] = useState(false);
  const reduce = useReducedMotion();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.scrollTo(0, 0);
  }, [tab]);
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-center gap-2 border-b border-line bg-accent-bg px-4 py-1.5 text-center text-[12px] text-accent-fg">
          <Info size={13} className="shrink-0" />
          <span>
            Interactive demo with sample data. Nothing is connected or sent.{" "}
            <a href="#/" className="underline underline-offset-2 hover:text-ink">
              Back to website
            </a>
          </span>
        </div>
        <TopBar onMenu={() => setMore(true)} />
        <main ref={main} id="main" className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8 md:py-8"
            >
              {screens[tab]()}
            </motion.div>
          </AnimatePresence>
        </main>
        <MobileTabBar onMore={() => setMore(true)} />
      </div>
      <MoreSheet open={more} onClose={() => setMore(false)} />
      <Toasts />
    </div>
  );
}

export default function OrbitApp({ tab, go }: { tab: TabKey; go: (t: TabKey) => void }) {
  useEffect(() => {
    const prev = document.title;
    document.title = "Orbit demo";
    return () => {
      document.title = prev;
    };
  }, []);
  return (
    <StoreProvider tab={tab} go={go}>
      <Shell />
    </StoreProvider>
  );
}
