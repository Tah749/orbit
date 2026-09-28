import { AirplaneTilt, Bed, Car, ForkKnife, Ticket, Train, type Icon } from "@phosphor-icons/react";
import type { Booking, BookingKind, Trip } from "../../data/plans";
import type { Task } from "../../data/tasks";
import { dayLabel, daysFrom, on, parse, relDay, time, ymd } from "../../time";

export const kinds: Record<BookingKind, { name: string; icon: Icon }> = {
  flight: { name: "Flight", icon: AirplaneTilt },
  hotel: { name: "Stay", icon: Bed },
  train: { name: "Train", icon: Train },
  restaurant: { name: "Table", icon: ForkKnife },
  event: { name: "Tickets", icon: Ticket },
  car: { name: "Car hire", icon: Car },
};

export const statusText: Record<Booking["status"], string> = {
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  changed: "Changed",
  cancelled: "Cancelled",
};

export const statusTone = { confirmed: "neutral", "checked-in": "accent", changed: "warn", cancelled: "coral" } as const;

const HOUR = 3_600_000;
const hoursUntil = (s: string) => (parse(s).getTime() - Date.now()) / HOUR;
/** "today", "tomorrow", "Thursday", "Tue 14 Oct": relDay, but lower case where it reads mid-sentence. */
export function dayWord(s: string) {
  const r = relDay(s);
  return Math.abs(daysFrom(s)) <= 1 ? r.toLowerCase() : r;
}
/** "tomorrow", "on Thursday". */
export const dayPhrase = (s: string) => (Math.abs(daysFrom(s)) <= 1 ? dayWord(s) : `on ${relDay(s)}`);
/** "BZ 1452 · LHR to EDI" → "BZ 1452". */
export const shortTitle = (b: Booking) => b.title.split(" · ")[0];
const isTransport = (b: Booking) => b.kind === "flight" || b.kind === "train";

/** When a booking finishes (or starts, if it has no end). */
export const endsAt = (b: Booking) => b.end ?? b.start;
/** "Brisa Air · Ref K7QX2M", leaving out whatever a hand-added booking doesn't have. */
export const refLine = (b: Booking, withProvider = true) => [withProvider && b.provider, b.ref && `Ref ${b.ref}`].filter(Boolean).join(" · ");
export const isPast = (b: Booking) => parse(endsAt(b)).getTime() < Date.now();

export function nights(a: string, b: string) {
  return Math.max(0, daysFrom(b) - daysFrom(a));
}

/** One line saying when a booking happens. */
export function whenText(b: Booking) {
  if (b.kind === "hotel" && b.end) {
    const n = nights(b.start, b.end);
    return `${dayLabel(b.start)} to ${dayLabel(b.end)} · ${n} ${n === 1 ? "night" : "nights"}`;
  }
  if (b.end && ymd(parse(b.end)) === ymd(parse(b.start))) return `${relDay(b.start)}, ${time(b.start)}–${time(b.end)}`;
  if (b.kind === "car" && b.end) return `${dayLabel(b.start)} ${time(b.start)} to ${dayLabel(b.end)} ${time(b.end)}`;
  return `${relDay(b.start)} at ${time(b.start)}`;
}

export function tripDates(t: Trip) {
  const n = nights(t.start, t.end);
  return `${dayLabel(t.start)} to ${dayLabel(t.end)} · ${n} ${n === 1 ? "night" : "nights"}`;
}

