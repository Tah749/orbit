import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import { CalendarBlank, EnvelopeSimple, Receipt, ChartLineUp, AirplaneTilt, Heartbeat, CheckSquare } from "@phosphor-icons/react";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/Section";
import { TodayPreview, InboxPreview } from "./previews/TodayInbox";
import {
  CalendarPreview,
  EmailPreview,
  BillsPreview,
  InvestmentsPreview,
  TravelPreview,
  FitnessPreview,
  TasksPreview,
} from "./previews/Explorer";

function FeatureRow({
  kicker,
  title,
  body,
  children,
  flip = false,
}: {
  kicker: string;
  title: string;
  body: string;
  children: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-12">
      <Reveal className={`flex flex-col gap-4 md:col-span-5 ${flip ? "md:order-2 md:col-start-8" : ""}`}>
        <p className="text-[14px] font-medium text-accent">{kicker}</p>
        <h3 className="text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-ink md:text-[38px]">{title}</h3>
        <p className="max-w-[42ch] text-[16px] leading-relaxed text-muted">{body}</p>
      </Reveal>
      <Reveal delay={0.1} className={`md:col-span-7 ${flip ? "md:order-1 md:col-start-1" : ""}`}>
        {children}
      </Reveal>
    </div>
  );
}

type Tab = { key: string; icon: Icon; label: string; title: string; body: string; preview: ReactNode };

const tabs: Tab[] = [
  {
    key: "calendar",
    icon: CalendarBlank,
    label: "Calendar",
    title: "More than a calendar.",
    body: "See your schedule alongside the emails, bookings and tasks that give each event context. Changes to your calendar always wait for your approval.",
    preview: <CalendarPreview />,
  },
  {
    key: "email",
    icon: EnvelopeSimple,
    label: "Email",
    title: "Your inbox, understood.",
    body: "Orbit helps you find important messages, understand what needs a reply and extract useful details from your emails.",
    preview: <EmailPreview />,
  },
  {
    key: "bills",
    icon: Receipt,
    label: "Bills",
    title: "Know what's coming out.",
    body: "Keep track of upcoming bills, recurring payments and subscriptions in one clear view.",
    preview: <BillsPreview />,
  },
  {
    key: "investments",
    icon: ChartLineUp,
    label: "Investments",
    title: "Your portfolio, in context.",
    body: "Bring your investments into the bigger picture, alongside the rest of your financial life.",
    preview: <InvestmentsPreview />,
  },
  {
    key: "travel",
    icon: AirplaneTilt,
    label: "Travel",
    title: "Every booking, in one place.",
    body: "Find your flights, hotels, restaurants and reservations without searching through old emails.",
    preview: <TravelPreview />,
  },
  {
    key: "fitness",
    icon: Heartbeat,
    label: "Fitness",
    title: "Your routines, connected.",
    body: "See your activity, workouts and personal routines alongside the rest of your day.",
    preview: <FitnessPreview />,
  },
  {
    key: "tasks",
    icon: CheckSquare,
    label: "Tasks",
    title: "Remember less. Do more.",
    body: "Keep track of tasks, deadlines and personal commitments, with Orbit helping you stay on top of them.",
    preview: <TasksPreview />,
  },
];

function Explorer() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = tabs[active];

  function onKey(e: KeyboardEvent) {
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    let next: number | undefined;
    if (dir) next = (active + dir + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
        <div
          role="tablist"
          aria-label="Orbit features"
          aria-orientation="vertical"
          onKeyDown={onKey}
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0"
        >
          {tabs.map((t, i) => {
            const on = i === active;
            const I = t.icon;
            return (
              <button
                key={t.key}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={on}
                aria-controls={`panel-${t.key}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                className={`group relative flex shrink-0 items-center gap-3 rounded-full border px-4 py-2 text-left transition-colors lg:rounded-2xl lg:border-transparent lg:px-4 lg:py-3.5 ${
                  on ? "border-accent/50 bg-accent-bg lg:bg-surface lg:border-line" : "border-line text-muted hover:text-ink lg:hover:bg-surface/50"
                }`}
              >
                <I size={18} className={on ? "text-accent" : "text-muted group-hover:text-ink"} weight={on ? "fill" : "regular"} />
                <span className="flex flex-col">
                  <span className={`text-[14px] font-medium ${on ? "text-ink" : ""}`}>{t.label}</span>
                  <span className={`hidden text-[13px] ${on ? "text-muted lg:block" : ""}`}>{t.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab.key}
            role="tabpanel"
            id={`panel-${tab.key}`}
            aria-labelledby={`tab-${tab.key}`}
            initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-[26px] font-semibold tracking-[-0.03em] text-ink md:text-[30px]">{tab.title}</h3>
              <p className="max-w-[58ch] text-[15.5px] leading-relaxed text-muted">{tab.body}</p>
            </div>
            {tab.preview}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="relative py-24 md:py-32">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-24 px-4 sm:px-6 md:gap-32">
        <SectionHeading
          id="features-title"
          title="One assistant. Every part of your life."
          body="Orbit connects the services you already use and turns them into one clear picture of your day."
        />

        <FeatureRow
          kicker="Your day, understood"
          title="Know what matters today."
          body="Orbit brings together your schedule, important emails, reminders and upcoming commitments to create a personalised daily briefing."
        >
          <TodayPreview />
        </FeatureRow>

        <FeatureRow
          flip
          kicker="Your Life Inbox"
          title="Nothing important slips through."
          body="See the things that need your attention, gathered from across your connected services."
        >
          <InboxPreview />
        </FeatureRow>

        <div className="flex flex-col gap-10">
          <Reveal className="max-w-2xl">
            <h3 className="text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-ink md:text-[38px]">
              Everything else, in the same place.
            </h3>
            <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-muted">
              Calendar, email, bills, investments, travel, fitness and tasks. One design, one assistant.
            </p>
          </Reveal>
          <Explorer />
        </div>
      </div>
    </section>
  );
}
