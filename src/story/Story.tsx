import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import Lenis from "lenis";
import { SpeakerSimpleHigh, SpeakerSimpleSlash } from "@phosphor-icons/react";
import { Logo, Orb } from "../components/ui/Logo";
import { WaitlistForm } from "../components/WaitlistForm";
import { story } from "./state";
import { networkNames } from "./apps";
import { sfx } from "./sound";
import { OrbitAppIcon } from "../components/ui/OrbitAppIcon";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useMode } from "../lib/theme";
import { Label } from "../orbit/ui";
import { AskPreview, DayPreview, MoneyPreview, PlansPreview } from "./previews";

const StoryScene = lazy(() => import("./StoryScene"));

/** Sound is off until the visitor asks for it (browsers block audio before a click anyway). */
function useSound() {
  const [on, setOn] = useState(sfx.on);
  useEffect(() => sfx.subscribe(setOn), []);
  return [on, () => void sfx.set(!sfx.on)] as const;
}

function SoundToggle() {
  const [on, toggle] = useSound();
  const I = on ? SpeakerSimpleHigh : SpeakerSimpleSlash;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on ? "Turn sound off" : "Turn sound on"}
      className={`inline-grid size-10 shrink-0 place-items-center rounded-[7px] border border-line transition-colors hover:bg-soft hover:text-ink ${on ? "text-ink" : "text-muted"}`}
    >
      <I size={18} weight={on ? "fill" : "regular"} />
    </button>
  );
}

const ease = [0.16, 1, 0.3, 1] as const;
/** Keeps copy readable over the scene: a soft halo in the backdrop colour, nothing coloured. */
const shadow = "[text-shadow:0_0_24px_var(--story-bg)]";

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
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.35, margin: "-6% 0px -6% 0px" }}
          transition={{ duration: 0.9, ease }}
          className={`flex min-w-0 max-w-[34rem] flex-col ${place === "top" || place === "bottom" ? "md:max-w-[46rem] md:items-center" : ""} ${
            flow ? "max-md:-mx-2 max-md:rounded-[10px] max-md:border max-md:border-line max-md:bg-paper/95 max-md:p-4" : ""
          }`}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return <Label className={shadow}>{children}</Label>;
}

