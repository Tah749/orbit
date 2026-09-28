import { useState, type FormEvent, type ReactNode } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { db, newId, useDB } from "../../store";
import { useRoute } from "../../router";
import type { Workout } from "../../data/life";
import { Bars, Button, Empty, Field, IconButton, Input, Label, List, Page, Row, Section, Segmented, Select, Sheet, Source, toast } from "../../ui";
import { daysFrom, on, parse, relDay, time } from "../../time";
import { avg, compare, hm, kindLabel, summary, weeks } from "./words";

const initial = new Intl.DateTimeFormat("en-GB", { weekday: "narrow" });
const num = new Intl.NumberFormat("en-GB");

/* Charts ------------------------------------------------------------------------------------------- */

/** A quiet line that stretches to its container. The range is padded so small day-to-day changes stay small. */
function Line({ values, pad, height = 72 }: { values: number[]; pad: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - pad;
  const max = Math.max(...values) + pad;
  const y = (v: number) => 100 - ((v - min) / (max - min || 1)) * 100;
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * 100).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <div className="relative" style={{ height }} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible text-accent">
        <line x1="0" x2="100" y1="100" y2="100" className="stroke-line" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute right-0 size-[7px] -translate-y-1/2 translate-x-1/2 rounded-full bg-accent" style={{ top: `${y(last)}%` }} />
    </div>
  );
}

