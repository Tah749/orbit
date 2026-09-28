import type { Booking } from "../../data/plans";
import { cx, Tag } from "../../ui";
import { daysFrom, longDate, relDay } from "../../time";
import { itinerary, kinds, statusText, statusTone, type Step } from "./lib";

/** The status at the end of a row: quiet text when all is well, a tag when something changed. */
export function Status({ b }: { b: Booking }) {
  if (b.status === "confirmed") return <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint max-sm:hidden">{statusText[b.status]}</span>;
  return <Tag tone={statusTone[b.status]}>{statusText[b.status]}</Tag>;
}

/** One line of a travel document: time, what, who and the reference, status. */
export function StepRow({ step, onOpen, dense = false }: { step: Pick<Step, "time" | "qualifier" | "title" | "sub" | "booking">; onOpen: (id: string) => void; dense?: boolean }) {
  const b = step.booking;
  const K = kinds[b.kind];
  const off = b.status === "cancelled";
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(b.id)}
        className={cx("grid w-full grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-x-3 px-1 text-left transition-colors hover:bg-soft/60 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-x-4", dense ? "py-2.5" : "py-3.5")}
      >
        <span className="pt-px font-mono text-[13.5px] leading-5 tabular-nums text-ink">
          {step.qualifier && <span className="block text-[10px] uppercase leading-3 tracking-[0.1em] text-faint">{step.qualifier}</span>}
          {step.time}
        </span>
        <span className="min-w-0">
          <span className={cx("flex items-center gap-2 text-[14px] leading-5", off ? "text-muted line-through decoration-1" : "text-ink")}>
            <K.icon size={15} aria-label={K.name} className="shrink-0 text-faint" />
            <span className="truncate">{step.title}</span>
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-muted">{step.sub}</span>
        </span>
        <span className="pt-0.5">
          <Status b={b} />
        </span>
      </button>
    </li>
  );
}

/** A trip's bookings, day by day, set like a printed itinerary. */
export function Itinerary({ bookings, tripStart, onOpen, dense = false }: { bookings: Booking[]; tripStart: string; onOpen: (id: string) => void; dense?: boolean }) {
  const days = itinerary(bookings);
  return (
    <ol className="grid gap-8">
      {days.map((d) => {
        const n = daysFrom(d.day) - daysFrom(tripStart) + 1;
        const near = Math.abs(daysFrom(d.day)) <= 1;
        return (
          <li key={d.day}>
            <div className="flex items-baseline justify-between gap-4 border-b border-ink/70 pb-2">
              <h4 className={cx("font-serif font-normal tracking-[-0.01em] text-ink", dense ? "text-[18px]" : "text-[21px]")}>{longDate(d.day)}</h4>
              <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                {near && <span className="text-accent">{relDay(d.day)} · </span>}
                Day {n}
              </span>
            </div>
            <ul className="divide-y divide-line">
              {d.steps.map((s) => (
                <StepRow key={s.key} step={s} onOpen={onOpen} dense={dense} />
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
