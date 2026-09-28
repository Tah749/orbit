import type { ReactNode } from "react";
import { ArrowUpRight, VideoCamera } from "@phosphor-icons/react";
import { calendars, type CalEvent } from "../../data/calendar";
import type { Ref } from "../../data/sources";
import { useDB, type DB } from "../../store";
import { href } from "../../router";
import { Avatar, Dot, Facts, Label, Source } from "../../ui";
import { longDate, minutesBetween, parse, shortDate, time } from "../../time";
import { addDays, calTone, clashesWith, duration } from "./lib";

const kinds: Record<Ref["kind"], { label: string; path: string }> = {
  message: { label: "Email", path: "inbox" },
  event: { label: "Event", path: "calendar" },
  task: { label: "Task", path: "tasks" },
  bill: { label: "Bill", path: "money/bills" },
  booking: { label: "Booking", path: "plans" },
  order: { label: "Delivery", path: "deliveries" },
  doc: { label: "Document", path: "admin" },
  contact: { label: "Person", path: "people" },
  txn: { label: "Payment", path: "money" },
};

function refTitle(d: DB, r: Ref): string | undefined {
  switch (r.kind) {
    case "message":
      return d.messages.find((x) => x.id === r.id)?.subject;
    case "event":
      return d.events.find((x) => x.id === r.id)?.title;
    case "task":
      return d.tasks.find((x) => x.id === r.id)?.title;
    case "bill":
      return d.bills.find((x) => x.id === r.id)?.name;
    case "booking":
      return d.bookings.find((x) => x.id === r.id)?.title;
    case "order":
      return d.orders.find((x) => x.id === r.id)?.items[0]?.name;
    case "doc":
      return d.docs.find((x) => x.id === r.id)?.title;
    case "contact":
      return d.contacts.find((x) => x.id === r.id)?.name;
    case "txn":
      return d.txns.find((x) => x.id === r.id)?.merchant;
  }
}

/** "Tuesday 29 September · 16:20–17:45", or a span for multi-day all-day events. */
export function whenLabel(e: CalEvent) {
  if (e.allDay) {
    const last = addDays(parse(e.end), -1);
    const days = Math.round(minutesBetween(e.start, e.end) / 1440);
    return days > 1 ? `${shortDate(e.start)} – ${shortDate(last.toISOString())} · ${days} days` : `${longDate(e.start)} · All day`;
  }
  return `${longDate(e.start)} · ${time(e.start)}–${time(e.end)}`;
}

export function EventDetails({ e, onOpen }: { e: CalEvent; onOpen: (id: string) => void }) {
  const all = useDB((d) => d.events);
  const people = useDB((d) => d.contacts);
  const titles = useDB((d) => (e.links ?? []).map((r) => refTitle(d, r)));
  const clashes = clashesWith(e, all);
  const cal = calendars.find((c) => c.id === e.calendar)!;
  const mins = minutesBetween(e.start, e.end);

  const facts: [string, ReactNode][] = [
    [
      "Calendar",
      <span className="inline-flex items-center gap-2">
        <Dot tone={calTone[e.calendar].tone} />
        {cal.name}
      </span>,
    ],
  ];
  if (e.location) facts.push(["Where", e.location]);
  if (e.video)
    facts.push([
      "Call",
      <span className="inline-flex items-center gap-1.5">
        <VideoCamera size={15} className="text-faint" />
        {e.video} · link in the invite
      </span>,
    ]);
  facts.push(["From", <Source id={e.source} className="align-middle" />]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[14.5px] text-ink">{whenLabel(e)}</p>
        {!e.allDay && <p className="mt-0.5 font-mono text-[12px] tabular-nums text-muted">{duration(mins)}</p>}
      </div>

      {clashes.length > 0 && (
        <div className="rounded-[7px] border-l-2 border-coral bg-tint-coral px-3 py-2.5 text-[13px] leading-relaxed text-ink">
          <p>
            Overlaps with{" "}
            {clashes.map((c, i) => (
              <span key={c.id}>
                {i > 0 && (i === clashes.length - 1 ? " and " : ", ")}
                <button type="button" onClick={() => onOpen(c.id)} className="font-medium underline decoration-coral/40 underline-offset-2 hover:decoration-coral">
                  {c.title}
                </button>{" "}
                <span className="font-mono text-[11.5px] tabular-nums text-muted">
                  {time(c.start)}–{time(c.end)}
                </span>
              </span>
            ))}
            .
          </p>
        </div>
      )}

      <Facts items={facts} />

      {!!e.attendees?.length && (
        <div>
          <Label className="mb-2">With</Label>
          <ul className="flex flex-col gap-2">
            {e.attendees.map((name) => {
              const ct = people.find((c) => c.name === name);
              const inner = (
                <>
                  <Avatar name={name} size={24} />
                  <span className="text-[13.5px] text-ink">{name}</span>
                </>
              );
              return (
                <li key={name}>
                  {ct ? (
                    <a href={href(`people/${ct.id}`)} className="inline-flex items-center gap-2.5 rounded-[5px] hover:underline hover:decoration-line-strong hover:underline-offset-4">
                      {inner}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2.5">{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {e.notes && (
        <div>
          <Label className="mb-2">Notes</Label>
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink">{e.notes}</p>
        </div>
      )}

      {!!e.links?.length && (
        <div>
          <Label className="mb-2">Linked</Label>
          <ul className="divide-y divide-line border-y border-line">
            {e.links.map((r, i) => (
              <li key={r.kind + r.id}>
                <a href={href(`${kinds[r.kind].path}/${r.id}`)} className="group flex min-h-11 items-center gap-3 px-1 py-2 transition-colors hover:bg-soft/60">
                  <span className="w-16 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{kinds[r.kind].label}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{titles[i] ?? "Open"}</span>
                  <ArrowUpRight size={14} className="text-faint group-hover:text-muted" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
