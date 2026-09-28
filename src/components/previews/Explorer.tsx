import {
  CalendarBlank,
  EnvelopeSimple,
  Receipt,
  ChartLineUp,
  AirplaneTilt,
  Heartbeat,
  CheckSquare,
  MagnifyingGlass,
  Sparkle,
  ArrowBendUpLeft,
  Lightning,
  Train,
  Bed,
  AirplaneTakeoff,
  ForkKnife,
  Circle,
  CheckCircle,
  Plus,
  Moon,
  Footprints,
  Barbell,
  Info,
  FileText,
} from "@phosphor-icons/react";
import { IconTile, Panel, PanelTitle, Pill, PreviewFrame, Tabs } from "./primitives";

/* ---------------- Calendar ---------------- */

const days = ["Mon 13", "Tue 14", "Wed 15", "Thu 16", "Fri 17"];
type Ev = { day: number; start: number; len: number; title: string; tone: "violet" | "rose" | "amber" | "neutral" };
const events: Ev[] = [
  { day: 0, start: 9, len: 1, title: "Planning", tone: "violet" },
  { day: 0, start: 18, len: 1, title: "Gym", tone: "amber" },
  { day: 1, start: 9.5, len: 0.5, title: "Stand-up", tone: "violet" },
  { day: 1, start: 12.5, len: 1, title: "Lunch", tone: "rose" },
  { day: 1, start: 15, len: 1, title: "Review", tone: "violet" },
  { day: 2, start: 9.5, len: 1, title: "Team sync", tone: "violet" },
  { day: 2, start: 14, len: 5, title: "To Edinburgh", tone: "neutral" },
  { day: 3, start: 10, len: 1.5, title: "Client visit", tone: "violet" },
  { day: 4, start: 11.25, len: 1, title: "Wrap-up call", tone: "violet" },
  { day: 3, start: 19.5, len: 1.5, title: "Dinner", tone: "rose" },
  { day: 4, start: 7.5, len: 1, title: "Run", tone: "amber" },
  { day: 4, start: 13, len: 1.5, title: "Train home", tone: "neutral" },
];
const toneCls = {
  violet: "bg-tint-info text-info",
  rose: "bg-accent-bg text-accent-fg",
  amber: "bg-tint-warn text-warn",
  neutral: "bg-soft text-ink",
};