function Metric({ label, value, unit, note, children }: { label: string; value: ReactNode; unit: string; note: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-t border-line pt-4">
      <Label>{label}</Label>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[26px] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">{value}</span>
        <span className="text-[13px] text-muted">{unit}</span>
      </p>
      <p className="mt-1.5 text-[12.5px] text-muted">{note}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Metrics() {
  const daily = useDB((d) => d.daily);
  const { now, before, all } = weeks(daily);
  if (!all.length) return <Empty title="No activity yet">Steps, sleep and heart rate appear here once Apple Health has something to share.</Empty>;
  const labels = all.map((d) => initial.format(parse(d.date)));
  const today = all.length - 1;
  const a = (k: "steps" | "sleepMin" | "restingHr" | "activeMin", xs = now) => avg(xs.map((d) => d[k]));
  return (
    <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
      <Metric
        label="Steps"
        value={num.format(Math.round(a("steps") / 10) * 10)}
        unit="a day this week"
        note={compare(a("steps"), a("steps", before), { unit: (n) => `About ${num.format(Math.round(n / 100) * 100)}`, per: "a day", same: 250, less: "fewer" })}
      >
        <Bars values={all.map((d) => d.steps)} highlight={today} labels={labels} height={84} />
      </Metric>
      <Metric
        label="Sleep"
        value={hm(a("sleepMin"))}
        unit="a night this week"
        note={compare(a("sleepMin"), a("sleepMin", before), { unit: (n) => `About ${Math.round(n)} minutes`, per: "a night", same: 10 })}
      >
        <Bars values={all.map((d) => d.sleepMin)} highlight={today} labels={labels} height={84} />
      </Metric>
      <Metric
        label="Resting heart rate"
        value={Math.round(a("restingHr"))}
        unit="bpm on average"
        note={compare(a("restingHr"), a("restingHr", before), { unit: (n) => `${Math.round(n)} bpm`, per: "on average", same: 1, more: "higher", less: "lower" })}
      >
        <Line values={all.map((d) => d.restingHr)} pad={6} height={68} />
        <div className="mt-1 flex justify-between font-mono text-[9.5px] text-faint">
          <span>{relDay(all[0].date)}</span>
          <span>Today</span>
        </div>
      </Metric>
      <Metric
        label="Active minutes"
        value={Math.round(a("activeMin"))}
        unit="minutes a day"
        note={compare(a("activeMin"), a("activeMin", before), { unit: (n) => `About ${Math.round(n)} minutes`, per: "a day", same: 3 })}
      >
        <Bars values={all.map((d) => d.activeMin)} highlight={today} labels={labels} height={84} />
      </Metric>
    </div>
  );
}

/* Workouts ----------------------------------------------------------------------------------------- */

type Filter = "All" | string;

function WorkoutRow({ w, active }: { w: Workout; active: boolean }) {
  const remove = () => {
    db.remove("workouts", w.id);
    toast("Workout removed", { label: "Undo", run: () => db.insert("workouts", w) });
  };
  return (
    <Row active={active} className="min-h-[52px]">
      <span className="w-[68px] shrink-0 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{kindLabel[w.kind][0]}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-ink">{w.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
          <span>
            {relDay(w.date)}, {time(w.date)}
          </span>
          <span className="sm:hidden">
            <Source id={w.source} />
          </span>
        </p>
      </div>
      <div className="shrink-0 text-right text-[13.5px] tabular-nums">
        <p className="text-ink">{w.minutes} min</p>
        {w.km !== undefined && <p className="text-[12.5px] text-muted">{w.km} km</p>}
      </div>
      <span className="hidden w-[104px] justify-end sm:flex">
        <Source id={w.source} />
      </span>
      <span className="w-9 shrink-0">
        {w.source === "manual" && (
          <IconButton label={`Remove ${w.title}`} onClick={remove}>
            <Trash size={16} />
          </IconButton>
        )}
      </span>
    </Row>
  );
}

function Workouts({ onLog, focus }: { onLog: () => void; focus?: string }) {
  const list = useDB((d) => d.workouts);
  const [filter, setFilter] = useState<Filter>("All");
  const kinds = (Object.keys(kindLabel) as Workout["kind"][]).filter((k) => list.some((w) => w.kind === k));
  const items = ["All", ...kinds.map((k) => kindLabel[k][1])];
  const shown = list.filter((w) => filter === "All" || kindLabel[w.kind][1] === filter).sort((a, b) => b.date.localeCompare(a.date));
  const week = list.filter((w) => daysFrom(w.date) > -7 && daysFrom(w.date) <= 0);
  return (
    <Section
      title="Workouts"
      meta={week.length ? `${week.length} ${week.length === 1 ? "workout" : "workouts"} this week, ${hm(week.reduce((s, w) => s + w.minutes, 0))} in all` : undefined}
      action={
        <Button variant="ghost" size="sm" onClick={onLog} className="-mr-2.5">
          <Plus size={14} /> Log
        </Button>
      }
    >
      {kinds.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented label="Show" items={items} value={items.includes(filter) ? filter : "All"} onChange={setFilter} />
        </div>
      )}
      {shown.length ? (
        <List>
          {shown.map((w) => (
            <WorkoutRow key={w.id} w={w} active={focus === w.id} />
          ))}
        </List>
      ) : (
        <Empty title="No workouts yet" action={<Button onClick={onLog}>Log a workout</Button>}>
          Workouts from Strava and Apple Health appear here, along with any you add.
        </Empty>
      )}
    </Section>
  );
}

/* Log a workout ------------------------------------------------------------------------------------ */

const hasDistance = (k: Workout["kind"]) => k === "run" || k === "ride" || k === "walk" || k === "swim";
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function LogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<Workout["kind"]>("run");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(on(0));
  const [start, setStart] = useState(nowHHMM);
  const [minutes, setMinutes] = useState("");
  const [km, setKm] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setDate(on(0));
    setStart(nowHHMM());
    setMinutes("");
    setKm("");
    setError("");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const mins = Math.round(Number(minutes));
    if (!mins || mins < 1 || mins > 1440) return setError("Add how long it lasted, in minutes.");
    const when = new Date(`${date}T${start || "12:00"}`);
    if (Number.isNaN(when.getTime())) return setError("Check the date and time.");
    if (when.getTime() > Date.now() + 60_000) return setError("That time is still to come. Log workouts once they're done.");
    const distance = hasDistance(kind) && km ? Math.round(Number(km) * 100) / 100 : undefined;
    const w: Workout = {
      id: newId("wo"),
      date: when.toISOString(),
      kind,
      title: title.trim() || kindLabel[kind][0],
      minutes: mins,
      ...(distance && distance > 0 ? { km: distance } : {}),
      source: "manual",
    };
    db.insert("workouts", w);
    toast("Workout logged", { label: "Undo", run: () => db.remove("workouts", w.id) });
    reset();
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log a workout"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="log-workout">
            Save workout
          </Button>
        </>
      }
    >
      <form id="log-workout" onSubmit={submit} className="grid gap-5" noValidate>
        <Field label="Kind">
          <Select value={kind} onChange={(e) => setKind(e.target.value as Workout["kind"])}>
            {(Object.keys(kindLabel) as Workout["kind"][]).map((k) => (
              <option key={k} value={k}>
                {kindLabel[k][0]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title" hint="Optional">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "run" ? "Morning run" : kind === "strength" ? "Full body" : kindLabel[kind][0]} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <Input type="date" value={date} max={on(0)} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Start time">
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Minutes">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                setError("");
              }}
              required
              aria-invalid={!!error || undefined}
            />
          </Field>
          {hasDistance(kind) && (
            <Field label="Distance (km)" hint="Optional">
              <Input type="number" inputMode="decimal" min={0} step="0.1" value={km} onChange={(e) => setKm(e.target.value)} />
            </Field>
          )}
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-coral">
            {error}
          </p>
        )}
        <p className="text-[12.5px] text-muted">Saved in this browser only, marked as added by you.</p>
      </form>
    </Sheet>
  );
}

/* Page --------------------------------------------------------------------------------------------- */

export default function HealthPage() {
  const daily = useDB((d) => d.daily);
  const workouts = useDB((d) => d.workouts);
  const [logging, setLogging] = useState(false);
  const { rest } = useRoute();
  const line = summary(daily, workouts);

  return (
    <Page
      eyebrow="Wellbeing"
      title="Health"
      lede={
        <>
          The last 14 days of activity and rest.
          <span className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            <Source id="apple-health" />
            <Source id="strava" />
          </span>
        </>
      }
      actions={
        <Button variant="primary" onClick={() => setLogging(true)}>
          Log a workout
        </Button>
      }
    >
      <p className="max-w-[52ch] font-serif text-[22px] leading-snug tracking-[-0.01em] text-ink md:text-[26px]">{line}</p>
      <div className="mt-8">
        <Metrics />
      </div>
      <div className="mt-12">
        <Workouts onLog={() => setLogging(true)} focus={rest[0]} />
      </div>
      <p className="mt-12 border-t border-line pt-4 text-[12.5px] text-muted">Orbit summarises data from your connected apps. It isn't medical advice.</p>
      <LogSheet open={logging} onClose={() => setLogging(false)} />
    </Page>
  );
}
