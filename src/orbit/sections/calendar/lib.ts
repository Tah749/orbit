import type { CalEvent, CalendarId } from "../../data/calendar";
import type { Tone } from "../../ui";
import { parse, ymd } from "../../time";

export type View = "Day" | "Week" | "Month" | "Agenda";

/** Calendar colours: a thin rule plus a tint, never a solid block. */
export const calTone: Record<CalendarId, { tone: Tone; rule: string; tint: string; box: string }> = {
  personal: { tone: "accent", rule: "border-accent", tint: "bg-accent-bg", box: "bg-accent border-accent" },
  work: { tone: "info", rule: "border-info", tint: "bg-tint-info", box: "bg-info border-info" },
  family: { tone: "warn", rule: "border-warn", tint: "bg-tint-warn", box: "bg-warn border-warn" },
  travel: { tone: "coral", rule: "border-coral", tint: "bg-tint-coral", box: "bg-coral border-coral" },
};

export const DAY_MS = 86_400_000;

export function dayStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number) {
  const x = new Date(d.getFullYear(), d.getMonth() + n, 1);
  // Keep the day of the month where it exists (31 Jan + 1 month is 28/29 Feb).
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(d.getDate(), last));
  return x;
}

export function weekStart(d: Date, monday: boolean) {
  const x = dayStart(d);
  const offset = monday ? (x.getDay() + 6) % 7 : x.getDay();
  return addDays(x, -offset);
}

export const sameDate = (a: Date, b: Date) => ymd(a) === ymd(b);

/** Minutes since local midnight. */
export const minuteOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Does the event touch this day? All-day events use an exclusive end. */
export function onDay(e: CalEvent, day: Date) {
  const s = dayStart(day).getTime();
  const end = s + DAY_MS;
  const a = parse(e.start).getTime();
  const b = parse(e.end).getTime();
  return a < end && (b > s || (a === b && a >= s));
}

export function eventsOn(list: CalEvent[], day: Date) {
  return list.filter((e) => onDay(e, day)).sort(byStart);
}

export const byStart = (a: CalEvent, b: CalEvent) =>
  Number(!a.allDay) - Number(!b.allDay) || a.start.localeCompare(b.start) || a.end.localeCompare(b.end) || a.title.localeCompare(b.title);

/** The part of a timed event that falls on `day`, in minutes from midnight. */
export function segment(e: CalEvent, day: Date) {
  const s = dayStart(day).getTime();
  const a = Math.max(parse(e.start).getTime(), s);
  const b = Math.min(parse(e.end).getTime(), s + DAY_MS);
  return { from: (a - s) / 60_000, to: (b - s) / 60_000 };
}

export type Placed = { e: CalEvent; from: number; to: number; col: number; cols: number };

/** Lays out one day's timed events so overlapping ones sit side by side. */
export function layoutDay(list: CalEvent[], day: Date): Placed[] {
  const segs = list
    .filter((e) => !e.allDay && onDay(e, day))
    .map((e) => ({ e, ...segment(e, day), col: 0, cols: 1 }))
    .sort((a, b) => a.from - b.from || b.to - a.to);
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    cluster.forEach((p) => (p.cols = colEnds.length));
    out.push(...cluster);
    cluster = [];
    colEnds = [];
  };
  for (const p of segs) {
    // Short events still take up a readable block, so lay them out at that height.
    const to = Math.max(p.to, p.from + 20);
    if (p.from >= clusterEnd && cluster.length) flush();
    let col = colEnds.findIndex((end) => end <= p.from);
    if (col === -1) col = colEnds.push(to) - 1;
    else colEnds[col] = to;
    p.col = col;
    cluster.push(p);
    clusterEnd = Math.max(clusterEnd, to);
  }
  if (cluster.length) flush();
  return out;
}

const overlaps = (a: CalEvent, b: CalEvent) => a.id !== b.id && !a.allDay && !b.allDay && a.start < b.end && b.start < a.end;

/** Other timed events that overlap this one. */
export const clashesWith = (e: CalEvent, all: CalEvent[]) => all.filter((x) => overlaps(e, x)).sort(byStart);

/** Ids of every timed event that overlaps another. */
export function clashIds(all: CalEvent[]) {
  const ids = new Set<string>();
  const timed = all.filter((e) => !e.allDay).sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length && timed[j].start < timed[i].end; j++) {
      ids.add(timed[i].id);
      ids.add(timed[j].id);
    }
  }
  return ids;
}

/** Gaps of an hour or more between 09:00 and 18:00. */
export function freeGaps(all: CalEvent[], day: Date, from = 9 * 60, to = 18 * 60, min = 60) {
  const busy = all
    .filter((e) => !e.allDay && onDay(e, day))
    .map((e) => segment(e, day))
    .sort((a, b) => a.from - b.from);
  const gaps: { from: number; to: number }[] = [];
  let cursor = from;
  for (const b of busy) {
    if (b.to <= cursor) continue;
    if (b.from >= to) break;
    if (b.from - cursor >= min) gaps.push({ from: cursor, to: b.from });
    cursor = Math.max(cursor, b.to);
  }
  if (to - cursor >= min) gaps.push({ from: cursor, to });
  return gaps;
}

export const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function duration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

/** Local date + "HH:MM" to an ISO string. */
export const toIso = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();

const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", o);
const fDM = f({ day: "numeric", month: "long" });
const fD = f({ day: "numeric" });
const fMY = f({ month: "long", year: "numeric" });
const fDay = f({ weekday: "long", day: "numeric", month: "long" });
const withYear = (d: Date, s: string) => (d.getFullYear() === new Date().getFullYear() ? s : `${s} ${d.getFullYear()}`);

/** "13 – 19 October", "28 September – 4 October". */
export function rangeLabel(a: Date, b: Date) {
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return withYear(b, `${fD.format(a)} – ${fDM.format(b)}`);
  if (a.getFullYear() === b.getFullYear()) return withYear(b, `${fDM.format(a)} – ${fDM.format(b)}`);
  return `${fDM.format(a)} ${a.getFullYear()} – ${fDM.format(b)} ${b.getFullYear()}`;
}

export const dayHeading = (d: Date) => withYear(d, fDay.format(d));
export const monthHeading = (d: Date) => fMY.format(d);
export const weekdayShort = (d: Date) => f({ weekday: "short" }).format(d);
export const weekdayLetter = (d: Date) => f({ weekday: "narrow" }).format(d);
