import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import {
  CalendarBlank,
  AirplaneTakeoff,
  Bed,
  Receipt,
  ArrowUp,
  Microphone,
  ShieldCheck,
  EnvelopeSimple,
  CheckSquare,
  Barbell,
} from "@phosphor-icons/react";
import { Orb } from "./ui/Logo";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/Section";
import { IconTile, type Tone } from "./previews/primitives";

type Source = { icon: Icon; tone: Tone; title: string; detail: string; source: string };
type Convo = { prompt: string; ask: string; answer: string; sources: Source[] };

const convos: Convo[] = [
  {
    prompt: "What do I need to know about tomorrow?",
    ask: "What do I need to know about tomorrow?",
    answer:
      "You have a 9:30 team meeting, and your flight to Edinburgh leaves at 16:20. Your hotel check-in is available from 15:00. Your electricity bill is due on Friday. I've put the key details below.",
    sources: [
      { icon: CalendarBlank, tone: "violet", title: "Team meeting", detail: "Wed 09:30 to 10:00", source: "Calendar" },
      { icon: AirplaneTakeoff, tone: "violet", title: "BZ 1452 to Edinburgh", detail: "Departs 16:20, Terminal 5", source: "Email from Brisa Air" },
      { icon: Bed, tone: "rose", title: "Hotel Calder", detail: "Check-in from 15:00", source: "Email from Hotel Calder" },
      { icon: Receipt, tone: "amber", title: "Electricity bill", detail: "£68.32 due Fri", source: "Bills" },
    ],
  },
  {
    prompt: "What's coming up this week?",
    ask: "What's coming up this week?",
    answer:
      "It's a busy middle of the week. You're in Edinburgh from Wednesday to Friday, with a client visit on Thursday morning. Back in London, you have a gym session tonight and a yoga class on Saturday.",
    sources: [
      { icon: AirplaneTakeoff, tone: "violet", title: "Edinburgh trip", detail: "Wed 15 to Fri 17 Oct", source: "Bookings" },
      { icon: CalendarBlank, tone: "violet", title: "Client visit", detail: "Thu 10:00 to 11:30", source: "Calendar" },
      { icon: Barbell, tone: "amber", title: "Strength session", detail: "Today 18:15", source: "Fitness" },
    ],
  },
  {
    prompt: "Have I got any bills due?",
    ask: "Have I got any bills due?",
    answer:
      "Two bills are due in the next few days, £98.31 in total. Your council tax of £142.00 follows on 1 November. I can't pay them for you, but I can remind you the day before.",
    sources: [
      { icon: Receipt, tone: "amber", title: "Electricity", detail: "£68.32 due Fri 17 Oct", source: "Bills" },
      { icon: Receipt, tone: "amber", title: "Broadband", detail: "£29.99 due Sat 18 Oct", source: "Bills" },
      { icon: Receipt, tone: "neutral", title: "Council tax", detail: "£142.00 due Sat 1 Nov", source: "Bills" },
    ],
  },
  {
    prompt: "When is my next flight?",
    ask: "When is my next flight?",
    answer:
      "Tomorrow at 16:20 from Heathrow Terminal 5 to Edinburgh, landing at 17:45. Online check-in is open now. Your booking reference is K7QX2M.",
    sources: [
      { icon: AirplaneTakeoff, tone: "violet", title: "BZ 1452, LHR to EDI", detail: "Wed 15 Oct, 16:20", source: "Email from Brisa Air" },
    ],
  },
  {
    prompt: "Find the email with my hotel confirmation.",
    ask: "Find the email with my hotel confirmation.",
    answer: "Here it is. Hotel Calder sent it on Sunday: two nights from 15 October, reference HC-48213, with breakfast included.",
    sources: [
      { icon: EnvelopeSimple, tone: "rose", title: "Your reservation, 15 to 17 Oct", detail: "Hotel Calder, Sun 12 Oct", source: "Email" },
      { icon: CheckSquare, tone: "neutral", title: "Pack for Edinburgh", detail: "Task, due Wed", source: "Tasks" },
    ],
  },
];

export function Assistant() {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();
  const c = convos[idx];

  return (
    <section aria-labelledby="assistant-title" className="relative overflow-hidden py-24 md:py-32">
      <div aria-hidden="true" className="glow-cta pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <SectionHeading
          id="assistant-title"
          title={
            <>
              Just ask <span className="text-accent">Orbit.</span>
            </>
          }
          body="Ask questions about your life in plain English. Orbit brings together the information you've connected to give you a useful, contextual answer."
        />

        <Reveal className="mx-auto mt-14 max-w-[880px]">
          <div className="overflow-hidden rounded-[28px] border border-line bg-[#100e16] shadow-[0_60px_120px_-50px_rgba(124,77,255,0.4)]">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <Orb className="size-6" />
                <div>
                  <p className="text-[14px] font-medium leading-tight text-ink">Orbit</p>
                  <p className="text-[11.5px] text-muted">Answers from your connected sources</p>
                </div>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">Demo</span>
            </div>

            <div className="flex min-h-[400px] flex-col gap-5 p-5 sm:p-7" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={idx}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-5"
                >
                  <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[14.5px] text-paper">{c.ask}</p>
                  <div className="flex gap-3">
                    <Orb className="mt-1 size-6" />
                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                      <p className="max-w-[62ch] text-[15px] leading-relaxed text-ink">{c.answer}</p>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {c.sources.map((s, i) => (
                          <motion.li
                            key={s.title}
                            initial={reduce ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
                          >
                            <IconTile icon={s.icon} tone={s.tone} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-ink">{s.title}</p>
                              <p className="truncate text-[12px] text-muted">{s.detail}</p>
                              <p className="mt-0.5 truncate text-[11px] text-accent-fg">Source: {s.source}</p>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3 border-t border-line p-4 sm:p-5">
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Example questions">
                {convos.map((cv, i) => (
                  <button
                    key={cv.prompt}
                    type="button"
                    aria-pressed={i === idx}
                    onClick={() => setIdx(i)}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                      i === idx ? "border-accent/60 bg-accent-bg text-accent-fg" : "border-line bg-soft text-muted hover:border-[#433d52] hover:text-ink"
                    }`}
                  >
                    {cv.prompt}
                  </button>
                ))}
              </div>
              <div aria-hidden="true" className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <span className="flex-1 text-[14px] text-muted">Ask Orbit anything...</span>
                <Microphone size={18} className="text-muted" />
                <span className="grid size-8 place-items-center rounded-full bg-accent text-paper">
                  <ArrowUp size={15} weight="bold" />
                </span>
              </div>
            </div>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-[13px] text-muted">
            <ShieldCheck size={15} className="shrink-0 text-accent-fg" />
            Orbit answers from the sources you connect and shows where each detail came from.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
