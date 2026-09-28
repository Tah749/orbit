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
  MagnifyingGlass,
  Microphone,
  ArrowUp,
  Lightning,
  AirplaneTakeoff,
  Circle,
  CheckCircle,
  CaretRight,
} from "@phosphor-icons/react";
import { Orb } from "../ui/Logo";
import { IconTile, Panel, PanelTitle, Pill } from "./primitives";

const nav = [
  { icon: House, label: "Home", active: true },
  { icon: Tray, label: "Life Inbox", count: 4 },
  { icon: CalendarBlank, label: "Calendar" },
  { icon: EnvelopeSimple, label: "Email" },
  { icon: Receipt, label: "Bills" },
  { icon: ChartLineUp, label: "Investments" },
  { icon: AirplaneTilt, label: "Bookings" },
  { icon: Heartbeat, label: "Fitness" },
  { icon: CheckSquare, label: "Tasks" },
];

const schedule = [
  { time: "09:30", end: "10:00", title: "Team stand-up", meta: "Video call", tag: "Work", tone: "violet" as const },
  { time: "12:30", end: "13:30", title: "Lunch with Tomás", meta: "Rosa's, Soho", tag: "Personal", tone: "rose" as const },
  { time: "15:00", end: "16:00", title: "Q4 project review", meta: "Room 4", tag: "Work", tone: "violet" as const },
  { time: "18:15", end: "19:15", title: "Strength session", meta: "Gym", tag: "Fitness", tone: "amber" as const },
];

const emails = [
  { from: "Priya Raman", subject: "Re: Launch deck, final numbers", time: "08:42", unread: true },
  { from: "Harbour Lettings", subject: "Tenancy renewal documents", time: "07:15", unread: true },
  { from: "Brisa Air", subject: "Your boarding pass is ready", time: "Yest" },
];

const tasks = [
  { title: "Reply to Priya", due: "Today", done: false },
  { title: "Renew car insurance", due: "Fri", done: false },
  { title: "Book table for Saturday", due: "Done", done: true },
];

