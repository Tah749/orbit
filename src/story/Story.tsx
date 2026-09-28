import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import Lenis from "lenis";
import { ArrowRight, HandGrabbing, SquaresFour, SpeakerSimpleHigh, SpeakerSimpleSlash } from "@phosphor-icons/react";
import { Logo, Orb } from "../components/ui/Logo";
import { ButtonLink } from "../components/ui/Button";
import { WaitlistForm } from "../components/WaitlistForm";
import { story, actAt, actCount } from "./state";
import { networkNames } from "./apps";
import { sfx } from "./sound";
import { OrbitAppIcon } from "../components/ui/OrbitAppIcon";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useMode } from "../lib/theme";
import { AskCard, Preview } from "../journey/parts";
import { TodayPreview } from "../components/previews/TodayInbox";
import { BillsPreview, TravelPreview } from "../components/previews/Explorer";

const StoryScene = lazy(() => import("./StoryScene"));

const acts = [
  { id: "open", label: "Start" },
  { id: "phone", label: "Phone" },
  { id: "problem", label: "Problem" },
  { id: "connection", label: "Connect" },
  { id: "product", label: "Orbit" },
  { id: "return", label: "Return" },
  { id: "ask", label: "Ask" },
  { id: "day", label: "Day" },
  { id: "money", label: "Money" },
  { id: "world", label: "Plans" },
  { id: "join", label: "Join" },
];

/** Sound is off until the visitor asks for it (browsers block audio before a click anyway). */
function useSound() {
  const [on, setOn] = useState(sfx.on);
  useEffect(() => sfx.subscribe(setOn), []);
  return [on, () => void sfx.set(!sfx.on)] as const;
}

function SoundHint() {
  const [on, toggle] = useSound();
  const reduce = useReducedMotion();
  if (on) return null;
  return (
    <motion.button
      type="button"
      onClick={toggle}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.3, duration: 1 }}
      className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
    >
      <SpeakerSimpleHigh size={14} weight="fill" className="text-accent" /> Best with sound on
    </motion.button>
  );
}

