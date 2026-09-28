import type { CalEvent } from "../../data/calendar";
import { cx, Dot } from "../../ui";
import { time } from "../../time";
import { addDays, calTone, dayHeading, eventsOn, sameDate, weekStart, weekdayShort } from "./lib";
import { ClashMark } from "./bits";

const MAX = 3;

export function MonthGrid({
  anchor,
  monday,
  events,
  clashes,
  now,
  onOpen,
  onPickDay,
}: {
  anchor: Date;
  monday: boolean;
  events: CalEvent[];
  clashes: Set<string>;
  now: Date;
  onOpen: (id: string) => void;
  onPickDay: (d: Date) => void;
}) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = weekStart(first, monday);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const weeks = Math.ceil((Math.round((last.getTime() - start.getTime()) / 86_400_000) + 1) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));

  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line">
        {days.slice(0, 7).map((d) => (
          <div key={d.getDay()} className="px-2 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted max-sm:text-center">
            <span className="sm:hidden">{weekdayShort(d).slice(0, 1)}</span>
            <span className="max-sm:hidden">{weekdayShort(d)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const list = eventsOn(events, d);
          const inMonth = d.getMonth() === anchor.getMonth();
          const today = sameDate(d, now);
          const extra = list.length - MAX;
          return (
            <div
              key={d.getTime()}
              className={cx(
                "min-h-[68px] min-w-0 border-line sm:min-h-[112px]",
                i % 7 !== 6 && "border-r",
                i < days.length - 7 && "border-b",
                !inMonth && "bg-paper/60",
              )}
            >
              {/* Phones: the whole cell opens the day. */}
              <button
                type="button"
                onClick={() => onPickDay(d)}
                aria-label={`${dayHeading(d)}, ${list.length ? `${list.length} event${list.length > 1 ? "s" : ""}` : "nothing planned"}`}
                className="flex h-full w-full flex-col items-center gap-1.5 pt-1.5 sm:hidden"
              >
                <DayNumber d={d} today={today} inMonth={inMonth} />
                <span className="flex flex-wrap justify-center gap-[3px] px-1">
                  {list.slice(0, 4).map((e) => (
                    <Dot key={e.id} tone={calTone[e.calendar].tone} className="size-[5px]" />
                  ))}
                </span>
              </button>

              <div className="hidden h-full flex-col gap-[3px] p-1.5 sm:flex">
                <button
                  type="button"
                  onClick={() => onPickDay(d)}
                  aria-label={`Open ${dayHeading(d)}`}
                  className="mb-0.5 self-start rounded-full transition-colors hover:bg-soft"
                >
                  <DayNumber d={d} today={today} inMonth={inMonth} />
                </button>
                {list.slice(0, MAX).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onOpen(e.id)}
                    className={cx(
                      "relative flex min-w-0 items-center gap-1.5 rounded-[4px] px-1 py-[2px] text-left text-[11.5px] leading-tight transition-colors",
                      e.allDay ? cx("border-l-2 font-medium text-ink", calTone[e.calendar].rule, calTone[e.calendar].tint) : "text-ink hover:bg-soft",
                    )}
                  >
                    {!e.allDay && <Dot tone={calTone[e.calendar].tone} className="size-[6px]" />}
                    {!e.allDay && <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted">{time(e.start)}</span>}
                    <span className="truncate">{e.title}</span>
                    {clashes.has(e.id) && <ClashMark className="ml-auto" />}
                  </button>
                ))}
                {extra > 0 && (
                  <button type="button" onClick={() => onPickDay(d)} className="self-start rounded-[4px] px-1 text-[11.5px] text-muted hover:bg-soft hover:text-ink">
                    +{extra} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayNumber({ d, today, inMonth }: { d: Date; today: boolean; inMonth: boolean }) {
  return (
    <span
      className={cx(
        "grid size-6 place-items-center rounded-full text-[12.5px] tabular-nums",
        today ? "bg-accent font-medium text-paper" : inMonth ? "text-ink" : "text-faint",
      )}
    >
      {d.getDate()}
    </span>
  );
}
