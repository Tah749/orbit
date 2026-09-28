import { useState } from "react";
import { Receipt, ArrowsClockwise, Bell, BellRinging, CheckCircle } from "@phosphor-icons/react";
import { IconTile } from "../../components/previews/primitives";
import { useStore } from "../store";
import { bills } from "../data";
import { Card, PageHeader, Segmented, money } from "../ui";

const views = ["Upcoming", "Subscriptions", "Paid"] as const;
type View = (typeof views)[number];

export function BillsScreen() {
  const { toast } = useStore();
  const [view, setView] = useState<View>("Upcoming");
  const [reminders, setReminders] = useState<string[]>(["Electricity"]);

  const upcoming = bills.filter((b) => !b.paid);
  const thisWeek = upcoming.filter((b) => b.inDays <= 7);
  const subs = bills.filter((b) => b.kind === "subscription");
  const list = view === "Upcoming" ? upcoming : view === "Subscriptions" ? subs : bills.filter((b) => b.paid);
  const sum = (xs: typeof bills) => xs.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Bills" subtitle="Upcoming and recurring payments." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { k: "Next 30 days", v: sum(upcoming), n: `${upcoming.length} payments` },
          { k: "Due this week", v: sum(thisWeek), n: `${thisWeek.length} bills`, warn: true },
          { k: "Subscriptions a month", v: sum(subs), n: `${subs.length} active` },
        ].map((s) => (
          <Card key={s.k} className={`p-4 ${s.warn ? "border-warn/40" : ""}`}>
            <p className="text-[12px] text-muted">{s.k}</p>
            <p className={`mt-1 font-mono text-[24px] tracking-tight ${s.warn ? "text-warn" : ""}`}>{money(s.v)}</p>
            <p className="text-[11.5px] text-muted">{s.n}</p>
          </Card>
        ))}
      </div>
      <Segmented items={views} value={view} onChange={setView} label="Bill views" className="w-full sm:w-auto" />
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {list.map((b) => {
            const on = reminders.includes(b.name);
            return (
              <li key={b.name} className="flex items-center gap-3 px-4 py-3.5">
                <IconTile icon={b.paid ? CheckCircle : b.kind === "subscription" ? ArrowsClockwise : Receipt} tone={b.paid ? "neutral" : b.inDays <= 7 ? "amber" : "neutral"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px]">{b.name}</p>
                  <p className="truncate text-[12px] text-muted">{b.company} · {b.due}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[13.5px]">{money(b.amount)}</p>
                  <p className={`text-[11px] ${b.paid ? "text-muted" : b.inDays <= 7 ? "text-warn" : "text-muted"}`}>{b.paid ? "Paid" : `in ${b.inDays} days`}</p>
                </div>
                {!b.paid && (
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={on ? `Turn off reminder for ${b.name}` : `Remind me about ${b.name}`}
                    onClick={() => {
                      setReminders((r) => (on ? r.filter((x) => x !== b.name) : [...r, b.name]));
                      toast(on ? "Reminder removed." : `I'll remind you the day before ${b.name.toLowerCase()} is due.`);
                    }}
                    className={`grid size-9 shrink-0 place-items-center rounded-full border transition-colors ${on ? "border-accent/50 bg-accent-bg text-accent" : "border-line text-muted hover:text-ink"}`}
                  >
                    {on ? <BellRinging size={15} weight="fill" /> : <Bell size={15} />}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <p className="text-[12px] text-muted">Orbit shows what's due and can remind you. It doesn't make payments.</p>
    </div>
  );
}
