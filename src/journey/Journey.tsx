import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import Lenis from "lenis";
import {
  ArrowDown,
  ArrowRight,
  SquaresFour,
  Stack,
  Brain,
  PuzzlePiece,
  LockSimple,
  ShieldCheck,
  CheckCircle,
} from "@phosphor-icons/react";
import { Logo, Orb } from "../components/ui/Logo";
import { ButtonLink } from "../components/ui/Button";
import { WaitlistForm } from "../components/WaitlistForm";
import { TodayPreview } from "../components/previews/TodayInbox";
import { BillsPreview, TravelPreview } from "../components/previews/Explorer";
import { integrations, type IntegrationStatus } from "../data/integrations";
import { flight, keyframeAt, chapterCount } from "./flight";
import { AskCard, Chips, Preview } from "./parts";

const Scene = lazy(() => import("./Scene"));

const chapters = [
  { id: "launch", label: "Launch" },
  { id: "noise", label: "The noise" },
  { id: "orbit", label: "Meet Orbit" },
  { id: "day", label: "Your day" },
  { id: "money", label: "Your money" },
  { id: "world", label: "Your world" },
  { id: "shield", label: "Your shield" },
  { id: "connected", label: "Connected" },
  { id: "join", label: "Join" },
];

const ease = [0.16, 1, 0.3, 1] as const;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------------------------------ */

type Align = "left" | "right" | "center";

/**
 * One stop on the journey. On desktop the copy sits beside the 3D subject; on phones it sits
 * above or below it (`mobile` says which end of the screen the copy takes).
 */
function Chapter({
  id,
  align,
  mobile,
  tall = false,
  children,
}: {
  id: string;
  align: Align;
  mobile: "top" | "bottom";
  tall?: boolean;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const col =
    align === "left"
      ? "md:col-span-6 lg:col-span-5"
      : align === "right"
        ? "md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8"
        : "md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4 text-center items-center";
  return (
    <section
      id={`j-${id}`}
      data-chapter
      aria-labelledby={`j-${id}-title`}
      className={`relative flex ${tall ? "min-h-[150svh]" : "min-h-[125svh]"} ${
        mobile === "top" ? "items-start pt-24" : "items-end pb-10"
      } md:items-center md:py-24`}
    >
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 px-4 sm:px-6 md:grid-cols-12 md:gap-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.3, margin: "-10% 0px -10% 0px" }}
          transition={{ duration: 1, ease }}
          className={`flex min-w-0 flex-col ${col}`}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function Eyebrow({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em] text-accent-fg">
      <span className="text-accent">{n}</span>
      <span className="h-px w-8 bg-accent/50" />
      {children}
    </p>
  );
}

const shadow = "[text-shadow:0_2px_30px_rgba(11,10,16,0.9)]";

