import { useState, type FormEvent } from "react";
import { calendars, type CalEvent, type CalendarId } from "../../data/calendar";
import { Field, Input, Select, Switch, Textarea } from "../../ui";
import { parse, ymd } from "../../time";
import { addDays, DAY_MS, hhmm, minuteOf, toIso } from "./lib";

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

type Errors = Partial<Record<"title" | "date" | "end", string>>;

function validate(d: Draft): Errors {
  const e: Errors = {};
  if (!d.title.trim()) e.title = "Give the event a title.";
  if (!d.date) e.date = "Choose a date.";
  if (!d.allDay && (!d.start || !d.end || d.end <= d.start)) e.end = "The end needs to be after the start.";
  return e;
}

export function EventForm({ id, initial, onSubmit }: { id: string; initial: Draft; onSubmit: (d: Draft) => void }) {
  const [d, setD] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const set = (patch: Partial<Draft>) => {
    const next = { ...d, ...patch };
    setD(next);
    // Once someone has tried to save, keep the messages in step with what they type.
    if (Object.keys(errors).length) setErrors(validate(next));
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate(d);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.getElementById(`${id}-${Object.keys(e)[0]}`);
      first?.focus();
      return;
    }
    onSubmit(d);
  };

  return (
    <form id={id} onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Title">
        <Input
          id={`${id}-title`}
          value={d.title}
          autoFocus
          placeholder="Dinner with Ella"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? `${id}-title-err` : undefined}
          onChange={(e) => set({ title: e.target.value })}
        />
      </Field>
      {errors.title && <Err id={`${id}-title-err`}>{errors.title}</Err>}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <Field label="Date">
          <Input id={`${id}-date`} type="date" value={d.date} aria-invalid={!!errors.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
        <label className="flex h-9 items-center gap-2.5 text-[13.5px] text-ink">
          All day
          <Switch label="All day" checked={d.allDay} onChange={(v) => set({ allDay: v })} />
        </label>
      </div>
      {errors.date && <Err>{errors.date}</Err>}

      {!d.allDay && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Starts">
              <Input type="time" value={d.start} onChange={(e) => set({ start: e.target.value })} />
            </Field>
            <Field label="Ends">
              <Input
                id={`${id}-end`}
                type="time"
                value={d.end}
                aria-invalid={!!errors.end}
                aria-describedby={errors.end ? `${id}-end-err` : undefined}
                onChange={(e) => set({ end: e.target.value })}
              />
            </Field>
          </div>
          {errors.end && <Err id={`${id}-end-err`}>{errors.end}</Err>}
        </>
      )}

      <Field label="Calendar">
        <Select value={d.calendar} onChange={(e) => set({ calendar: e.target.value as CalendarId })}>
          {calendars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Location">
        <Input value={d.location} placeholder="Optional" onChange={(e) => set({ location: e.target.value })} />
      </Field>
      <Field label="Notes">
        <Textarea value={d.notes} placeholder="Optional" onChange={(e) => set({ notes: e.target.value })} />
      </Field>
    </form>
  );
}

function Err({ id, children }: { id?: string; children: string }) {
  return (
    <p id={id} role="alert" className="-mt-2 text-[12.5px] text-coral">
      {children}
    </p>
  );
}
