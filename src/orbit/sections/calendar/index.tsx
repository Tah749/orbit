import { useEffect, useMemo, useRef, useState } from "react";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import { calendars, type CalEvent, type CalendarId } from "../../data/calendar";
import { db, newId, useDB } from "../../store";
import { go, useRoute } from "../../router";
import { Button, IconButton, Kbd, Label, Page, Segmented, Sheet, toast } from "../../ui";
import { parse } from "../../time";
import { addDays, addMonths, clashIds, dayHeading, dayStart, minuteOf, monthHeading, onDay, rangeLabel, weekStart, type View } from "./lib";
import { TimeGrid } from "./TimeGrid";
import { MonthGrid } from "./MonthGrid";
import { Agenda } from "./Agenda";
import { CalendarsList, DayStrip, FreeTime } from "./bits";
import { EventDetails } from "./EventDetails";
import { blankDraft, draftFrom, EventForm, eventFields, type Draft } from "./EventForm";

const views: View[] = ["Day", "Week", "Month", "Agenda"];
const isPhone = () => window.matchMedia("(max-width: 767px)").matches;

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** The days a view shows. */
function daysFor(view: View, anchor: Date, monday: boolean): Date[] {
  if (view === "Day") return [anchor];
  if (view === "Month") {
    const n = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => new Date(anchor.getFullYear(), anchor.getMonth(), i + 1));
  }
  const first = view === "Week" ? weekStart(anchor, monday) : anchor;
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

const within = (days: Date[], d: Date) => d >= days[0] && d < addDays(days[days.length - 1], 1);

function summary(list: CalEvent[], clashes: Set<string>) {
  if (!list.length) return "Nothing planned.";
  const n = list.length;
  const c = list.filter((e) => clashes.has(e.id)).length;
  return `${n} ${n === 1 ? "event" : "events"}${c ? `, ${c} overlapping` : ""}.`;
}