function SoundToggle({ compact = false }: { compact?: boolean }) {
  const [on, toggle] = useSound();
  const I = on ? SpeakerSimpleHigh : SpeakerSimpleSlash;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] backdrop-blur transition-colors ${
        on ? "border-accent/50 bg-accent-bg/80 text-ink" : "border-line bg-story-chip text-muted hover:text-ink"
      }`}
    >
      <I size={15} weight="fill" className={on ? "text-accent" : ""} />
      {!compact && <span className="hidden sm:inline">{on ? "Sound on" : "Sound off"}</span>}
    </button>
  );
}

const ease = [0.16, 1, 0.3, 1] as const;
const shadow = "[text-shadow:0_2px_30px_var(--story-bg)]";

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function Act({
  id,
  place,
  mobile,
  height,
  flow = false,
  children,
}: {
  id: string;
  place: "left" | "right" | "top" | "bottom";
  mobile: "top" | "bottom";
  height: string;
  /** Tall content: on phones it scrolls normally instead of pinning to one screen. */
  flow?: boolean;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const desk =
    place === "left"
      ? "md:items-center md:justify-start"
      : place === "right"
        ? "md:items-center md:justify-end"
        : place === "top"
          ? "md:items-start md:justify-center md:pt-28 md:text-center"
          : "md:items-end md:justify-center md:pb-16 md:text-center";
  return (
    <section
      id={`s-${id}`}
      data-act
      aria-labelledby={`s-${id}-title`}
      className={`relative ${height}`}
    >
      {/* The copy holds on screen while its scene plays out behind it. */}
      <div
        className={`mx-auto flex w-full max-w-[1240px] px-4 sm:px-6 ${
          flow ? "relative pb-16 pt-[42svh] md:sticky md:top-0 md:h-[100svh] md:pt-0 md:pb-0" : `sticky top-0 h-[100svh] ${mobile === "top" ? "items-start pt-24" : "items-end pb-14"}`
        } ${desk} ${
          place === "right" ? "md:justify-end" : place === "left" ? "" : "md:justify-center"
        }`}
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 36, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.35, margin: "-6% 0px -6% 0px" }}
          transition={{ duration: 1.1, ease }}
          className={`flex min-w-0 max-w-[34rem] flex-col ${place === "top" || place === "bottom" ? "md:max-w-[46rem] md:items-center" : ""} ${
            flow ? "max-md:-mx-2 max-md:rounded-[28px] max-md:bg-story-scrim max-md:p-4 max-md:backdrop-blur-md" : ""
          }`}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[11.5px] uppercase tracking-[0.22em] text-story-kicker">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-story-kicker" />
      {children}
    </p>
  );
}

function Line({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={`mt-3 text-balance text-[38px] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-[50px] lg:text-[62px] ${shadow} ${className}`}>
      {children}
    </h2>
  );
}

/** App names the scene pins beside the network nodes. */
function NodeLabels() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] hidden overflow-hidden md:block">
      {networkNames.map((name, i) => (
        <span
          key={name}
          ref={(el) => void (story.labels[i] = el)}
          className="absolute left-0 top-0 whitespace-nowrap rounded-full border border-accent/25 bg-story-chip px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink opacity-0 backdrop-blur will-change-transform"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

function Rail({ active, go }: { active: number; go: (i: number) => void }) {
  return (
    <nav aria-label="Story acts" className="fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
      <ol className="flex flex-col gap-1">
        {acts.map((a, i) => {
          const on = i === active;
          return (
            <li key={a.id}>
              <button type="button" onClick={() => go(i)} aria-current={on ? "step" : undefined} className="group flex items-center gap-3 py-1.5">
                <span className={`block h-px transition-all duration-500 ${on ? "w-8 bg-accent" : "w-4 bg-line-strong group-hover:w-6 group-hover:bg-muted"}`} />
                <span
                  className={`font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all duration-500 ${
                    on ? "text-ink opacity-100" : "-translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                >
                  {a.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function Story() {
  const reduce = !!useReducedMotion();
  const mode = useMode();
  const [gl] = useState(hasWebGL);
  const [ready, setReady] = useState(story.ready);
  const [active, setActive] = useState(0);
  const lenis = useRef<Lenis | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "Orbit - One phone. Too many moving parts.";
    window.scrollTo(0, 0);
    return () => {
      document.title = prev;
      story.ready = false;
      story.progress = 0;
      story.labels = [];
    };
  }, []);

  useEffect(() => {
    let last = -1;
    const onProgress = (p: number) => {
      story.progress = p;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      const i = Math.round(actAt(p));
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
    const l = new Lenis({ lerp: 0.07, wheelMultiplier: 0.85, touchMultiplier: 1.4 });
    lenis.current = l;
    l.on("scroll", (e: Lenis) => onProgress(e.limit > 0 ? e.scroll / e.limit : 0));
    let raf = requestAnimationFrame(function loop(t) {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
      lenis.current = null;
    };
  }, [reduce]);

  useEffect(() => {
    const measure = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-act]"));
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      story.stops = els.map((el, i) => {
        if (i === 0) return 0;
        if (i === els.length - 1) return 1;
        const r = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (r.top + window.scrollY + r.height / 2 - vh / 2) / max));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (main.current) ro.observe(main.current);
    window.addEventListener("resize", measure);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      story.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      story.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onReady = () => setReady(true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("story:ready", onReady);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("story:ready", onReady);
    };
  }, []);

  const go = useCallback((i: number) => {
    const el = document.getElementById(`s-${acts[i].id}`);
    if (!el) return;
    const last = i === acts.length - 1;
    const top = i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2 - window.innerHeight / 2;
    if (lenis.current) lenis.current.scrollTo(last ? "bottom" : top, { duration: last ? 4 : 2.4 });
    else window.scrollTo({ top: last ? document.documentElement.scrollHeight : top });
  }, []);

  return (
    <div className="relative bg-story-bg text-ink">
      <div aria-hidden="true" className="fixed inset-0 z-0">
        {gl ? (
          <div className={`absolute inset-0 transition-opacity duration-[1600ms] ${ready ? "opacity-100" : "opacity-0"}`}>
            <Suspense fallback={null}>
              <StoryScene reduce={reduce} mode={mode} />
            </Suspense>
          </div>
        ) : (
          <div className="glow-top absolute inset-0" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,color-mix(in_srgb,var(--story-bg)_80%,transparent)_100%)]" />
        {/* Scanlines and a crossing flash, for the screen dives */}
        <div className="holo-scan pointer-events-none absolute inset-0 opacity-[0.07]" />
        <div id="story-flash" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#ffffff,#A8E3DA_40%,#0C6B66_75%)] opacity-0 mix-blend-screen" />
      </div>

      {gl && <NodeLabels />}

      {/* Shown by the scene while the slot machine is waiting to be played. */}
      <div id="lever-hint" className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center opacity-0 transition-opacity duration-500">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("story:pull"))}
          className="group inline-flex items-center gap-3 rounded-full border border-story-gold/40 bg-story-gold-bg py-2 pl-2 pr-5 text-[14px] text-ink shadow-[0_0_40px_-8px_color-mix(in_srgb,var(--story-gold)_50%,transparent)] backdrop-blur-md transition-colors hover:border-[#FFD27A]/80"
        >
          <span className="grid size-9 place-items-center rounded-full bg-accent text-paper transition-transform group-hover:translate-y-0.5">
            <HandGrabbing size={18} weight="fill" />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="font-medium">Pull the lever</span>
            <span className="text-[11.5px] text-muted">or keep scrolling</span>
          </span>
        </button>
      </div>

      <div className="fixed inset-x-0 top-0 z-50 h-[2px]">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-accent to-info" />
      </div>

      <header className="fixed inset-x-0 top-0 z-40">
        <div className="pointer-events-none absolute inset-0 h-24 bg-gradient-to-b from-story-bg/85 to-transparent" />
        <nav aria-label="Main" className="relative mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={() => go(0)} aria-label="Back to the start" className="rounded-md">
            <Logo />
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle className="bg-story-chip backdrop-blur" />
            <SoundToggle />
            <a href="#/" className="hidden rounded-full px-3 py-2 text-[14px] text-muted transition-colors hover:text-ink lg:inline-flex">
              Classic site
            </a>
            <span className="hidden sm:inline-flex">
              <ButtonLink href="#/app" variant="secondary" size="sm" className="backdrop-blur">
                <SquaresFour size={15} weight="fill" className="text-accent" /> Open app
              </ButtonLink>
            </span>
            <ButtonLink
              href="#s-join"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                go(acts.length - 1);
              }}
            >
              Join the waitlist
            </ButtonLink>
          </div>
        </nav>
      </header>

      <Rail active={active} go={go} />

      <main id="main" ref={main} className="relative z-10">
        {/* Prologue */}
        <section id="s-open" data-act aria-labelledby="s-open-title" className="relative flex min-h-[100svh] items-start pt-28 md:items-center md:pt-0">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
            <div className="max-w-[36rem]">
              <motion.p
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="flex items-center gap-3 font-mono text-[11.5px] uppercase tracking-[0.22em] text-story-kicker"
              >
                <Orb className="size-3.5" /> Orbit presents
              </motion.p>
              <h1 id="s-open-title" className={`mt-6 text-[48px] font-semibold leading-[0.98] tracking-[-0.05em] sm:text-[66px] lg:text-[86px] ${shadow}`}>
                {["One phone.", "Too many", "moving parts."].map((w, i) => (
                  <motion.span
                    key={w}
                    className={`block ${i === 2 ? "bg-gradient-to-r from-accent to-info bg-clip-text text-transparent" : ""}`}
                    initial={reduce ? false : { opacity: 0, y: 28, filter: "blur(14px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.3, delay: 1.35 + i * 0.14, ease }}
                  >
                    {w}
                  </motion.span>
                ))}
              </h1>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.9, ease }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <ButtonLink href="#s-phone" size="lg" onClick={(e) => (e.preventDefault(), go(1))}>
                  Start the story
                </ButtonLink>
                <ButtonLink href="#s-join" variant="secondary" size="lg" className="backdrop-blur" onClick={(e) => (e.preventDefault(), go(acts.length - 1))}>
                  Skip to the waitlist
                </ButtonLink>
              </motion.div>
              <SoundHint />
            </div>
          </div>
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.6, duration: 1 }}
            className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted md:flex"
          >
            <span className="sr-only">Scroll</span>
            <span className="relative block h-10 w-px overflow-hidden bg-line">
              <span className="absolute inset-x-0 top-0 h-4 animate-[scrollcue_1.8s_ease-in-out_infinite] bg-accent" />
            </span>
          </motion.div>
        </section>

        {/* The scene tells the story; each act gets one line. */}
        <Act id="phone" place="left" mobile="top" height="min-h-[170svh]">
          <Line id="s-phone-title">Your whole life. One phone.</Line>
        </Act>

        <Act id="problem" place="left" mobile="top" height="min-h-[210svh]">
          <Line id="s-problem-title">Every day, a gamble.</Line>
        </Act>

        <Act id="connection" place="right" mobile="bottom" height="min-h-[190svh]">
          <Line id="s-connection-title">What if it all connected?</Line>
        </Act>

        <Act id="product" place="top" mobile="top" height="min-h-[200svh]">
          <Line id="s-product-title">
            Meet <span className="text-story-kicker">Orbit.</span>
          </Line>
        </Act>

        <Act id="return" place="bottom" mobile="bottom" height="min-h-[170svh]">
          <Line id="s-return-title">Same phone. Calmer life.</Line>
        </Act>

        <Act id="ask" place="right" mobile="bottom" height="min-h-[160svh]" flow>
          <Kicker>01 · Ask</Kicker>
          <Line id="s-ask-title">Just ask.</Line>
          <AskCard tone="oat" />
        </Act>

        <Act id="day" place="left" mobile="bottom" height="min-h-[170svh]" flow>
          <Kicker>02 · Your day</Kicker>
          <Line id="s-day-title">Today, sorted.</Line>
          <Preview tone="oat">
            <TodayPreview />
          </Preview>
        </Act>

        <Act id="money" place="right" mobile="bottom" height="min-h-[170svh]" flow>
          <Kicker>03 · Your money</Kicker>
          <Line id="s-money-title">Bills, before they’re due.</Line>
          <Preview tone="oat">
            <BillsPreview />
          </Preview>
        </Act>

        <Act id="world" place="left" mobile="bottom" height="min-h-[170svh]" flow>
          <Kicker>04 · Your plans</Kicker>
          <Line id="s-world-title">Every booking, one place.</Line>
          <Preview tone="oat">
            <TravelPreview />
          </Preview>
        </Act>

        {/* Join: the call to action beneath the phone and its hologram */}
        <section id="s-join" data-act aria-labelledby="s-join-title" className="relative flex min-h-[170svh] flex-col items-center justify-end pb-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.5 }}
            transition={{ duration: 1.2, ease }}
            className="mx-auto flex w-full max-w-[600px] flex-col items-center px-4 text-center sm:px-6"
          >
            <div className="flex items-center gap-4" aria-hidden="true">
              <div className="relative">
                <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--green)_40%,transparent),color-mix(in_srgb,var(--blue)_18%,transparent),transparent)] blur-xl" />
                <OrbitAppIcon className="size-14 drop-shadow-[0_10px_30px_var(--shade)] sm:size-16" />
              </div>
              <p className="holo-text text-[56px] font-semibold leading-none tracking-[-0.05em] sm:text-[72px]">Orbit</p>
            </div>
            <h2 id="s-join-title" className={`mt-4 text-balance text-[24px] font-medium tracking-[-0.02em] text-ink sm:text-[30px] ${shadow}`}>
              Join the waitlist.
            </h2>
            <div className="mt-7 w-full max-w-[30rem] text-left">
              <WaitlistForm source="story-final" size="lg" />
            </div>
            <a href="#/app" className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink transition-colors hover:text-accent-fg">
              Or explore the live demo <ArrowRight size={14} />
            </a>
          </motion.div>
          <p className="mx-auto mt-14 max-w-[70ch] px-4 text-center text-[11.5px] leading-relaxed text-muted/80">
            App names and logos shown in this story are trademarks of their respective owners and appear for illustration
            only. Orbit is not affiliated with, endorsed by or connected to any of them.
          </p>
          <footer className="mx-auto mt-6 flex w-full max-w-[1240px] flex-col items-center justify-between gap-4 border-t border-line/70 px-4 pt-6 text-[12.5px] text-muted sm:flex-row sm:px-6">
            <span className="flex items-center gap-2">
              <Orb className="size-3.5" /> © {new Date().getFullYear()} Orbit · Scenes use illustrative demo data
            </span>
            <span className="flex gap-5">
              <a href="#/privacy" className="hover:text-ink">Privacy</a>
              <a href="#/terms" className="hover:text-ink">Terms</a>
              <a href="#/journey" className="hover:text-ink">3D journey</a>
              <a href="#/" className="hover:text-ink">Classic site</a>
            </span>
          </footer>
        </section>
      </main>

      {!reduce && (
        <button
          type="button"
          onClick={() => go(Math.min(actCount - 1, active + 1))}
          aria-label="Next act"
          className={`fixed bottom-5 right-5 z-30 grid size-11 place-items-center rounded-full border border-line bg-story-chip text-ink backdrop-blur transition-opacity duration-500 hover:border-accent/50 ${
            active < actCount - 1 ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ArrowRight size={16} className="rotate-90" />
        </button>
      )}
    </div>
  );
}