export function CalendarPreview() {
  const top = 7, bottom = 21, h = 21; // px per hour
  return (
    <PreviewFrame
      icon={CalendarBlank}
      title="Calendar"
      subtitle="Week of 13 October"
      label="Orbit calendar preview with demo data: a week of work meetings, personal plans, a gym session, a dinner booking and a trip to Edinburgh, plus an insight about a 45 minute gap."
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
        <Panel className="p-3">
          <div className="grid grid-cols-[28px_repeat(5,1fr)] gap-1">
            <span />
            {days.map((d, i) => (
              <span key={d} className={`pb-1 text-center text-[10.5px] ${i === 1 ? "font-medium text-accent" : "text-muted"}`}>
                {d}
              </span>
            ))}
            <div className="relative" style={{ height: (bottom - top) * h }}>
              {[8, 12, 16, 20].map((hr) => (
                <span key={hr} className="absolute right-1 font-mono text-[9px] text-faint" style={{ top: (hr - top) * h - 5 }}>
                  {hr}
                </span>
              ))}
            </div>
            {days.map((d, di) => (
              <div key={d} className={`relative rounded-md ${di === 1 ? "bg-soft" : ""}`} style={{ height: (bottom - top) * h }}>
                {events
                  .filter((e) => e.day === di)
                  .map((e) => (
                    <span
                      key={e.title}
                      className={`absolute inset-x-0.5 overflow-hidden truncate rounded-[5px] px-1.5 py-0.5 text-[9.5px] leading-tight shadow-[inset_2px_0_0_currentColor] ${toneCls[e.tone]}`}
                      style={{ top: (e.start - top) * h, height: Math.max(e.len * h - 2, 14) }}
                    >
                      {e.title}
                    </span>
                  ))}
              </div>
            ))}
          </div>
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel className="flex flex-col gap-2 p-3">
            <PanelTitle>Up next</PanelTitle>
            {[
              { icon: ForkKnife, t: "Lunch with Tomás", m: "12:30 · Booking ref RS-118", tone: "rose" as const },
              { icon: AirplaneTakeoff, t: "Flight to Edinburgh", m: "Wed 16:20 · BZ 1452", tone: "violet" as const },
              { icon: Train, t: "Train to London", m: "Fri 13:00 · Seat C14", tone: "neutral" as const },
            ].map((e) => (
              <div key={e.t} className="flex items-center gap-2">
                <IconTile icon={e.icon} tone={e.tone} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] text-ink">{e.t}</p>
                  <p className="truncate text-[10px] text-muted">{e.m}</p>
                </div>
              </div>
            ))}
          </Panel>
          <div className="rounded-2xl border border-info/30 bg-tint-info p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-info">
              <Sparkle size={12} weight="fill" /> Insight
            </p>
            <p className="mt-1 text-[11.5px] leading-snug text-ink">
              You have 45 minutes between your Friday meeting and your train.
            </p>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

/* ---------------- Email ---------------- */

const mails = [
  { from: "Priya Raman", s: "Re: Launch deck, final numbers", tag: "Needs reply", tone: "rose" as const, t: "08:42", active: true },
  { from: "Brisa Air", s: "Booking confirmed: London to Edinburgh", tag: "Travel", tone: "violet" as const, t: "Yest" },
  { from: "Northgrid Energy", s: "Your October bill is ready", tag: "Bill", tone: "amber" as const, t: "Mon" },
  { from: "Hotel Calder", s: "Your reservation, 15 to 17 Oct", tag: "Travel", tone: "violet" as const, t: "Sun" },
  { from: "Fernhill Books", s: "Receipt for your order #40172", tag: "Receipt", tone: "neutral" as const, t: "Sat" },
];

export function EmailPreview() {
  return (
    <PreviewFrame
      icon={EnvelopeSimple}
      title="Email"
      subtitle="Gmail, as an example connection"
      label="Orbit email preview with demo data: a searchable inbox with important messages, travel confirmations and bills, an AI summary of the selected message and a suggested reply."
    >
      <div className="flex items-center gap-2 rounded-xl bg-soft px-3 py-2 text-[11.5px] text-muted">
        <MagnifyingGlass size={13} /> Search "hotel confirmation"
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ul className="flex flex-col gap-1">
          {mails.map((m) => (
            <li key={m.s} className={`flex flex-col gap-0.5 rounded-xl px-3 py-2 ${m.active ? "bg-soft" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-[12px] ${m.active ? "font-medium text-ink" : "text-ink/90"}`}>{m.from}</span>
                <span className="font-mono text-[10px] text-muted">{m.t}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-muted">{m.s}</span>
                <Pill tone={m.tone} className="shrink-0">{m.tag}</Pill>
              </div>
            </li>
          ))}
        </ul>
        <Panel className="flex flex-col gap-3 p-3.5">
          <div>
            <p className="text-[12.5px] font-medium text-ink">Re: Launch deck, final numbers</p>
            <p className="text-[10.5px] text-muted">Priya Raman · 08:42</p>
          </div>
          <div className="rounded-xl bg-accent-bg p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-accent-fg">
              <Sparkle size={12} weight="fill" /> Summary
            </p>
            <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-[11.5px] leading-snug text-ink marker:text-accent">
              <li>Needs Q3 revenue and retention figures</li>
              <li>Deadline: before Thursday's board prep</li>
              <li>Deck is attached for your comments</li>
            </ul>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <FileText size={13} /> launch-deck-v6.pdf
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11.5px] font-medium text-paper">
            <ArrowBendUpLeft size={12} weight="bold" /> Suggest a reply
          </span>
        </Panel>
      </div>
    </PreviewFrame>
  );
}

/* ---------------- Bills ---------------- */

const bills = [
  { name: "Electricity", co: "Northgrid Energy", amt: "£68.32", due: "Fri 17 Oct", when: "3 days", tone: "amber" as const },
  { name: "Broadband", co: "Lumen Fibre", amt: "£29.99", due: "Sat 18 Oct", when: "4 days", tone: "amber" as const },
  { name: "Music streaming", co: "Subscription", amt: "£10.99", due: "Fri 24 Oct", when: "10 days", tone: "neutral" as const },
  { name: "Council tax", co: "Borough council", amt: "£142.00", due: "Sat 1 Nov", when: "18 days", tone: "neutral" as const },
  { name: "Gym membership", co: "Subscription", amt: "£34.50", due: "Thu 6 Nov", when: "23 days", tone: "neutral" as const },
];

