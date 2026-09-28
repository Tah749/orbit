import { useEffect, useRef, type MouseEvent } from "react";
import type { CalEvent } from "../../data/calendar";
import { cx } from "../../ui";
import { time } from "../../time";
import { calTone, dayHeading, hhmm, layoutDay, minuteOf, onDay, sameDate, weekdayShort, type Placed } from "./lib";
import { ClashMark } from "./bits";

const HH = 44; // pixels per hour
const hours = Array.from({ length: 24 }, (_, h) => h);

/** Day and week view: an all-day row, then a scrolling 24-hour grid that opens at 07:00. */
export function TimeGrid({
  days,
  events,
  clashes,
  now,
  focus,
  onOpen,
  onCreate,
  onPickDay,
}: {
  days: Date[];
  events: CalEvent[];
  clashes: Set<string>;
  now: Date;
  focus?: CalEvent;
  onOpen: (id: string) => void;
  onCreate: (day: Date, minute: number) => void;
  onPickDay: (day: Date) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const single = days.length === 1;
  const cols = `52px repeat(${days.length}, minmax(0, 1fr))`;
  const key = days.map((d) => d.getTime()).join();

  // Open at 07:00, or earlier if the event we were sent to starts before then.
  const focusMin = focus && !focus.allDay ? minuteOf(new Date(focus.start)) : null;
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const top = Math.min(7 * 60, focusMin !== null ? Math.max(0, focusMin - 60) : 7 * 60);
    el.scrollTop = (top / 60) * HH - 6;
  }, [key, focusMin]);

  const slotClick = (day: Date, h: number) => (e: MouseEvent<HTMLButtonElement>) => {
    const half = e.nativeEvent.offsetY > HH / 2 ? 30 : 0;
    onCreate(day, Math.min(h * 60 + half, 23 * 60));
  };

  const allDay = days.map((d) => events.filter((e) => e.allDay && onDay(e, d)));

  return (
    <div
      ref={scroller}
      className="relative h-[min(720px,max(440px,calc(100dvh-280px)))] overflow-auto overscroll-contain rounded-[10px] border border-line bg-surface"
    >
      <div style={{ minWidth: single ? undefined : 680 }}>
        <div className="sticky top-0 z-30 grid border-b border-line bg-surface" style={{ gridTemplateColumns: cols }}>
          {!single && (
            <>
              <div className="sticky left-0 z-10 bg-surface" />
              {days.map((d) => {
                const today = sameDate(d, now);
                return (
                  <button
                    key={d.getTime()}
                    type="button"
                    onClick={() => onPickDay(d)}
                    aria-label={`Open ${dayHeading(d)}`}
                    className="flex items-center justify-center gap-1.5 border-l border-line py-2 transition-colors hover:bg-soft/60"
                  >
                    <span className={cx("font-mono text-[10.5px] uppercase tracking-[0.12em]", today ? "text-accent" : "text-muted")}>{weekdayShort(d)}</span>
                    <span
                      className={cx(
                        "grid size-6 place-items-center rounded-full text-[13px] tabular-nums",
                        today ? "bg-accent font-medium text-paper" : "text-ink",
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </>
          )}
          <div className={cx("sticky left-0 z-10 flex items-start justify-end bg-surface pr-2 pt-1.5", !single && "border-t border-line")}>
            <span className="whitespace-nowrap font-mono text-[9.5px] uppercase tracking-[0.04em] text-faint">All day</span>
          </div>
          {allDay.map((list, i) => (
            <div key={i} className={cx("flex min-h-[30px] min-w-0 flex-col gap-0.5 border-l border-line p-1", !single && "border-t")}>
              {list.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpen(e.id)}
                  className={cx("truncate rounded-[4px] border-l-2 px-1.5 py-[3px] text-left text-[11.5px] font-medium text-ink", calTone[e.calendar].rule, calTone[e.calendar].tint)}
                >
                  {e.title}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="grid" style={{ gridTemplateColumns: cols, height: 24 * HH }}>
          <div className="sticky left-0 z-20 bg-surface" aria-hidden>
            <div className="relative h-full">
            {hours.slice(1).map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 font-mono text-[10px] tabular-nums text-faint" style={{ top: h * HH }}>
                {hhmm(h * 60)}
              </span>
            ))}
            </div>
          </div>
          {days.map((d) => (
            <DayColumn key={d.getTime()} day={d} events={events} clashes={clashes} now={now} onOpen={onOpen} slotClick={slotClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  day,
  events,
  clashes,
  now,
  onOpen,
  slotClick,
}: {
  day: Date;
  events: CalEvent[];
  clashes: Set<string>;
  now: Date;
  onOpen: (id: string) => void;
  slotClick: (day: Date, h: number) => (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const today = sameDate(day, now);
  const placed = layoutDay(events, day);
  const label = dayHeading(day);
  return (
    <div className={cx("relative border-l border-line", today && "bg-accent-bg/35")}>
      {hours.map((h) => (
        <button
          key={h}
          type="button"
          tabIndex={-1}
          aria-label={`New event, ${label} at ${hhmm(h * 60)}`}
          onClick={slotClick(day, h)}
          className={cx("absolute inset-x-0 cursor-cell hover:bg-soft/50", h > 0 && "border-t border-line")}
          style={{ top: h * HH, height: HH }}
        />
      ))}
      {placed.map((p) => (
        <Block key={p.e.id} p={p} clash={clashes.has(p.e.id)} onOpen={onOpen} />
      ))}
      {today && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 z-20" style={{ top: (minuteOf(now) / 60) * HH }}>
          <div className="h-px bg-accent" />
          <div className="absolute -left-[3.5px] -top-[3px] size-[7px] rounded-full bg-accent" />
        </div>
      )}
    </div>
  );
}

function Block({ p, clash, onOpen }: { p: Placed; clash: boolean; onOpen: (id: string) => void }) {
  const { e } = p;
  const top = (p.from / 60) * HH;
  const height = Math.max(((p.to - p.from) / 60) * HH - 2, 19);
  const compact = height < 36;
  // Side-by-side blocks are narrow: give the title the room and keep the time short.
  const narrow = p.cols > 1;
  const titleLines = compact ? 1 : Math.min(narrow ? 4 : 3, Math.max(1, Math.floor((height - 8 - 13) / 15)));
  const showPlace = !compact && !narrow && !!e.location && height - 8 - 13 - titleLines * 15 >= 14;
  const t = calTone[e.calendar];
  const range = `${time(e.start)}–${time(e.end)}`;
  return (
    <button
      type="button"
      onClick={() => onOpen(e.id)}
      aria-label={`${e.title}, ${range}${clash ? ", overlaps another event" : ""}`}
      className={cx(
        "absolute z-10 flex min-w-0 overflow-hidden rounded-[5px] border-l-2 px-1.5 text-left outline-offset-1 transition-[filter] hover:brightness-[0.97]",
        compact ? "items-center gap-1.5 py-0" : "flex-col py-1",
        t.rule,
        t.tint,
      )}
      style={{
        top: top + 1,
        height,
        left: `calc(${(p.col / p.cols) * 100}% + 2px)`,
        width: `calc(${100 / p.cols}% - 4px)`,
      }}
    >
      {clash && <ClashMark className="absolute right-1 top-1" />}
      <span
        className={cx("min-w-0 break-words text-[12px] font-medium leading-[15px] text-ink", compact ? "flex-1 truncate" : "shrink-0", clash && "pr-2")}
        style={compact ? undefined : { display: "-webkit-box", WebkitLineClamp: titleLines, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {e.title}
      </span>
      {(!compact || !narrow) && (
        <span className="shrink-0 whitespace-nowrap font-mono text-[10.5px] leading-[13px] tabular-nums text-muted">{compact || narrow ? time(e.start) : range}</span>
      )}
      {showPlace && <span className="mt-px truncate text-[11.5px] leading-[14px] text-muted">{e.location}</span>}
    </button>
  );
}
