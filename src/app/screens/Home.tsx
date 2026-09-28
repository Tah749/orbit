import { useState } from "react";
import {
  Lightning,
  AirplaneTakeoff,
  Receipt,
  ChartLineUp,
  Circle,
  CheckCircle,
  CaretRight,
  ArrowUp,
  Footprints,
} from "@phosphor-icons/react";
import { Orb } from "../../components/ui/Logo";
import { IconTile, Pill } from "../../components/previews/primitives";
import { useStore } from "../store";
import { calEvents, inboxItems, portfolio } from "../data";
import { Card, CardHead, LinkButton, money } from "../ui";

const toneBar = { violet: "bg-info", rose: "bg-accent", amber: "bg-warn", neutral: "bg-muted" } as const;
const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

export function HomeScreen() {
  const { go, tasks, toggleTask, ask, toast } = useStore();
  const [q, setQ] = useState("");
  const today = calEvents.filter((e) => e.day === 1);
  const open = tasks.filter((t) => t.group === "today");
  const important = inboxItems.filter((i) => i.important);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">Tuesday 14 October</p>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[32px]">Good morning, Alex</h1>
        </div>
        <Pill tone="solid" className="!px-2.5 !py-1 !text-[11.5px]">Today</Pill>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-7">
          <Card className="relative overflow-hidden p-5">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(124,77,255,0.18),transparent_70%)]" />
            <div className="relative flex flex-col gap-3">
              <p className="flex items-center gap-2 text-[12.5px] font-medium text-accent-fg">
                <Orb className="size-4" /> Your daily briefing
              </p>
              <p className="text-[15.5px] leading-relaxed">
                Three things need you today. Priya is waiting on final numbers for the launch deck, your electricity bill is due Friday,
                and tomorrow's flight to Edinburgh is confirmed. You have a free hour after lunch.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Draft reply to Priya", run: () => go("email") },
                  { label: "Review bill", run: () => go("bills") },
                  { label: "Check in for flight", run: () => go("bookings") },
                ].map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.run}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-soft px-3 py-1.5 text-[12.5px] transition-colors hover:border-accent/50 hover:text-accent-fg"
                  >
                    <Lightning size={12} weight="fill" className="text-accent" /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="flex flex-col gap-3 p-4">
              <CardHead title="Needs attention" action={<LinkButton onClick={() => go("inbox")}>Life Inbox</LinkButton>} />
              <ul className="flex flex-col gap-1">
                {important.map((i) => (
                  <li key={i.id}>
                    <button type="button" onClick={() => go(i.action.tab)} className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-soft">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px]">{i.title}</p>
                        <p className="truncate text-[11.5px] text-muted">{i.source}</p>
                      </div>
                      <CaretRight size={12} className="text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="flex flex-col gap-3 p-4">
              <CardHead title="Today's tasks" action={<LinkButton onClick={() => go("tasks")}>All tasks</LinkButton>} />
              <ul className="flex flex-col gap-1">
                {open.slice(0, 4).map((t) => (
                  <li key={t.id}>
                    <button type="button" role="checkbox" aria-checked={t.done} onClick={() => toggleTask(t.id)} className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-soft">
                      {t.done ? <CheckCircle size={18} weight="fill" className="shrink-0 text-accent" /> : <Circle size={18} className="shrink-0 text-[#5a5368]" />}
                      <span className={`flex-1 truncate text-[13px] ${t.done ? "text-muted line-through" : ""}`}>{t.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button type="button" onClick={() => go("bills")} className="text-left">
              <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:border-[#433d52]">
                <div className="flex items-center justify-between"><IconTile icon={Receipt} tone="amber" size="sm" /><Pill tone="amber">3 days</Pill></div>
                <p className="text-[11.5px] text-muted">Electricity bill</p>
                <p className="font-mono text-[17px]">£68.32</p>
              </Card>
            </button>
            <button type="button" onClick={() => go("investments")} className="text-left">
              <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:border-[#433d52]">
                <div className="flex items-center justify-between"><IconTile icon={ChartLineUp} tone="rose" size="sm" /><span className="font-mono text-[11px] text-accent-fg">+0.8%</span></div>
                <p className="text-[11.5px] text-muted">Portfolio</p>
                <p className="font-mono text-[17px]">{money(portfolio.value).split(".")[0]}</p>
              </Card>
            </button>
            <button type="button" onClick={() => go("fitness")} className="text-left">
              <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:border-[#433d52]">
                <div className="flex items-center justify-between"><IconTile icon={Footprints} tone="violet" size="sm" /><span className="font-mono text-[11px] text-muted">84%</span></div>
                <p className="text-[11.5px] text-muted">Steps</p>
                <p className="font-mono text-[17px]">8,432</p>
              </Card>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-5">
          <Card className="flex flex-col gap-3 p-4">
            <CardHead title="Today's schedule" action={<LinkButton onClick={() => go("calendar")}>Calendar</LinkButton>} />
            <ul className="flex flex-col gap-1">
              {today.map((e) => (
                <li key={e.title} className="flex items-center gap-3 rounded-xl p-2">
                  <div className="w-11 text-right font-mono text-[11px] leading-tight text-muted">
                    <p className="text-ink">{fmt(e.start)}</p>
                    <p>{fmt(e.start + e.len)}</p>
                  </div>
                  <span className={`h-9 w-[3px] rounded-full ${toneBar[e.tone]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{e.title}</p>
                    <p className="truncate text-[11.5px] text-muted">{e.where}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <button type="button" onClick={() => go("bookings")} className="text-left">
            <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-[#433d52]">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-medium">Upcoming trip</h2>
                <Pill tone="violet">Tomorrow</Pill>
              </div>
              <div className="flex items-center gap-3">
                <IconTile icon={AirplaneTakeoff} tone="violet" />
                <div className="flex flex-1 items-center justify-between">
                  <div><p className="font-mono text-[19px]">LHR</p><p className="text-[11px] text-muted">16:20</p></div>
                  <div className="mx-3 h-px flex-1 bg-[linear-gradient(90deg,var(--line),var(--blue),var(--line))]" />
                  <div className="text-right"><p className="font-mono text-[19px]">EDI</p><p className="text-[11px] text-muted">17:45</p></div>
                </div>
              </div>
              <p className="text-[11.5px] text-muted">Brisa Air BZ 1452 · Terminal 5 · Ref K7QX2M</p>
            </Card>
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) ask(q.trim());
          else toast("Type a question first.");
        }}
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5"
      >
        <Orb className="size-5" />
        <label htmlFor="home-ask" className="sr-only">Ask Orbit</label>
        <input
          id="home-ask"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask Orbit about your week, a booking, a bill..."
          className="h-9 flex-1 bg-transparent text-[14px] placeholder:text-[#8a8398] focus:outline-none"
        />
        <button type="submit" aria-label="Ask" className="grid size-9 place-items-center rounded-full bg-accent text-paper">
          <ArrowUp size={15} weight="bold" />
        </button>
      </form>
    </div>
  );
}