export default function CalendarPage() {
  const now = useNow();
  const route = useRoute();
  const all = useDB((d) => d.events);
  const monday = useDB((d) => d.settings.weekStartsMonday);

  const [view, setView] = useState<View>(() => (isPhone() ? "Agenda" : "Week"));
  const [anchor, setAnchor] = useState(() => dayStart(new Date()));
  const [hidden, setHidden] = useState<Set<CalendarId>>(() => new Set());
  const [draft, setDraft] = useState<{ key: number; d: Draft } | null>(null);
  const [editing, setEditing] = useState(false);

  const visible = useMemo(() => all.filter((e) => !hidden.has(e.calendar)), [all, hidden]);
  const clashes = useMemo(() => clashIds(all), [all]);
  const days = daysFor(view, anchor, monday);
  const inRange = visible.filter((e) => days.some((d) => onDay(e, d)));

  // The open event comes from the address: #/app/calendar/<eventId>.
  const openId = route.rest[0];
  const open = openId ? all.find((e) => e.id === openId) : undefined;
  const lastOpen = useRef<CalEvent | undefined>(undefined);
  if (open) lastOpen.current = open;
  const shown = open ?? lastOpen.current;

  useEffect(() => {
    if (!openId) return;
    const e = db.find("events", openId);
    if (!e) {
      go("calendar");
      return;
    }
    const d = dayStart(parse(e.start));
    setAnchor((a) => (within(daysFor(view, a, monday), d) ? a : d));
    setHidden((h) => (h.has(e.calendar) ? new Set([...h].filter((x) => x !== e.calendar)) : h));
    setEditing(false);
    // Only when a different event is asked for; not when the view changes.
  }, [openId]);

  const openEvent = (id: string) => go(`calendar/${id}`);
  const closeEvent = () => {
    setEditing(false);
    go("calendar");
  };

  const step = (dir: 1 | -1) =>
    setAnchor((a) => (view === "Month" ? addMonths(a, dir) : addDays(a, dir * (view === "Day" ? 1 : 7))));
  const toToday = () => setAnchor(dayStart(new Date()));
  const pickDay = (d: Date) => {
    setAnchor(dayStart(d));
    setView("Day");
  };

  const newEvent = (day?: Date, from?: number, to?: number) => {
    let d = day;
    let start = from;
    if (!d) {
      const today = dayStart(new Date());
      d = view === "Day" || view === "Agenda" ? anchor : within(days, today) ? today : days[0];
      start = d.getTime() === today.getTime() ? Math.min(Math.ceil((minuteOf(new Date()) + 1) / 60) * 60, 22 * 60) : 9 * 60;
    }
    setDraft({ key: Date.now(), d: blankDraft(d, start ?? 9 * 60, to) });
  };

  const create = (d: Draft) => {
    const ev: CalEvent = { id: newId("ev"), ...eventFields(d), source: "manual" };
    db.insert("events", ev, "end");
    setDraft(null);
    const day = dayStart(parse(ev.start));
    if (!within(days, day)) setAnchor(day);
    setHidden((h) => (h.has(ev.calendar) ? new Set([...h].filter((x) => x !== ev.calendar)) : h));
    toast("Event added", { label: "Undo", run: () => db.remove("events", ev.id) });
  };

  const save = (d: Draft) => {
    if (!open) return;
    db.patch("events", open.id, eventFields(d));
    setEditing(false);
    toast("Changes saved");
  };

  const remove = () => {
    if (!open) return;
    const ev = open;
    go("calendar");
    db.remove("events", ev.id);
    toast("Event deleted", { label: "Undo", run: () => db.insert("events", ev, "end") });
  };

  // Keyboard: arrows move, T for today, N for a new event, D/W/M/A switch views.
  const keys = useRef({ step, toToday, newEvent, setView });
  keys.current = { step, toToday, newEvent, setView };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]") || document.querySelector("dialog[open]")) return;
      const k = keys.current;
      const byKey: Record<string, () => void> = {
        ArrowLeft: () => k.step(-1),
        ArrowRight: () => k.step(1),
        t: k.toToday,
        n: () => k.newEvent(),
        d: () => k.setView("Day"),
        w: () => k.setView("Week"),
        m: () => k.setView("Month"),
        a: () => k.setView("Agenda"),
      };
      const run = byKey[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (run) {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const heading = view === "Day" ? dayHeading(anchor) : view === "Month" ? monthHeading(anchor) : rangeLabel(days[0], days[days.length - 1]);
  const unit = view === "Month" ? "month" : view === "Day" ? "day" : "week";
  const counts = Object.fromEntries(calendars.map((c) => [c.id, all.filter((e) => e.calendar === c.id && days.some((d) => onDay(e, d))).length])) as Record<CalendarId, number>;

  return (
    <Page
      wide
      eyebrow="Calendar"
      title={<span aria-live="polite">{heading}</span>}
      lede={summary(inRange, clashes)}
      actions={
        <Button variant="primary" onClick={() => newEvent()}>
          <Plus size={15} weight="bold" />
          New event
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <IconButton label={`Previous ${unit}`} onClick={() => step(-1)} className="border border-line bg-surface">
            <CaretLeft size={15} />
          </IconButton>
          <Button onClick={toToday}>Today</Button>
          <IconButton label={`Next ${unit}`} onClick={() => step(1)} className="border border-line bg-surface">
            <CaretRight size={15} />
          </IconButton>
        </div>
        <Segmented label="Calendar view" items={views} value={view} onChange={setView} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_196px]">
        <div className="flex min-w-0 flex-col gap-4">
          {view === "Day" && <DayStrip days={daysFor("Week", anchor, monday)} selected={anchor} now={now} events={visible} onPick={(d) => setAnchor(d)} />}
          {(view === "Day" || view === "Agenda") && <FreeTime day={anchor} events={all} now={now} onPick={newEvent} />}

          {(view === "Day" || view === "Week") && (
            <TimeGrid
              days={days}
              events={visible}
              clashes={clashes}
              now={now}
              focus={open}
              onOpen={openEvent}
              onCreate={(day, m) => newEvent(day, m)}
              onPickDay={pickDay}
            />
          )}
          {view === "Month" && <MonthGrid anchor={anchor} monday={monday} events={visible} clashes={clashes} now={now} onOpen={openEvent} onPickDay={pickDay} />}
          {view === "Agenda" && <Agenda days={days} events={visible} clashes={clashes} now={now} onOpen={openEvent} />}
        </div>

        <aside className="flex flex-col gap-8">
          <CalendarsList
            hidden={hidden}
            counts={counts}
            onToggle={(id) =>
              setHidden((h) => {
                const next = new Set(h);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
          />
          <div className="max-lg:hidden">
            <Label className="mb-2">Keys</Label>
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-[12.5px] text-muted">
              <dt className="flex gap-1">
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
              </dt>
              <dd>Move</dd>
              <dt>
                <Kbd>T</Kbd>
              </dt>
              <dd>Today</dd>
              <dt>
                <Kbd>N</Kbd>
              </dt>
              <dd>New event</dd>
              <dt className="flex gap-1">
                <Kbd>D</Kbd>
                <Kbd>W</Kbd>
                <Kbd>M</Kbd>
                <Kbd>A</Kbd>
              </dt>
              <dd>Views</dd>
            </dl>
          </div>
        </aside>
      </div>

      <Sheet
        open={!!open}
        onClose={closeEvent}
        title={editing ? "Edit event" : shown?.title ?? ""}
        footer={
          shown &&
          (editing ? (
            <>
              {/* Keys stop React reusing the Edit button as the submit button mid-click. */}
              <Button key="cancel" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button key="save" variant="primary" type="submit" form="cal-edit">
                Save changes
              </Button>
            </>
          ) : (
            <>
              <Button key="delete" variant="danger" onClick={remove} className="mr-auto">
                Delete
              </Button>
              <Button key="edit" onClick={() => setEditing(true)}>
                Edit
              </Button>
            </>
          ))
        }
      >
        {shown && (editing ? <EventForm key={shown.id} id="cal-edit" initial={draftFrom(shown)} onSubmit={save} /> : <EventDetails e={shown} onOpen={openEvent} />)}
      </Sheet>

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title="New event"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="cal-new">
              Add event
            </Button>
          </>
        }
      >
        {draft && <EventForm key={draft.key} id="cal-new" initial={draft.d} onSubmit={create} />}
      </Sheet>
    </Page>
  );
}