function Sidebar() {
  return (
    <aside className="hidden w-[200px] shrink-0 flex-col justify-between border-r border-line bg-deep p-3 lg:flex">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2 pt-1">
          <Orb className="size-[18px]" />
          <span className="text-[14px] font-medium tracking-[-0.02em]">Orbit</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav.map(({ icon: I, label, active, count }) => (
            <span
              key={label}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[12.5px] ${
                active ? "bg-soft text-ink" : "text-muted"
              }`}
            >
              <I size={15} className={active ? "text-accent" : ""} weight={active ? "fill" : "regular"} />
              <span className="flex-1">{label}</span>
              {count && <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold leading-4 text-paper">{count}</span>}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2.5 rounded-xl border border-line p-2">
        <span className="grid size-7 place-items-center rounded-full bg-tint-info text-[11px] font-medium text-info">AR</span>
        <div className="min-w-0">
          <p className="truncate text-[12px] text-ink">Alex Rowe</p>
          <p className="text-[10.5px] text-muted">5 services connected</p>
        </div>
      </div>
    </aside>
  );
}

function Briefing() {
  return (
    <Panel className="relative overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[radial-gradient(circle,var(--glow-violet),transparent_70%)]" />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Orb className="size-4" />
          <span className="text-[12px] font-medium text-accent-fg">Your daily briefing</span>
        </div>
        <p className="text-[14px] leading-relaxed text-ink">
          Three things need you today. Priya is waiting on final numbers for the launch deck, your electricity bill
          is due Friday, and tomorrow's flight to Edinburgh is confirmed. You have a free hour after lunch.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Draft reply to Priya", "Review bill", "Add check-in reminder"].map((a) => (
            <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-soft px-2.5 py-1 text-[11px] text-ink">
              <Lightning size={11} className="text-accent" weight="fill" />
              {a}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function Schedule() {
  return (
    <Panel className="flex flex-col gap-3 p-4">
      <PanelTitle action="4 events">Today's schedule</PanelTitle>
      <ul className="flex flex-col gap-2">
        {schedule.map((e, i) => (
          <li key={e.title} className={`flex items-center gap-3 rounded-xl p-2 ${i === 0 ? "bg-soft" : ""}`}>
            <div className="w-10 text-right font-mono text-[10.5px] leading-tight text-muted">
              <p className="text-ink">{e.time}</p>
              <p>{e.end}</p>
            </div>
            <span className={`h-8 w-[3px] rounded-full ${e.tone === "violet" ? "bg-info" : e.tone === "amber" ? "bg-warn" : "bg-accent"}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] text-ink">{e.title}</p>
              <p className="truncate text-[11px] text-muted">{e.meta}</p>
            </div>
            <Pill tone={e.tone}>{e.tag}</Pill>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Emails() {
  return (
    <Panel className="flex flex-col gap-3 p-4">
      <PanelTitle action="Email">Important emails</PanelTitle>
      <ul className="flex flex-col gap-2.5">
        {emails.map((m) => (
          <li key={m.subject} className="flex items-start gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: m.unread ? "var(--green)" : "transparent" }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className={`truncate text-[12px] ${m.unread ? "font-medium text-ink" : "text-muted"}`}>{m.from}</p>
                <span className="font-mono text-[10px] text-muted">{m.time}</span>
              </div>
              <p className="truncate text-[11.5px] text-muted">{m.subject}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Tasks() {
  return (
    <Panel className="flex flex-col gap-3 p-4">
      <PanelTitle action="3 open">Tasks</PanelTitle>
      <ul className="flex flex-col gap-2.5">
        {tasks.map((t) => (
          <li key={t.title} className="flex items-center gap-2.5">
            {t.done ? <CheckCircle size={16} weight="fill" className="text-accent" /> : <Circle size={16} className="text-faint" />}
            <span className={`flex-1 truncate text-[12px] ${t.done ? "text-muted line-through" : "text-ink"}`}>{t.title}</span>
            <span className="text-[10.5px] text-muted">{t.due}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Flight() {
  return (
    <Panel className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <PanelTitle>Upcoming trip</PanelTitle>
        <Pill tone="violet">Tomorrow</Pill>
      </div>
      <div className="flex items-center gap-3">
        <IconTile icon={AirplaneTakeoff} tone="violet" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <p className="font-mono text-[18px] tracking-tight text-ink">LHR</p>
            <p className="text-[10.5px] text-muted">16:20</p>
          </div>
          <div className="mx-2 h-px flex-1 bg-[linear-gradient(90deg,var(--line),var(--blue),var(--line))]" />
          <div className="text-right">
            <p className="font-mono text-[18px] tracking-tight text-ink">EDI</p>
            <p className="text-[10.5px] text-muted">17:45</p>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted">Brisa Air BZ 1452 · Terminal 5</p>
    </Panel>
  );
}

function BillAndPortfolio() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Panel className="flex flex-col gap-1.5 p-3.5">
        <div className="flex items-center justify-between">
          <IconTile icon={Receipt} tone="amber" size="sm" />
          <Pill tone="amber">3 days</Pill>
        </div>
        <p className="mt-1 text-[11px] text-muted">Electricity bill</p>
        <p className="font-mono text-[17px] tracking-tight text-ink">£68.32</p>
      </Panel>
      <Panel className="flex flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between">
          <IconTile icon={ChartLineUp} tone="rose" size="sm" />
          <span className="font-mono text-[10.5px] text-accent-fg">+0.8%</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Portfolio</p>
        <p className="font-mono text-[17px] tracking-tight text-ink">£24,832</p>
      </Panel>
    </div>
  );
}

function AskBar() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5">
      <Orb className="size-4" />
      <span className="flex-1 text-[12.5px] text-muted">Ask Orbit about your week, a booking, a bill...</span>
      <Microphone size={16} className="text-muted" />
      <span className="grid size-7 place-items-center rounded-full bg-accent text-paper">
        <ArrowUp size={14} weight="bold" />
      </span>
    </div>
  );
}

/** Desktop app window used as the hero centrepiece. */
export function HeroDashboard() {
  return (
    <figure
      role="img"
      aria-label="Preview of the Orbit home screen with illustrative demo data: a daily briefing, today's schedule, important emails, tasks, an upcoming flight to Edinburgh, a bill reminder and a portfolio summary."
      className="overflow-hidden rounded-[20px] border border-line bg-paper shadow-[0_60px_120px_-40px_var(--shade)]"
    >
      <div aria-hidden="true">
        {/* Title bar */}
        <div className="flex items-center gap-4 border-b border-line bg-deep px-4 py-2.5">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2.5 rounded-full bg-soft" />
            ))}
          </div>
          <div className="mx-auto flex w-full max-w-sm items-center gap-2 rounded-lg bg-soft px-3 py-1.5 text-[11.5px] text-muted">
            <MagnifyingGlass size={13} />
            Search emails, bookings, bills...
          </div>
          <span className="hidden text-[10.5px] text-muted sm:inline">Illustrative demo data</span>
        </div>
        <div className="flex">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] text-muted">Tuesday 14 October</p>
                <p className="text-[22px] font-medium tracking-[-0.02em] text-ink">Good morning, Alex</p>
              </div>
              <span className="hidden items-center gap-1 text-[11.5px] text-muted sm:flex">
                Open Life Inbox <CaretRight size={11} />
              </span>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-7 flex flex-col gap-3">
                <Briefing />
                <div className="grid grid-cols-2 gap-3">
                  <Emails />
                  <Tasks />
                </div>
                <BillAndPortfolio />
              </div>
              <div className="col-span-5 flex flex-col gap-3">
                <Schedule />
                <Flight />
              </div>
            </div>
            <AskBar />
          </div>
        </div>
      </div>
    </figure>
  );
}