function Title({ id, children, big = false }: { id: string; children: ReactNode; big?: boolean }) {
  return (
    <h2
      id={id}
      className={`mt-5 text-balance font-semibold leading-[1.02] tracking-[-0.045em] text-ink ${shadow} ${
        big ? "text-[44px] sm:text-[60px] lg:text-[76px]" : "text-[36px] sm:text-[46px] lg:text-[54px]"
      }`}
    >
      {children}
    </h2>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <p className={`mt-5 max-w-[44ch] text-pretty text-[16px] leading-relaxed text-[#cfc9da] md:text-[17.5px] ${shadow}`}>{children}</p>;
}

/* ------------------------------------------------------------------------------------------------ */

const statusCls: Record<IntegrationStatus, string> = {
  "In development": "bg-accent-bg text-accent-fg",
  "Coming soon": "bg-[#1f1936] text-info",
  Planned: "bg-soft text-muted",
};

/** Labels the 3D scene pins to the integration nodes. */
function NodeLabels() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] hidden overflow-hidden md:block">
      {integrations.map((it, i) => (
        <div
          key={it.name}
          ref={(el) => void (flight.labels[i] = el)}
          className="absolute left-0 top-0 flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[#100e16]/80 py-1 pl-1 pr-3 text-[12px] text-ink opacity-0 backdrop-blur-md will-change-transform"
        >
          <span className="grid size-6 place-items-center rounded-full bg-soft">
            <it.icon size={13} />
          </span>
          {it.name}
          <span className={`rounded-full px-1.5 py-px text-[10px] ${statusCls[it.status]}`}>{it.status}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */

function Rail({ active, go }: { active: number; go: (i: number) => void }) {
  return (
    <nav aria-label="Journey chapters" className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
      <ol className="flex flex-col gap-1">
        {chapters.map((c, i) => {
          const on = i === active;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={on ? "step" : undefined}
                className="group flex w-full items-center justify-end gap-3 py-1.5"
              >
                <span
                  className={`font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all duration-500 ${
                    on ? "translate-x-0 text-ink opacity-100" : "translate-x-2 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                >
                  {c.label}
                </span>
                <span className={`block h-px transition-all duration-500 ${on ? "w-8 bg-accent" : "w-4 bg-[#4a4458] group-hover:w-6 group-hover:bg-muted"}`} />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function JourneyNav({ onJoin, onTop }: { onJoin: () => void; onTop: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="pointer-events-none absolute inset-0 h-24 bg-gradient-to-b from-paper/80 to-transparent" />
      <nav aria-label="Main" className="relative mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6">
        <button type="button" onClick={onTop} aria-label="Back to the start" className="rounded-md">
          <Logo />
        </button>
        <div className="flex items-center gap-2">
          <a href="#/" className="hidden rounded-full px-3 py-2 text-[14px] text-muted transition-colors hover:text-ink md:inline-flex">
            Classic site
          </a>
          <span className="hidden sm:inline-flex">
            <ButtonLink href="#/app" variant="secondary" size="sm" className="backdrop-blur">
              <SquaresFour size={15} weight="fill" className="text-accent" /> Open app
            </ButtonLink>
          </span>
          <ButtonLink
            href="#j-join"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onJoin();
            }}
          >
            Join the waitlist
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------------------------------------------------ */

export default function Journey() {
  const reduce = !!useReducedMotion();
  const [gl] = useState(hasWebGL);
  const [ready, setReady] = useState(flight.ready);
  const [active, setActive] = useState(0);
  const lenis = useRef<Lenis | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "Orbit - A journey through your life, connected";
    window.scrollTo(0, 0);
    return () => {
      document.title = prev;
    };
  }, []);

  // Scroll: Lenis for smooth, inertial travel (native scroll when motion is reduced).
  useEffect(() => {
    let last = -1;
    const onProgress = (p: number) => {
      flight.progress = p;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      const i = Math.round(keyframeAt(p));
      if (i !== last) {
        last = i;
        setActive(i);
      }
    };
    if (reduce) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        onProgress(max > 0 ? window.scrollY / max : 0);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    const l = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    lenis.current = l;
    l.on("scroll", (e: Lenis) => onProgress(e.limit > 0 ? e.scroll / e.limit : 0));
    let raf = 0;
    const loop = (t: number) => {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
      lenis.current = null;
    };
  }, [reduce]);

  // Measure where each chapter's centre falls in scroll progress; the camera keyframes pin to these.
  useEffect(() => {
    const measure = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      flight.stops = els.map((el, i) => {
        if (i === 0) return 0;
        if (i === els.length - 1) return 1;
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        return Math.min(1, Math.max(0, (top + r.height / 2 - vh / 2) / max));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (main.current) ro.observe(main.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      flight.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      flight.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onReady = () => setReady(true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("orbit:ready", onReady);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("orbit:ready", onReady);
    };
  }, []);

  useEffect(
    () => () => {
      flight.ready = false;
      flight.progress = 0;
      flight.labels = [];
    },
    [],
  );

  const go = useCallback((i: number) => {
    const el = document.getElementById(`j-${chapters[i].id}`);
    if (!el) return;
    const top = i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2 - window.innerHeight / 2;
    if (lenis.current) lenis.current.scrollTo(i === chapters.length - 1 ? "bottom" : top, { duration: 2.4 });
    else window.scrollTo({ top: i === chapters.length - 1 ? document.documentElement.scrollHeight : top });
  }, []);

  return (
    <div className="relative bg-paper text-ink">
      {/* The universe */}
      <div aria-hidden="true" className="fixed inset-0 z-0">
        {gl ? (
          <div className={`absolute inset-0 transition-opacity duration-[1500ms] ${ready ? "opacity-100" : "opacity-0"}`}>
            <Suspense fallback={null}>
              <Scene reduce={reduce} />
            </Suspense>
          </div>
        ) : (
          <div className="glow-top absolute inset-0" />
        )}
        {/* Vignette keeps copy legible at the edges. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(11,10,16,0.75)_100%)]" />
      </div>

      {gl && <NodeLabels />}

      <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-accent via-[#ff8aa8] to-info" />
      </div>

      <JourneyNav onJoin={() => go(chapters.length - 1)} onTop={() => go(0)} />
      <Rail active={active} go={go} />

      <main id="main" ref={main} className="relative z-10">
        {/* 00 Launch */}
        <section
          id="j-launch"
          data-chapter
          aria-labelledby="j-launch-title"
          className="relative flex min-h-[100svh] items-start pt-28 md:items-center md:pt-16"
        >
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 px-4 sm:px-6 md:grid-cols-12">
            <div className="flex min-w-0 flex-col md:col-span-7 lg:col-span-6">
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9, ease }}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#16141d]/60 py-1 pl-1 pr-3.5 text-[13px] text-muted backdrop-blur"
              >
                <span className="rounded-full bg-accent-bg px-2.5 py-0.5 text-[12px] font-medium text-accent-fg">Introducing Orbit</span>
                Your personal AI assistant
              </motion.p>
              <h1 id="j-launch-title" className={`mt-7 text-[46px] font-semibold leading-[0.98] tracking-[-0.05em] sm:text-[64px] lg:text-[84px] ${shadow}`}>
                {["Your life,", "finally in"].map((w, i) => (
                  <motion.span
                    key={w}
                    className="block"
                    initial={reduce ? false : { opacity: 0, y: 30, filter: "blur(12px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, delay: 1.05 + i * 0.12, ease }}
                  >
                    {w}
                  </motion.span>
                ))}
                <motion.span
                  className="block bg-gradient-to-r from-accent via-[#ff8aa8] to-info bg-clip-text text-transparent"
                  initial={reduce ? false : { opacity: 0, y: 30, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 1.2, delay: 1.29, ease }}
                >
                  orbit.
                </motion.span>
              </h1>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.5, ease }}
              >
                <p className={`mt-6 max-w-[36rem] text-pretty text-[17px] leading-relaxed text-[#cfc9da] md:text-[18px] ${shadow}`}>
                  Your emails, calendar, finances, bookings and everyday plans, brought together by one AI assistant that
                  understands what matters to you.
                </p>
                <div className="mt-8 max-w-[30rem]">
                  <WaitlistForm source="journey-hero" size="lg" />
                </div>
              </motion.div>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={() => go(1)}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 1 }}
            className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink md:flex"
          >
            Scroll to begin the journey
            <span className="relative block h-10 w-px overflow-hidden bg-white/10">
              <span className="absolute inset-x-0 top-0 h-4 animate-[scrollcue_1.8s_ease-in-out_infinite] bg-accent" />
            </span>
          </motion.button>
        </section>

        {/* 01 The noise */}
        <Chapter id="noise" align="left" mobile="top">
          <Eyebrow n="01">The noise</Eyebrow>
          <Title id="j-noise-title">Everything matters. Nothing is connected.</Title>
          <Body>
            Your plans, conversations, payments and bookings are spread across different apps. Important details get
            buried, and every morning starts with piecing it all back together.
          </Body>
          <ul className="mt-8 flex flex-col gap-3">
            {[
              { i: Stack, t: "Too many places" },
              { i: Brain, t: "Too much to remember" },
              { i: PuzzlePiece, t: "Too much to manage" },
            ].map(({ i: I, t }) => (
              <li key={t} className={`flex items-center gap-3 text-[15px] text-ink ${shadow}`}>
                <span className="grid size-9 place-items-center rounded-xl border border-white/10 bg-[#16141d]/70 text-accent backdrop-blur">
                  <I size={17} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Chapter>

        {/* 02 Meet Orbit */}
        <Chapter id="orbit" align="left" mobile="top" tall>
          <Eyebrow n="02">Meet Orbit</Eyebrow>
          <Title id="j-orbit-title">
            One assistant pulls it all into <span className="text-accent">orbit.</span>
          </Title>
          <Body>
            Orbit connects the services you already use and turns them into one clear picture, so the things that
            matter come to you. Ask about your life in plain English.
          </Body>
          <AskCard />
        </Chapter>

        {/* 03 Your day */}
        <Chapter id="day" align="right" mobile="bottom" tall>
          <Eyebrow n="03">Your day</Eyebrow>
          <Title id="j-day-title">Know what matters today.</Title>
          <Body>
            Orbit brings together your schedule, important emails, reminders and upcoming commitments to create a
            personalised daily briefing.
          </Body>
          <Chips items={["Daily briefing", "Calendar", "Email", "Tasks", "Life Inbox"]} />
          <Preview>
            <TodayPreview />
          </Preview>
        </Chapter>

        {/* 04 Your money */}
        <Chapter id="money" align="left" mobile="bottom" tall>
          <Eyebrow n="04">Your money</Eyebrow>
          <Title id="j-money-title">Know what's coming out.</Title>
          <Body>
            Keep track of upcoming bills, recurring payments and subscriptions in one clear view, with your
            investments in the bigger picture.
          </Body>
          <Chips items={["Bills", "Subscriptions", "Investments"]} />
          <Preview>
            <BillsPreview />
          </Preview>
        </Chapter>

        {/* 05 Your world */}
        <Chapter id="world" align="right" mobile="bottom" tall>
          <Eyebrow n="05">Your world</Eyebrow>
          <Title id="j-world-title">Every booking, in one place.</Title>
          <Body>
            Find your flights, hotels, restaurants and reservations without searching through old emails, and see your
            routines alongside the rest of your day.
          </Body>
          <Chips items={["Travel", "Bookings", "Fitness"]} />
          <Preview>
            <TravelPreview />
          </Preview>
        </Chapter>

        {/* 06 Your shield */}
        <Chapter id="shield" align="left" mobile="top">
          <Eyebrow n="06">Your shield</Eyebrow>
          <Title id="j-shield-title">Your life is personal. Orbit should respect that.</Title>
          <Body>Orbit is being designed around privacy, transparency and user control.</Body>
          <ul className="mt-8 flex flex-col gap-5">
            {[
              { i: LockSimple, t: "You stay in control", b: "Choose which services to connect and what information Orbit can access." },
              { i: ShieldCheck, t: "Your data stays yours", b: "Clear controls for managing connected accounts and personal information." },
              { i: CheckCircle, t: "Actions require your say-so", b: "Review important actions before Orbit carries them out." },
            ].map(({ i: I, t, b }) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[#16141d]/70 text-accent backdrop-blur">
                  <I size={20} />
                </span>
                <div className={shadow}>
                  <p className="text-[16.5px] font-medium text-ink">{t}</p>
                  <p className="mt-1 max-w-[42ch] text-[14.5px] leading-relaxed text-[#cfc9da]">{b}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className={`mt-6 max-w-[48ch] text-[12.5px] leading-relaxed text-muted ${shadow}`}>
            These are design commitments, not certifications. We'll publish full details on security and data handling
            before early access opens.{" "}
            <a href="#/privacy" className="text-accent-fg underline-offset-4 hover:underline">
              Privacy Policy
            </a>
          </p>
        </Chapter>

        {/* 07 Connected */}
        <Chapter id="connected" align="right" mobile="bottom">
          <Eyebrow n="07">Connected</Eyebrow>
          <Title id="j-connected-title">Your apps. Working together.</Title>
          <Body>Orbit is designed to bring the services you already use into one connected experience.</Body>
          <ul className="mt-7 grid grid-cols-2 gap-2">
            {integrations.map(({ name, icon: I, status }) => (
              <li key={name} className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/10 bg-[#16141d]/70 p-2.5 backdrop-blur">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-soft text-ink">
                  <I size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-ink">{name}</p>
                  <p className={`mt-0.5 w-fit rounded-full px-1.5 text-[10px] ${statusCls[status]}`}>{status}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className={`mt-4 text-[12px] leading-relaxed text-muted ${shadow}`}>
            No integrations are live yet. Product names describe planned connections and do not imply endorsement or
            affiliation.
          </p>
        </Chapter>

        {/* 08 Join */}
        <section
          id="j-join"
          data-chapter
          aria-labelledby="j-join-title"
          className="relative flex min-h-[125svh] flex-col items-center justify-end pb-10 md:min-h-[140svh]"
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ amount: 0.4 }}
            transition={{ duration: 1.1, ease }}
            className="mx-auto flex w-full max-w-[640px] flex-col items-center px-4 pt-[44svh] text-center sm:px-6"
          >
            <Eyebrow n="08">Your turn</Eyebrow>
            <h2 id="j-join-title" className={`mt-5 text-balance text-[42px] font-semibold leading-[1.02] tracking-[-0.045em] md:text-[64px] ${shadow}`}>
              Your life, connected.
              <br />
              <span className="bg-gradient-to-r from-accent via-[#ff8aa8] to-info bg-clip-text text-transparent">Get there first.</span>
            </h2>
            <p className={`mt-5 max-w-[46ch] text-[16px] leading-relaxed text-[#cfc9da] md:text-[17px] ${shadow}`}>
              Join the Orbit waitlist and be among the first to experience a more connected way to manage your life.
            </p>
            <div className="mt-8 w-full max-w-[30rem] text-left">
              <WaitlistForm source="journey-final" size="lg" />
            </div>
            <a
              href="#/app"
              className="mt-2 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink transition-colors hover:text-accent-fg"
            >
              Or explore the live demo <ArrowRight size={14} />
            </a>
          </motion.div>
          <footer className="mx-auto mt-24 flex w-full max-w-[1240px] flex-col items-center justify-between gap-4 border-t border-white/[0.06] px-4 pt-6 text-[12.5px] text-muted sm:flex-row sm:px-6">
            <span className="flex items-center gap-2">
              <Orb className="size-3.5" /> © {new Date().getFullYear()} Orbit
            </span>
            <span className="flex gap-5">
              <a href="#/privacy" className="hover:text-ink">Privacy</a>
              <a href="#/terms" className="hover:text-ink">Terms</a>
              <a href="#/" className="hover:text-ink">Classic site</a>
            </span>
          </footer>
        </section>
      </main>

      {!reduce && (
        <button
          type="button"
          onClick={() => go(Math.min(chapterCount - 1, active + 1))}
          aria-label="Next chapter"
          className={`fixed bottom-5 right-5 z-30 grid size-11 place-items-center rounded-full border border-white/10 bg-[#16141d]/70 text-ink backdrop-blur transition-opacity duration-500 hover:border-accent/50 lg:hidden ${
            active > 0 && active < chapterCount - 1 ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
}
