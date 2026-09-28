import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkle } from "@phosphor-icons/react";
import { Orb } from "../components/ui/Logo";

/* Glass panels and product previews shared by the 3D journey and the phone story. */

const ease = [0.16, 1, 0.3, 1] as const;

const glowFor = {
  violet: "border-white/[0.07] shadow-[0_40px_120px_-40px_rgba(124,77,255,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] bg-[#100e16]/55",
  /** The story, in the site theme. */
  oat: "border-line/80 shadow-[0_40px_100px_-40px_var(--shade),inset_0_1px_0_color-mix(in_srgb,var(--ink)_5%,transparent)] bg-story-chip",
};
type Tone = keyof typeof glowFor;

export function Glass({ children, className = "", tone = "violet" }: { children: ReactNode; className?: string; tone?: Tone }) {
  return (
    <div
      className={`rounded-[26px] border p-2 backdrop-blur-xl ${glowFor[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

/** A product preview, cropped with a fade so every chapter fits one screen. */
export function Preview({ children, tone }: { children: ReactNode; tone?: Tone }) {
  return (
    <Glass className="mt-7 max-w-[34rem]" tone={tone}>
      <div className="max-h-[max(300px,min(440px,46svh))] overflow-hidden rounded-[20px] [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
        {children}
      </div>
    </Glass>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {items.map((t) => (
        <li key={t} className="rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[12.5px] text-ink backdrop-blur">
          {t}
        </li>
      ))}
    </ul>
  );
}

export function AskCard({ tone }: { tone?: Tone }) {
  const reduce = useReducedMotion();
  const lines = [
    { t: "Council tax is due in 3 days", k: "Bills" },
    { t: "Your dentist moved to 3:30pm on Thursday", k: "Calendar" },
    { t: "Sam is waiting on a reply about Friday", k: "Messages" },
  ];
  return (
    <Glass className="mt-8 max-w-[30rem]" tone={tone}>
      <div className="rounded-[20px] border border-line/80 bg-deep/80 p-4" aria-label="Example question and answer with demo data" role="img">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[12px] text-muted">
            <Orb className="size-3.5" /> Ask Orbit
          </span>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">Demo data</span>
        </div>
        <p className="mt-3 rounded-2xl rounded-br-md bg-soft px-3.5 py-2.5 text-[14px] text-ink">What do I need to sort before Friday?</p>
        <ul className="mt-3 flex flex-col gap-2">
          {lines.map((l, i) => (
            <motion.li
              key={l.t}
              initial={reduce ? false : { opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.8 }}
              transition={{ delay: 0.5 + i * 0.35, duration: 0.6, ease }}
              className="flex items-center gap-2.5 text-[13.5px] text-ink"
            >
              <Sparkle size={14} weight="fill" className="shrink-0 text-accent" />
              <span className="min-w-0 flex-1">{l.t}</span>
              <span className="shrink-0 rounded-md bg-accent-bg px-1.5 py-0.5 text-[10.5px] text-accent-fg">{l.k}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </Glass>
  );
}

