import type { CalEvent } from "../../data/calendar";
import { cx, Source } from "../../ui";
import { time } from "../../time";
import { calTone, eventsOn, sameDate, weekdayShort } from "./lib";
import { ClashMark } from "./bits";

/** A plain list, day by day. The default on phones. */
export function Agenda({ days, events, clashes, now, onOpen }: { days: Date[]; events: CalEvent[]; clashes: Set<string>; now: Date; onOpen: (id: string) => void }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {days.map((d) => {
        const list = eventsOn(events, d);
        const today = sameDate(d, now);
        return (
          <li key={d.getTime()} className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[72px_minmax(0,1fr)]">
            <div className="pt-1">
              <p className={cx("font-mono text-[10.5px] uppercase tracking-[0.12em]", today ? "text-accent" : "text-muted")}>{today ? "Today" : weekdayShort(d)}</p>
              <p className={cx("font-serif text-[26px] leading-none tracking-[-0.01em] tabular-nums", today ? "text-accent" : "text-ink")}>{d.getDate()}</p>
            </div>
            {list.length ? (
              <ul className="flex min-w-0 flex-col">
                {list.map((e) => {
                  const t = calTone[e.calendar];
                  const past = !e.allDay && new Date(e.end) < now;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onOpen(e.id)}
                        className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-[7px] px-1.5 py-1.5 text-left transition-colors hover:bg-soft/60"
                      >
                        <span className="w-[42px] shrink-0 font-mono text-[11.5px] leading-tight tabular-nums text-muted sm:w-[50px]">
                          {e.allDay ? (
                            "All day"
                          ) : (
                            <>
                              {time(e.start)}
                              <span className="block text-faint">{time(e.end)}</span>
                            </>
                          )}
                        </span>
                        <span aria-hidden className={cx("w-0 self-stretch border-l-2", t.rule)} />
                        <span className={cx("min-w-0 flex-1", past && "opacity-60")}>
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[14px] text-ink">{e.title}</span>
                            {clashes.has(e.id) && <ClashMark />}
                          </span>
                          {(e.location || e.video) && (
                            <span className="block truncate text-[12.5px] text-muted">{[e.location, e.video && `${e.video} call`].filter(Boolean).join(" · ")}</span>
                          )}
                        </span>
                        <Source id={e.source} className="max-sm:hidden" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="self-center px-1.5 text-[13px] text-faint">Nothing planned</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
