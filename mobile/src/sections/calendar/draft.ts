import { calendars, type CalEvent, type CalendarId } from "@orbit/data/calendar";
import { parse, ymd } from "@orbit/time";
import { addDays, DAY_MS, hhmm, minuteOf, toIso } from "@orbit/sections/calendar/lib";

export type Draft = {
  title: string;
  date: string;
  start: string;
  end: string;
  allDay: boolean;
  calendar: CalendarId;
  location: string;
  notes: string;
  /** Length of an all-day event, so editing a trip keeps its span. */
  days: number;
};

export const calendarList = calendars;

export function draftFrom(e: CalEvent): Draft {
  const s = parse(e.start);
  const en = parse(e.end);
  return {
    title: e.title,
    date: ymd(s),
    start: hhmm(minuteOf(s)),
    end: hhmm(minuteOf(en)),
    allDay: !!e.allDay,
    calendar: e.calendar,
    location: e.location ?? "",
    notes: e.notes ?? "",
    days: Math.max(1, Math.round((en.getTime() - s.getTime()) / DAY_MS)),
  };
}

export function blankDraft(day: Date, from: number, to = from + 60): Draft {
  return { title: "", date: ymd(day), start: hhmm(from), end: hhmm(Math.min(to, 23 * 60 + 59)), allDay: false, calendar: "personal", location: "", notes: "", days: 1 };
}

/** Turns a valid draft into the fields an event stores. */
export function eventFields(d: Draft): Pick<CalEvent, "title" | "start" | "end" | "allDay" | "calendar" | "location" | "notes"> {
  const day = parse(d.date);
  return {
    title: d.title.trim(),
    start: d.allDay ? toIso(d.date, "00:00") : toIso(d.date, d.start),
    end: d.allDay ? toIso(ymd(addDays(day, d.days)), "00:00") : toIso(d.date, d.end),
    allDay: d.allDay || undefined,
    calendar: d.calendar,
    location: d.location.trim() || undefined,
    notes: d.notes.trim() || undefined,
  };
}

export type Errors = Partial<Record<"title" | "date" | "end", string>>;

export function validate(d: Draft): Errors {
  const e: Errors = {};
  if (!d.title.trim()) e.title = "Give the event a title.";
  if (!d.date) e.date = "Choose a date.";
  if (!d.allDay && (!d.start || !d.end || d.end <= d.start)) e.end = "The end needs to be after the start.";
  return e;
}