function Line({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={`mt-3 text-balance font-serif text-[38px] font-normal leading-[1.05] tracking-[-0.02em] text-ink sm:text-[48px] lg:text-[60px] ${shadow} ${className}`}>
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
          className="absolute left-0 top-0 whitespace-nowrap rounded-[4px] border border-line bg-paper/90 px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink opacity-0 will-change-transform"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export default function Story() {
  const reduce = !!useReducedMotion();
  const mode = useMode();
  const [gl] = useState(hasWebGL);
  const [ready, setReady] = useState(story.ready);
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
    const onProgress = (p: number) => {
      story.progress = p;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
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
    l.on("scroll", (e: Lenis) => onProgress(e.limit > 0 ? e.scroll / e.limit : 0));
    let raf = requestAnimationFrame(function loop(t) {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
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

  return (
    <div className="relative bg-story-bg text-ink">
      <div aria-hidden="true" className="fixed inset-0 z-0">
        {gl && (
          <div className={`absolute inset-0 transition-opacity duration-[1600ms] ${ready ? "opacity-100" : "opacity-0"}`}>
            <Suspense fallback={null}>
              <StoryScene reduce={reduce} mode={mode} />
            </Suspense>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,color-mix(in_srgb,var(--story-bg)_80%,transparent)_100%)]" />
        {/* A brief wash while the camera crosses the glass. The scene sets its opacity. */}
        <div
          id="story-flash"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--paper),color-mix(in_srgb,var(--green)_40%,var(--paper))_45%,var(--green)_80%)] opacity-0 mix-blend-screen"
        />
      </div>

      {gl && <NodeLabels />}

      <div className="fixed inset-x-0 top-0 z-50 h-[2px]">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
      </div>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-paper/90">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle className="border border-line" />
            <SoundToggle />
          </div>
        </div>
      </header>

      <main id="main" ref={main} className="relative z-10">
        {/* Prologue */}
        <section id="s-open" data-act aria-labelledby="s-open-title" className="relative flex min-h-[100svh] items-start pt-28 md:items-center md:pt-0">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
            <div className="max-w-[36rem]">
              <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.2 }}>
                <Label className={shadow}>Orbit</Label>
              </motion.div>
              <h1 id="s-open-title" className={`mt-5 font-serif text-[48px] font-normal leading-[1.02] tracking-[-0.02em] sm:text-[64px] lg:text-[84px] ${shadow}`}>
                {["One phone.", "Too many", "moving parts."].map((w, i) => (
                  <motion.span
                    key={w}
                    className="block"
                    initial={reduce ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.1, delay: 1.35 + i * 0.14, ease }}
                  >
                    {w}
                  </motion.span>
                ))}
              </h1>
              <motion.div
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2.2 }}
                className="mt-8"
              >
                <Label className={shadow}>Scroll</Label>
              </motion.div>
            </div>
          </div>
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
            Meet <span className="text-accent">Orbit.</span>
          </Line>
        </Act>

        <Act id="return" place="bottom" mobile="bottom" height="min-h-[170svh]">
          <Line id="s-return-title">Same phone. Calmer life.</Line>
        </Act>

        <Act id="ask" place="right" mobile="bottom" height="min-h-[160svh]" flow>
          <Kicker>01 · Ask</Kicker>
          <Line id="s-ask-title">Just ask.</Line>
          <AskPreview />
        </Act>

        <Act id="day" place="left" mobile="bottom" height="min-h-[170svh]" flow>
          <Kicker>02 · Your day</Kicker>
          <Line id="s-day-title">Today, sorted.</Line>
          <DayPreview />
        </Act>

        <Act id="money" place="right" mobile="bottom" height="min-h-[170svh]" flow>
          <Kicker>03 · Your money</Kicker>
          <Line id="s-money-title">Bills, before they’re due.</Line>
          <MoneyPreview />
        </Act>

        <Act id="world" place="left" mobile="bottom" height="min-h-[170svh]" flow>
          <Kicker>04 · Your plans</Kicker>
          <Line id="s-world-title">Every booking, one place.</Line>
          <PlansPreview />
        </Act>

        {/* Join: the call to action beneath the phone and its hologram */}
        <section id="s-join" data-act aria-labelledby="s-join-title" className="relative flex min-h-[170svh] flex-col items-center justify-end pb-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.5 }}
            transition={{ duration: 0.9, ease }}
            className="mx-auto flex w-full max-w-[30rem] flex-col items-start px-4 sm:px-6"
          >
            <OrbitAppIcon className="size-12" />
            <h2 id="s-join-title" className={`mt-5 text-balance font-serif text-[36px] font-normal leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px] ${shadow}`}>
              Join the waitlist.
            </h2>
            <div className="mt-6 w-full">
              <WaitlistForm source="story-final" />
            </div>
          </motion.div>
          <p className="mx-auto mt-14 max-w-[70ch] px-4 text-center text-[11.5px] leading-relaxed text-muted">
            App names and logos shown in this story are trademarks of their respective owners and appear for illustration
            only. Orbit is not affiliated with, endorsed by or connected to any of them.
          </p>
          <footer className="mx-auto mt-6 flex w-full max-w-[1240px] flex-col items-start justify-between gap-3 border-t border-line px-4 pt-6 text-[12.5px] text-muted sm:flex-row sm:items-center sm:px-6">
            <span className="flex items-center gap-2">
              <Orb className="size-3.5" /> © {new Date().getFullYear()} Orbit · Scenes use illustrative demo data
            </span>
            <span className="flex gap-5">
              <a href="#/privacy" className="hover:text-ink">Privacy</a>
              <a href="#/terms" className="hover:text-ink">Terms</a>
            </span>
          </footer>
        </section>
      </main>
    </div>
  );
}