export function joinNames(names: string[]) {
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "Edinburgh, tomorrow", "Lisbon, in 38 days", or "In Edinburgh until Thursday". */
export function countdown(t: Trip) {
  const n = daysFrom(t.start);
  if (n <= 0) return `In ${t.title} until ${dayWord(t.end)}`;
  if (n === 1) return `${t.title}, tomorrow`;
  if (n < 7) return `${t.title} on ${relDay(t.start)}`;
  return `${t.title}, in ${n} days`;
}

/* Itinerary ----------------------------------------------------------------------------------------- */

export type Step = {
  key: string;
  booking: Booking;
  /** The date this step falls on. */
  day: string;
  /** Sort position, in ms. */
  order: number;
  time: string;
  /** "from" or "by", for hotel times that are a window rather than a moment. */
  qualifier?: string;
  title: string;
  sub: string;
};

/**
 * A trip's bookings as a sequence of steps: a stay becomes a check-in and a check-out. Hotel check-in
 * sits after the day's arrival, since that is when it actually happens, while showing the hotel's time.
 */
export function itinerary(list: Booking[]): { day: string; steps: Step[] }[] {
  const steps: Step[] = [];
  for (const b of list) {
    if (b.kind === "hotel") {
      steps.push({ key: `${b.id}-in`, booking: b, day: ymd(parse(b.start)), order: parse(b.start).getTime(), time: time(b.start), qualifier: "from", title: `Check in, ${b.title}`, sub: refLine(b, b.provider !== b.title) });
      if (b.end)
        steps.push({ key: `${b.id}-out`, booking: b, day: ymd(parse(b.end)), order: parse(b.end).getTime(), time: time(b.end), qualifier: "by", title: `Check out, ${b.title}`, sub: refLine(b, false) });
    } else if (b.kind === "car" && b.end) {
      steps.push({ key: `${b.id}-in`, booking: b, day: ymd(parse(b.start)), order: parse(b.start).getTime(), time: time(b.start), title: `Collect car, ${b.title}`, sub: refLine(b) });
      steps.push({ key: `${b.id}-out`, booking: b, day: ymd(parse(b.end)), order: parse(b.end).getTime(), time: time(b.end), qualifier: "by", title: `Return car, ${b.title}`, sub: refLine(b, false) });
    } else {
      const arrive = isTransport(b) && b.end ? ` · arrives ${time(b.end)}` : "";
      steps.push({ key: b.id, booking: b, day: ymd(parse(b.start)), order: parse(b.start).getTime(), time: time(b.start), title: b.title, sub: `${refLine(b)}${arrive}` });
    }
  }
  // Move each check-in after that day's arrivals.
  for (const s of steps) {
    if (s.qualifier !== "from") continue;
    const arrivals = list.filter((b) => isTransport(b) && b.end && ymd(parse(b.end)) === s.day && b.status !== "cancelled");
    const last = Math.max(0, ...arrivals.map((b) => parse(b.end!).getTime()));
    if (last > s.order) s.order = last + 1;
  }
  steps.sort((a, b) => a.order - b.order);
  const days: { day: string; steps: Step[] }[] = [];
  for (const s of steps) {
    const d = days.find((x) => x.day === s.day);
    if (d) d.steps.push(s);
    else days.push({ day: s.day, steps: [s] });
  }
  return days;
}

/* Timely prompts -------------------------------------------------------------------------------------- */

export type Prompt = { key: string; booking: Booking; title: string; detail: string; task: { title: string; due: string } };

const dueBefore = (s: string) => {
  const n = daysFrom(s) - 1;
  return on(Math.max(0, n));
};

/** Things worth doing soon for these bookings: check-in, seats, check-out. */
export function prompts(list: Booking[]): Prompt[] {
  const out: Prompt[] = [];
  for (const b of list) {
    if (b.status === "cancelled" || isPast(b)) continue;
    const h = hoursUntil(b.start);
    if (b.kind === "flight" && b.status !== "checked-in" && h > 0 && h <= 48) {
      out.push({
        key: `${b.id}-checkin`,
        booking: b,
        title: "Check-in is open",
        detail: `${shortTitle(b)} leaves ${dayPhrase(b.start)} at ${time(b.start)}`,
        task: { title: `Check in for ${shortTitle(b)}`, due: on(0) },
      });
    }
    const seats = b.details.find(([k]) => k === "Seats")?.[1];
    if (b.kind === "flight" && seats && /not chosen/i.test(seats) && h > 0) {
      out.push({
        key: `${b.id}-seats`,
        booking: b,
        title: "Seats not chosen",
        detail: `${shortTitle(b)} on ${dayLabel(b.start)}`,
        task: { title: `Choose seats for ${shortTitle(b)}`, due: dueBefore(b.start) },
      });
    }
    if (b.kind === "hotel" && b.end && daysFrom(b.start) <= 3) {
      out.push({
        key: `${b.id}-checkout`,
        booking: b,
        title: `Check-out by ${time(b.end)}`,
        detail: `${b.title}, ${dayPhrase(b.end)}`,
        task: { title: `Check out of ${b.title} by ${time(b.end)}`, due: ymd(parse(b.end)) },
      });
    }
  }
  const rank = (p: Prompt) => ["checkin", "seats", "checkout"].indexOf(p.key.split("-").pop()!);
  return out.sort((a, b) => rank(a) - rank(b));
}

/** The reminder offered by "Add to tasks" in the booking sheet. */
export function reminderFor(b: Booking): { title: string; due: string } {
  const day = ymd(parse(b.start));
  switch (b.kind) {
    case "flight":
      return { title: `Check in for ${shortTitle(b)}`, due: dueBefore(b.start) };
    case "train":
      return { title: `Get tickets ready for ${b.title}`, due: dueBefore(b.start) };
    case "hotel":
      return { title: `Check out of ${b.title} by ${time(endsAt(b))}`, due: ymd(parse(endsAt(b))) };
    case "restaurant":
      return { title: `Confirm the table at ${b.title}`, due: dueBefore(b.start) };
    case "car":
      return { title: `Bring licence for ${b.provider} car hire`, due: dueBefore(b.start) };
    default:
      return { title: `Tickets for ${b.title}`, due: day };
  }
}

/** An open task already made from this booking, if any. */
export const openTaskFor = (tasks: Task[], id: string, title?: string) =>
  tasks.find((t) => !t.done && t.from?.kind === "booking" && t.from.id === id && (!title || t.title === title));