export function BillsPreview() {
  return (
    <PreviewFrame
      icon={Receipt}
      title="Bills"
      subtitle="Upcoming and recurring payments"
      label="Orbit bills preview with demo data: upcoming payment total, bills due this week, subscription renewals, payment dates and a monthly recurring total."
    >
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Next 30 days", "£285.80"],
          ["Due this week", "£98.31"],
          ["Subscriptions a month", "£75.48"],
        ].map(([k, v], i) => (
          <Panel key={k} className={`p-3 ${i === 1 ? "border-warn/40" : ""}`}>
            <p className="text-[10.5px] text-muted">{k}</p>
            <p className={`mt-1 font-mono text-[16px] tracking-tight sm:text-[18px] ${i === 1 ? "text-warn" : "text-ink"}`}>{v}</p>
          </Panel>
        ))}
      </div>
      <Tabs items={["Upcoming", "Subscriptions", "Paid"]} />
      <ul className="flex flex-col gap-1.5">
        {bills.map((b) => (
          <li key={b.name} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
            <IconTile icon={Receipt} tone={b.tone} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] text-ink">{b.name}</p>
              <p className="truncate text-[10.5px] text-muted">{b.co} · {b.due}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[12px] text-ink">{b.amt}</p>
              <p className={`text-[10px] ${b.tone === "amber" ? "text-warn" : "text-muted"}`}>in {b.when}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10.5px] text-muted">Orbit shows what is due. It does not make payments.</p>
    </PreviewFrame>
  );
}

/* ---------------- Investments ---------------- */

const series = [22.9, 23.1, 22.8, 23.4, 23.2, 23.6, 23.5, 23.9, 23.7, 24.1, 24.0, 24.3, 24.1, 24.5, 24.4, 24.832];

function linePath(data: number[], w: number, h: number) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min)) * (h - 8) - 4]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return { d, area: `${d} L${w},${h} L0,${h} Z` };
}

const allocation = [
  { k: "Global equities", v: 52, c: "var(--green)" },
  { k: "UK equities", v: 21, c: "var(--blue)" },
  { k: "Bonds", v: 15, c: "var(--sageDeep)" },
  { k: "Cash", v: 12, c: "var(--faint)" },
];

