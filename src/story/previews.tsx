import type { ReactNode } from "react";
import { Amount, Figure, Label, List, Panel, Row, Source, Tag } from "../orbit/ui";
import { bills } from "../orbit/data/money";
import { bookings } from "../orbit/data/plans";
import { events } from "../orbit/data/calendar";
import { messages } from "../orbit/data/mail";
import { tasks } from "../orbit/data/tasks";
import { daysFrom, inDays, relDay, time, weekday } from "../orbit/time";

/*
 * The four product chapters of the story, built from the app's own kit and sample data.
 * Nothing here reads the app store: it only uses the seed data, which is written relative to today.
 */

function Frame({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <Panel as="article" className="mt-7 w-full max-w-[420px] p-4 text-left">
      <div aria-label={title} role="group">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Label>{label}</Label>
          <Tag>Demo data</Tag>
        </div>
        {children}
      </div>
    </Panel>
  );
}

const byId = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id);

export function AskPreview() {
  const numbers = byId(tasks, "tk-numbers");
  const checkin = byId(tasks, "tk-checkin");
  const electric = byId(bills, "bill-electric");
  const mum = byId(messages, "msg-mum");
  if (!numbers || !checkin || !electric || !mum) return null;
  const items = [
    { id: numbers.id, title: numbers.title, when: relDay(numbers.due!), source: messages.find((m) => m.id === "msg-priya")?.source ?? "gmail" },
    { id: checkin.id, title: checkin.title, when: relDay(checkin.due!), source: bookings.find((b) => b.id === "bk-flight-out")?.source ?? "gmail" },
    { id: electric.id, title: electric.autopay ? `${electric.name} bill goes out, £${electric.amount.toFixed(2)}` : `Pay ${electric.name.toLowerCase()} bill`, when: relDay(electric.due), source: electric.source },
    { id: mum.id, title: "Reply to Mum about Sunday", when: `by ${weekday(3)}`, source: mum.source },
  ] as const;
  return (
    <Frame label="Ask Orbit" title="Example question and answer, with demo data">
      <p className="font-serif text-[21px] leading-[1.15] tracking-[-0.01em] text-ink">What do I need to sort by {weekday(3)}?</p>
      <p className="mb-2 mt-3 text-[13.5px] text-muted">Four things.</p>
      <List>
        {items.map((it) => (
          <Row key={it.id} className="items-start">
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] text-ink">{it.title}</p>
              <p className="mt-1 flex items-center gap-2 text-[12.5px] text-muted">
                <span>{it.when}</span>
                <Source id={it.source} />
              </p>
            </div>
          </Row>
        ))}
      </List>
    </Frame>
  );
}

export function DayPreview() {
  const picks = ["ev-standup", "ev-lunch", "ev-review"].map((id) => byId(events, id)).filter((e) => !!e);
  const pack = byId(tasks, "tk-pack");
  return (
    <Frame label="Today" title="Example day, with demo data">
      <List>
        {picks.map((e) => (
          <Row key={e.id} className="items-start">
            <span className="w-11 shrink-0 pt-px font-mono text-[12px] tabular-nums text-muted">{time(e.start)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] text-ink">{e.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                {(e.location || e.video) && <span className="truncate">{e.location ?? e.video}</span>}
                <Source id={e.source} />
              </p>
            </div>
          </Row>
        ))}
        {pack && (
          <Row className="items-start">
            <span className="w-11 shrink-0 pt-px font-mono text-[12px] text-muted">Task</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] text-ink">{pack.title}</p>
              <p className="mt-1">
                <Source id={pack.source} />
              </p>
            </div>
          </Row>
        )}
      </List>
    </Frame>
  );
}

export function MoneyPreview() {
  const upcoming = bills.filter((b) => b.status === "upcoming" && daysFrom(b.due) >= 0).sort((a, b) => a.due.localeCompare(b.due));
  const week = upcoming.filter((b) => daysFrom(b.due) <= 7);
  const total = week.reduce((sum, b) => sum + b.amount, 0);
  return (
    <Frame label="Coming up" title="Example upcoming bills, with demo data">
      <Figure label="Next 7 days" value={<Amount value={total} />} note={`${week.length} payments`} className="mb-4" />
      <List>
        {week.slice(0, 4).map((b) => (
          <Row key={b.id}>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] text-ink">{b.name}</p>
              <p className="mt-1 flex items-center gap-2 text-[12.5px] text-muted">
                <span>{inDays(b.due)}</span>
                <Source id={b.source} />
              </p>
            </div>
            <Amount value={b.amount} className="text-[13.5px] text-ink" />
          </Row>
        ))}
      </List>
    </Frame>
  );
}

export function PlansPreview() {
  const trip = bookings.filter((b) => b.tripId === "trip-edi").sort((a, b) => a.start.localeCompare(b.start));
  return (
    <Frame label="Edinburgh" title="Example trip, with demo data">
      <List>
        {trip.map((b) => (
          <Row key={b.id} className="items-start">
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] text-ink">{b.title}</p>
              <p className="mt-1 flex items-center gap-2 text-[12.5px] text-muted">
                <span>{b.provider}</span>
                <Source id={b.source} />
              </p>
            </div>
            <p className="shrink-0 text-right text-[12.5px] text-muted">
              {relDay(b.start)}
              <span className="block font-mono tabular-nums">{time(b.start)}</span>
            </p>
          </Row>
        ))}
      </List>
    </Frame>
  );
}
