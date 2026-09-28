import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import { WaitlistForm } from "./WaitlistForm";
import { HeroDashboard } from "./previews/HeroDashboard";
import { HeroMobile } from "./previews/HeroMobile";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const shot = useRef<HTMLDivElement>(null);
  // The product window settles from a slight tilt as it scrolls into full view.
  const { scrollYProgress } = useScroll({ target: shot, offset: ["start end", "start 0.25"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 10, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.94, 1]);

  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease } };

  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-28 md:pt-32">
      <div aria-hidden="true" className="glow-top pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" />
      <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 text-center sm:px-6">
        <motion.a
          href="#features"
          {...rise(0)}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pl-1 pr-3.5 text-[13px] text-muted transition-colors hover:border-[#433d52] hover:text-ink"
        >
          <span className="rounded-full bg-accent-bg px-2.5 py-0.5 text-[12px] font-medium text-accent-fg">Introducing Orbit</span>
          Your personal AI assistant
        </motion.a>

        <motion.h1
          id="hero-title"
          {...rise(0.08)}
          className="mt-7 text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-[60px] lg:text-[76px]"
        >
          Your life,
          <br />
          finally <span className="text-accent">connected.</span>
        </motion.h1>

        <motion.p {...rise(0.16)} className="mt-6 max-w-[38rem] text-pretty text-[17px] leading-relaxed text-muted md:text-[18px]">
          Your emails, calendar, finances, bookings and everyday plans, brought together by one AI assistant that
          understands what matters to you.
        </motion.p>

        <motion.div {...rise(0.24)} className="mt-9 flex w-full max-w-[30rem] flex-col items-center gap-1">
          <WaitlistForm source="hero" size="lg" />
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <p className="text-[13px] text-muted">One assistant. Your whole life. Always in your control.</p>
            <a href="#product" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink transition-colors hover:text-accent-fg">
              Explore Orbit <ArrowDown size={13} />
            </a>
          </div>
        </motion.div>
      </div>

      <div id="product" ref={shot} className="relative mx-auto mt-16 max-w-[1240px] px-4 pb-8 sm:px-6 md:mt-20 [perspective:1600px]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[10%] top-[8%] -z-10 h-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(124,77,255,0.22),rgba(232,51,107,0.08),transparent)] blur-2xl" />
        <motion.div
          style={{ rotateX, scale, transformOrigin: "50% 0%" }}
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease }}
          className="hidden md:block"
        >
          <HeroDashboard />
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className="md:hidden"
        >
          <HeroMobile />
        </motion.div>
        {/* Fade the bottom of the window into the page. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-paper to-transparent" />
        <div className="relative -mt-16 flex justify-center">
          <a
            href="#/app"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-5 py-2.5 text-[14px] font-medium text-ink backdrop-blur transition-colors hover:border-accent/50 hover:text-accent-fg"
          >
            Try the live demo <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
