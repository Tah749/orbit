import { calendars, type CalEvent, type CalendarId } from "../../data/calendar";
import { cx, Label, Source } from "../../ui";
import { calTone, duration, freeGaps, hhmm, onDay, sameDate, weekdayLetter, weekdayShort, dayHeading } from "./lib";
import { Check as CheckMark } from "@phosphor-icons/react";

/** The small coral mark on an event that overlaps another. */
export function ClashMark({ className }: { className?: string }) {
  return <span aria-hidden title="Overlaps another event" className={cx("size-[6px] shrink-0 rounded-full bg-coral ring-2 ring-surface", className)} />;
}

export function CalendarsList({ hidden, onToggle, counts }: { hidden: Set<CalendarId>; onToggle: (id: CalendarId) => void; counts: Record<CalendarId, number> }) {
  return (
    <div>
      <Label className="mb-2">Calendars</Label>
      <ul className="grid grid-cols-2 gap-x-2 lg:grid-cols-1">
        {calendars.map((c) => {
          const on = !hidden.has(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onToggle(c.id)}
                className="group flex w-full items-start gap-2.5 rounded-[7px] px-1.5 py-2 text-left transition-colors hover:bg-soft/60"
              >
                <span
                  aria-hidden
                  className={cx(
                    "mt-[2px] grid size-[14px] shrink-0 place-items-center rounded-[3px] border-[1.5px] text-paper transition-colors",
                    on ? calTone[c.id].box : "border-line-strong bg-transparent",
                  )}
                >
                  {on && <CheckMark size={9} weight="bold" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cx("text-[13.5px]", on ? "text-ink" : "text-muted")}>{c.name}</span>
                    <span className="font-mono text-[10.5px] tabular-nums text-faint">{counts[c.id] || ""}</span>
                  </span>
                  <Source id={c.source} className="mt-0.5" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A week of days to pick from, for the day and agenda views. */
export function DayStrip({ days, selected, now, events, onPick }: { days: Date[]; selected: Date; now: Date; events: CalEvent[]; onPick: (d: Date) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="Choose a day">
      {days.map((d) => {
        const sel = sameDate(d, selected);
        const today = sameDate(d, now);
        const busy = events.some((e) => onDay(e, d));
        return (
          <button
            key={d.getTime()}
            type="button"
            aria-pressed={sel}
            aria-label={dayHeading(d)}
            onClick={() => onPick(d)}
            className={cx(
              "flex h-[58px] flex-col items-center justify-center gap-1 rounded-[8px] border transition-colors",
              sel ? "border-line-strong bg-surface" : "border-transparent hover:bg-soft/60",
            )}
          >
            <span className={cx("font-mono text-[10px] uppercase tracking-[0.1em]", today ? "text-accent" : "text-faint")}>{weekdayLetter(d)}</span>
            <span className={cx("text-[15px] tabular-nums leading-none", today ? "font-medium text-accent" : "text-ink")}>{d.getDate()}</span>
            <span aria-hidden className={cx("size-1 rounded-full", busy ? (sel ? "bg-ink" : "bg-faint") : "bg-transparent")} />
          </button>
        );
      })}
    </div>
  );
}

/** "Free 10:00–12:30": gaps of an hour or more in the working day. Each one starts a new event. */
export function FreeTime({ day, events, now, onPick }: { day: Date; events: CalEvent[]; now: Date; onPick: (day: Date, from: number, to: number) => void }) {
  const today = sameDate(day, now);
  let gaps = freeGaps(events, day);
  if (today) {
    // Only what is still ahead today.
    const m = now.getHours() * 60 + now.getMinutes();
    gaps = gaps.map((g) => ({ from: Math.max(g.from, Math.ceil(m / 15) * 15), to: g.to })).filter((g) => g.to - g.from >= 60);
  }
  const past = day.getTime() + 86_400_000 <= now.getTime();
  if (past) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line pb-3">
      <Label>{today ? "Free today" : `Free ${weekdayShort(day)} ${day.getDate()}`}</Label>
      {gaps.length ? (
        gaps.map((g) => (
          <button
            key={g.from}
            type="button"
            onClick={() => onPick(day, g.from, Math.min(g.to, g.from + 60))}
            title="Add an event here"
            className="rounded-[5px] border border-line bg-surface px-2 py-1 text-[12.5px] text-ink transition-colors hover:border-line-strong"
          >
            <span className="font-mono tabular-nums">
              {hhmm(g.from)}–{hhmm(g.to)}
            </span>
            <span className="ml-1.5 text-muted">{duration(g.to - g.from)}</span>
          </button>
        ))
      ) : (
        <span className="text-[13px] text-muted">No free hour between 09:00 and 18:00{today ? " left today" : ""}.</span>
      )}
    </div>
  );
}
