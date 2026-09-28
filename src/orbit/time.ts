/**
 * Dates for the app. Sample data is written relative to "today" so the app always feels current:
 * `at(0, "09:30")` is today at 09:30, `at(-1)` is yesterday at midnight, `on(3)` is a date string.
 */

const MIN = 60_000;
const DAY = 86_400_000;

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** ISO datetime for today + `days`, at "HH:MM" local time. */
export function at(days: number, hhmm = "00:00") {
  const [h, m] = hhmm.split(":").map(Number);
  const d = startOfDay();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

/** Date-only string (YYYY-MM-DD) for today + `days`. */
export function on(days: number) {
  const d = startOfDay();
  d.setDate(d.getDate() + days);
  return ymd(d);
}

export function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Parses an ISO datetime or a YYYY-MM-DD date (as local midnight). */
export function parse(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : new Date(s);
}

/** Whole days from today to the date (negative = past). */
export function daysFrom(s: string, now = new Date()) {
  return Math.round((startOfDay(parse(s)).getTime() - startOfDay(now).getTime()) / DAY);
}

export function minutesBetween(a: string, b: string) {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / MIN);
}

/** en-GB formatting, with "Sept" written as "Sep" to match the other short months. */
const fmt = (o: Intl.DateTimeFormatOptions) => {
  const f = new Intl.DateTimeFormat("en-GB", o);
  return { format: (d: Date) => f.format(d).replace(/\bSept\b/, "Sep") };
};
const fTime = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
const fDay = fmt({ weekday: "short", day: "numeric", month: "short" });
const fLong = fmt({ weekday: "long", day: "numeric", month: "long" });
const fShort = fmt({ day: "numeric", month: "short" });
const fWeekday = fmt({ weekday: "long" });

export const time = (s: string) => fTime.format(parse(s));
export const longDate = (s: string) => fLong.format(parse(s));
export const shortDate = (s: string) => fShort.format(parse(s));
export const dayLabel = (s: string) => fDay.format(parse(s));

/** "Today", "Tomorrow", "Yesterday", weekday within a week, else "Tue 14 Oct". */
export function relDay(s: string) {
  const n = daysFrom(s);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return fWeekday.format(parse(s));
  return dayLabel(s);
}

/** "in 3 days", "tomorrow", "today", "2 days ago". */
export function inDays(s: string) {
  const n = daysFrom(s);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** Message-list style stamp: time today, weekday this week, else date. */
export function stamp(s: string) {
  const n = daysFrom(s);
  if (n === 0) return time(s);
  if (n > -7 && n < 0) return fmt({ weekday: "short" }).format(parse(s));
  return shortDate(s);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function sameDay(a: string, b: string) {
  return ymd(parse(a)) === ymd(parse(b));
}

/** Shifts every ISO date or datetime string found in a value by `days` (used to keep saved sample data current). */
export function shiftDates<T>(value: T, days: number): T {
  if (!days) return value;
  const iso = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string" && iso.test(v)) {
      const d = parse(v);
      d.setDate(d.getDate() + days);
      return v.length === 10 ? ymd(d) : d.toISOString();
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}