export function InvestmentsPreview() {
  const { d, area } = linePath(series, 320, 90);
  let acc = 0;
  const r = 26, circ = 2 * Math.PI * r;
  return (
    <PreviewFrame
      icon={ChartLineUp}
      title="Investments"
      subtitle="Your portfolio at a glance"
      label="Orbit investments preview with fictional demo figures: a portfolio value of £24,832, a daily change, a performance chart, asset allocation and example holdings."
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted">Portfolio value</p>
          <p className="font-mono text-[28px] tracking-[-0.03em] text-ink">£24,832.17</p>
          <p className="font-mono text-[11.5px] text-accent-fg">+£196.40 (0.80%) today</p>
        </div>
        <Tabs items={["1D", "1M", "1Y"]} active={2} className="w-36" />
      </div>
      <svg viewBox="0 0 320 90" className="h-24 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="inv-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--green)" }} stopOpacity="0.28" />
            <stop offset="1" style={{ stopColor: "var(--green)" }} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#inv-fill)" />
        <path d={d} fill="none" stroke="var(--green)" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Panel className="flex items-center gap-4 p-3.5">
          <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90">
            {allocation.map((a) => {
              const len = (a.v / 100) * circ;
              const el = (
                <circle key={a.k} cx="32" cy="32" r={r} fill="none" stroke={a.c} strokeWidth="9" strokeDasharray={`${len - 1.5} ${circ}`} strokeDashoffset={-acc} />
              );
              acc += len;
              return el;
            })}
          </svg>
          <ul className="flex flex-1 flex-col gap-1">
            {allocation.map((a) => (
              <li key={a.k} className="flex items-center gap-2 text-[11px]">
                <span className="size-2 rounded-sm" style={{ background: a.c }} />
                <span className="flex-1 text-muted">{a.k}</span>
                <span className="font-mono text-ink">{a.v}%</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="flex flex-col gap-2 p-3.5">
          <PanelTitle>Holdings</PanelTitle>
          {[
            ["Global Index Fund", "£12,910", "+0.9%"],
            ["UK All-Share Tracker", "£5,214", "+0.4%"],
            ["Short Gilt Fund", "£3,725", "+0.1%"],
          ].map(([n, v, c]) => (
            <div key={n} className="flex items-center justify-between gap-2 text-[11.5px]">
              <span className="truncate text-ink">{n}</span>
              <span className="font-mono text-muted">
                {v} <span className="text-accent-fg">{c}</span>
              </span>
            </div>
          ))}
        </Panel>
      </div>
      <p className="flex items-start gap-1.5 text-[10.5px] leading-snug text-muted">
        <Info size={12} className="mt-px shrink-0" />
        Fictional figures for illustration. Orbit organises information and does not give personalised investment advice.
      </p>
    </PreviewFrame>
  );
}

/* ---------------- Travel ---------------- */

export function TravelPreview() {
  return (
    <PreviewFrame
      icon={AirplaneTilt}
      title="Bookings"
      subtitle="All your trips in one place"
      label="Orbit bookings preview with demo data: a trip to Edinburgh with a flight, a hotel reservation, a dinner booking and a train home, including confirmation references."
    >
      <Tabs items={["Upcoming", "Past", "Saved"]} />
      <Panel className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium text-ink">Edinburgh</p>
            <p className="text-[11px] text-muted">Wed 15 to Fri 17 October · 3 bookings</p>
          </div>
          <Pill tone="violet">In 1 day</Pill>
        </div>
        <ol className="relative flex flex-col gap-3.5 pl-6 before:absolute before:bottom-3 before:left-[9px] before:top-3 before:w-px before:bg-line">
          {[
            { icon: AirplaneTakeoff, t: "Flight BZ 1452, LHR to EDI", m: "Wed 15 Oct · 16:20 · Check-in opens today", ref: "Ref K7QX2M", tone: "violet" as const },
            { icon: Bed, t: "Hotel Calder, 2 nights", m: "Check-in Wed from 15:00", ref: "Ref HC-48213", tone: "rose" as const },
            { icon: ForkKnife, t: "Dinner at The Kitchin", m: "Thu 16 Oct · 19:30 · Table for 2", ref: "Ref TK-9031", tone: "amber" as const },
            { icon: Train, t: "Train, EDI to King's Cross", m: "Fri 17 Oct · 13:00 · Coach C", ref: "Ref 7XR4-LN", tone: "neutral" as const },
          ].map((s) => (
            <li key={s.t} className="relative flex items-start gap-3">
              <span className="absolute -left-6 top-0.5 grid size-[19px] place-items-center rounded-full border border-line bg-paper">
                <span className="size-1.5 rounded-full bg-muted" />
              </span>
              <IconTile icon={s.icon} tone={s.tone} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] text-ink">{s.t}</p>
                <p className="truncate text-[10.5px] text-muted">{s.m}</p>
              </div>
              <span className="hidden shrink-0 rounded-md bg-soft px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline">{s.ref}</span>
            </li>
          ))}
        </ol>
        <span className="mt-1 inline-flex w-fit items-center rounded-full border border-line px-3 py-1.5 text-[11.5px] text-ink">
          View confirmation
        </span>
      </Panel>
    </PreviewFrame>
  );
}

/* ---------------- Fitness ---------------- */

const week = [6.2, 9.1, 7.4, 11.3, 8.4, 4.1, 0];

export function FitnessPreview() {
  const steps = 8432, goal = 10000;
  const r = 40, circ = 2 * Math.PI * r;
  return (
    <PreviewFrame
      icon={Heartbeat}
      title="Fitness"
      subtitle="Activity and routines"
      label="Orbit fitness preview with demo data: 8,432 of 10,000 daily steps, a workout schedule, weekly activity, a sleep summary and personal goals."
    >
      <Tabs items={["Activity", "Workouts", "Sleep"]} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
        <Panel className="flex items-center gap-4 p-4">
          <div className="relative size-24">
            <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
              <circle cx="50" cy="50" r={r} fill="none" stroke="var(--soft)" strokeWidth="9" />
              <circle cx="50" cy="50" r={r} fill="none" stroke="var(--green)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(steps / goal) * circ} ${circ}`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-mono text-[16px] leading-none text-ink">8,432</p>
                <p className="text-[9.5px] text-muted">steps</p>
              </div>
            </div>
          </div>
          <ul className="flex flex-col gap-2 text-[11px]">
            <li className="flex items-center gap-2 text-muted"><Footprints size={13} className="text-accent" /> 6.1 km</li>
            <li className="flex items-center gap-2 text-muted"><Moon size={13} className="text-info" /> 7h 12m sleep</li>
            <li className="flex items-center gap-2 text-muted"><Barbell size={13} className="text-warn" /> 3 of 4 workouts</li>
          </ul>
        </Panel>
        <Panel className="flex flex-col gap-2 p-4">
          <PanelTitle action="This week">Active minutes</PanelTitle>
          <div className="flex h-20 items-end gap-2">
            {week.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-[4px] ${i === 3 ? "bg-accent" : "bg-accent/25"}`}
                  style={{ height: `${Math.max((v / 12) * 64, 3)}px` }}
                />
                <span className="text-[9.5px] text-muted">{"MTWTFSS"[i]}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Panel className="flex flex-col gap-2 p-3.5">
          <PanelTitle>Workout plan</PanelTitle>
          {[
            ["Tue 18:15", "Strength, upper body"],
            ["Thu 07:30", "Run, 5 km"],
            ["Sat 10:00", "Yoga class"],
          ].map(([t, w]) => (
            <div key={w} className="flex gap-3 text-[11.5px]">
              <span className="w-16 shrink-0 font-mono text-muted">{t}</span>
              <span className="truncate text-ink">{w}</span>
            </div>
          ))}
        </Panel>
        <Panel className="flex flex-col gap-2 p-3.5">
          <PanelTitle>Goals</PanelTitle>
          {[
            ["Walk 10k steps a day", "4 of 7 days"],
            ["Asleep by 23:00", "5 of 7 nights"],
          ].map(([g, p]) => (
            <div key={g} className="flex items-center justify-between gap-2 text-[11.5px]">
              <span className="truncate text-ink">{g}</span>
              <span className="shrink-0 text-muted">{p}</span>
            </div>
          ))}
        </Panel>
      </div>
    </PreviewFrame>
  );
}

/* ---------------- Tasks ---------------- */

const taskList = [
  { t: "Send launch numbers to Priya", due: "Today, 12:00", src: "From email", pri: true },
  { t: "Renew car insurance", due: "Fri 17 Oct", src: "Policy ends 24 Oct", pri: true },
  { t: "Plan weekend trip to the Peak District", due: "Sat", src: "Personal" },
  { t: "Book dentist check-up", due: "Next week", src: "Personal" },
  { t: "Pack for Edinburgh", due: "Done", src: "Travel", done: true },
];

export function TasksPreview() {
  return (
    <PreviewFrame
      icon={CheckSquare}
      title="Tasks and reminders"
      subtitle="Get things done"
      label="Orbit tasks preview with demo data: today, upcoming and completed tabs, priority tasks with due dates and checkboxes, and an add task button."
    >
      <Tabs items={["Today", "Upcoming", "Completed"]} />
      <ul className="flex flex-col gap-1.5">
        {taskList.map((t) => (
          <li key={t.t} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
            {t.done ? <CheckCircle size={18} weight="fill" className="shrink-0 text-accent" /> : <Circle size={18} className="shrink-0 text-faint" />}
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[12.5px] ${t.done ? "text-muted line-through" : "text-ink"}`}>{t.t}</p>
              <p className="truncate text-[10.5px] text-muted">{t.due} · {t.src}</p>
            </div>
            {t.pri && <Pill tone="rose" className="shrink-0">Priority</Pill>}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <Lightning size={12} weight="fill" className="text-accent" /> 2 tasks suggested from your email
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[12px] font-medium text-paper">
          <Plus size={13} weight="bold" /> Add task
        </span>
      </div>
    </PreviewFrame>
  );
}
