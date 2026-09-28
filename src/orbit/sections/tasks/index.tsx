import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, CalendarBlank, CheckCircle, Flag, Plus, SunHorizon, Tray } from "@phosphor-icons/react";
import { db, useDB } from "../../store";
import { go, href, useRoute } from "../../router";
import { dayLabel, daysFrom, longDate, on, relDay, stamp } from "../../time";
import { taskLists, type Task, type TaskList } from "../../data/tasks";
import { Button, Check, cx, Dot, Empty, Field, Input, Kbd, Label, Page, Select, Sheet, Source, Switch, Tabs, Tag, Textarea, toast, type Tone } from "../../ui";
import { parseQuick } from "./parse";
import { addTask, isOverdue, listName, originOf, when } from "./shared";

type View = "today" | "upcoming" | "nodate" | TaskList | "done";

const listTone: Record<TaskList, Tone | "ink"> = { personal: "accent", work: "info", home: "warn", shop: "ink" };
const isList = (v: View): v is TaskList => taskLists.some((l) => l.id === v);

const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const say = (n: number) => words[n] ?? String(n);

/** Priority first, then soonest, then newest. */
function byUrgency(a: Task, b: Task) {
  if (!!a.priority !== !!b.priority) return a.priority ? -1 : 1;
  if (a.due !== b.due) return !a.due ? 1 : !b.due ? -1 : a.due < b.due ? -1 : 1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

type Group = { key: string; heading?: ReactNode; tone?: "coral"; tasks: Task[] };

function DayHeading({ date }: { date: string }) {
  const rel = relDay(date);
  const plain = rel === dayLabel(date);
  return (
    <span className="flex items-baseline gap-2.5">
      <span className="font-serif text-[21px] leading-none tracking-[-0.01em] text-ink">{rel}</span>
      {!plain && <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">{dayLabel(date)}</span>}
    </span>
  );
}

function groupsFor(view: View, all: Task[], showing: (t: Task) => boolean): Group[] {
  const open = all.filter(showing);
  const today = on(0);
  if (view === "today") {
    return [
      { key: "overdue", heading: "Overdue", tone: "coral" as const, tasks: open.filter((t) => t.due && t.due < today).sort(byUrgency) },
      { key: "today", heading: "Due today", tasks: open.filter((t) => t.due === today).sort(byUrgency) },
    ].filter((g) => g.tasks.length);
  }
  if (view === "upcoming") {
    const soon = open.filter((t) => t.due && daysFrom(t.due) >= 1);
    const days: Group[] = [];
    for (let i = 1; i <= 14; i++) {
      const date = on(i);
      const tasks = soon.filter((t) => t.due === date).sort(byUrgency);
      if (tasks.length) days.push({ key: date, heading: <DayHeading date={date} />, tasks });
    }
    const later = soon.filter((t) => daysFrom(t.due!) > 14).sort(byUrgency);
    if (later.length) days.push({ key: "later", heading: <span className="font-serif text-[21px] leading-none tracking-[-0.01em] text-ink">Later</span>, tasks: later });
    return days;
  }
  if (view === "nodate") return [{ key: "nodate", tasks: open.filter((t) => !t.due).sort(byUrgency) }].filter((g) => g.tasks.length);
  if (view === "done") {
    const done = all.filter((t) => t.done).sort((a, b) => ((a.doneAt ?? "") < (b.doneAt ?? "") ? 1 : -1));
    const groups: Group[] = [];
    for (const t of done) {
      const day = t.doneAt ? relDay(t.doneAt) : "Earlier";
      const g = groups.find((x) => x.key === day);
      if (g) g.tasks.push(t);
      else groups.push({ key: day, heading: day, tasks: [t] });
    }
    return groups;
  }
  return [{ key: view, tasks: open.filter((t) => t.list === view).sort(byUrgency) }].filter((g) => g.tasks.length);
}

/* Quick add ------------------------------------------------------------------------------------------ */

function QuickAdd({ view, inputRef }: { view: View; inputRef: RefObject<HTMLInputElement | null> }) {
  const [text, setText] = useState("");
  const parsed = parseQuick(text);
  const due = parsed.due ?? (view === "today" ? on(0) : undefined);
  const list = parsed.list ?? (isList(view) ? view : "personal");
  const ready = parsed.title.length > 0;

  const submit = () => {
    if (!ready) return;
    const t = addTask({ title: parsed.title, due, list, priority: parsed.priority || undefined });
    setText("");
    toast(`Added to ${listName(list)}${due ? `, due ${when(due)}` : ""}`, {
      label: "Undo",
      run: () => db.remove("tasks", t.id),
    });
  };

  return (
    <div className="mb-7">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2.5 rounded-[8px] border border-line bg-surface px-3 transition-colors focus-within:border-accent hover:border-line-strong"
      >
        <Plus size={16} className="shrink-0 text-faint" aria-hidden />
        <label htmlFor="quick-add" className="sr-only">
          Add a task
        </label>
        <input
          id="quick-add"
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setText("");
              e.currentTarget.blur();
            }
          }}
          placeholder="Add a task"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 bg-transparent text-[14.5px] text-ink placeholder:text-faint focus:outline-none"
        />
        <span className="hidden shrink-0 items-center gap-1.5 text-[12px] text-faint sm:flex">
          {text ? (
            <>
              <Kbd>↵</Kbd> to add
            </>
          ) : (
            <Kbd>N</Kbd>
          )}
        </span>
      </form>
      <div aria-live="polite" className="mt-2 flex min-h-6 flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
        {text && ready ? (
          <>
            <span className="mr-0.5">Adds</span>
            <span className="max-w-[22ch] truncate font-medium text-ink">{parsed.title}</span>
            <Tag tone={due && daysFrom(due) < 0 ? "coral" : "accent"}>{due ? relDay(due) : "No date"}</Tag>
            <Tag>{listName(list)}</Tag>
            {parsed.priority && <Tag tone="coral">Priority</Tag>}
          </>
        ) : (
          <span className="text-faint">
            Understands dates like <em className="not-italic text-muted">tomorrow</em>, <em className="not-italic text-muted">friday</em>,{" "}
            <em className="not-italic text-muted">in 3 days</em>, <em className="not-italic text-muted">14 Nov</em>, a list with{" "}
            <em className="not-italic text-muted">#work</em> and <em className="not-italic text-muted">!</em> for priority.
          </span>
        )}
      </div>
    </div>
  );
}

/* Rows ---------------------------------------------------------------------------------------------- */

function TaskRow({ task, view, fading, onToggle }: { task: Task; view: View; fading: boolean; onToggle: (t: Task) => void }) {
  const origin = useDB((d) => originOf(task.from, d));
  const reduce = useReducedMotion();
  const late = isOverdue(task);
  const done = task.done;
  const showDue = task.due && view !== "today" && !(view === "upcoming" && daysFrom(task.due) <= 14);
  return (
    <motion.li
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: fading ? 0.45 : 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, transition: { duration: 0.22 } }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div
        className="group flex min-h-[52px] cursor-pointer items-start gap-3 px-1 py-3 transition-colors hover:bg-soft/60"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("a,button")) go(`tasks/${task.id}`);
        }}
      >
        <span className="pt-[3px]">
          <Check checked={done} onChange={() => onToggle(task)} label={done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`} />
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => go(`tasks/${task.id}`)}
            className={cx("block max-w-full truncate text-left text-[14.5px] leading-snug", done ? "text-faint line-through decoration-faint/60" : "text-ink")}
          >
            {task.title}
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
            {done && task.doneAt && <span>Done {stamp(task.doneAt)}</span>}
            {!done && late && <span className="text-coral">{relDay(task.due!)}</span>}
            {!done && !late && showDue && <span className="tabular-nums">{relDay(task.due!)}</span>}
            {!isList(view) && (
              <span className="inline-flex items-center gap-1.5">
                <Dot tone={listTone[task.list]} className="size-1.5" />
                {listName(task.list)}
              </span>
            )}
            {origin && (
              <a href={href(origin.path)} title={origin.title} className="inline-flex items-center gap-0.5 underline-offset-[3px] hover:text-ink hover:underline">
                {origin.label}
                <ArrowUpRight size={11} aria-hidden />
              </a>
            )}
            {task.notes && !done && <span className="min-w-0 max-w-full truncate text-faint max-sm:hidden">{task.notes}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-[3px]">
          {task.priority && !done && <Flag size={14} weight="fill" className="text-coral" aria-label="Priority" />}
          {task.source === "orbit" && <Source id="orbit" className="max-sm:hidden" />}
        </div>
      </div>
    </motion.li>
  );
}

/* Details sheet ------------------------------------------------------------------------------------- */

function TaskSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const task = useDB((d) => (id ? d.tasks.find((t) => t.id === id) : undefined));
  const origin = useDB((d) => originOf(task?.from, d));
  const [armed, setArmed] = useState(false);
  const last = useRef<Task | undefined>(undefined);
  if (task) last.current = task;
  const t = task ?? last.current;

  useEffect(() => setArmed(false), [id]);

  const patch = (change: Partial<Task>) => t && db.patch("tasks", t.id, change);
  const quick: [string, string][] = [
    ["Today", on(0)],
    ["Tomorrow", on(1)],
    ["Next week", on(((8 - new Date().getDay()) % 7) || 7)],
  ];

  return (
    <Sheet
      open={!!task}
      onClose={onClose}
      title={
        t ? (
          <input
            aria-label="Title"
            value={t.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full min-w-0 bg-transparent font-serif text-[22px] leading-tight tracking-[-0.01em] text-ink focus:outline-none"
          />
        ) : (
          "Task"
        )
      }
      footer={
        t &&
        (armed ? (
          <>
            <span className="mr-auto self-center text-[13px] text-muted">Delete this task?</span>
            <Button variant="ghost" onClick={() => setArmed(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const copy = t;
                db.remove("tasks", t.id);
                onClose();
                toast("Task deleted", { label: "Undo", run: () => db.insert("tasks", copy) });
              }}
            >
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" className="mr-auto" onClick={() => setArmed(true)}>
              Delete
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const was = t;
                patch({ done: !t.done, doneAt: t.done ? undefined : new Date().toISOString() });
                if (!was.done) {
                  onClose();
                  toast("Done", { label: "Undo", run: () => db.patch("tasks", was.id, { done: false, doneAt: undefined }) });
                }
              }}
            >
              {t.done ? "Mark as not done" : "Mark as done"}
            </Button>
          </>
        ))
      }
    >
      {t && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
            <Source id={t.source} />
            <span>Added {stamp(t.createdAt)}</span>
            {t.done && t.doneAt && <span>Done {stamp(t.doneAt)}</span>}
          </div>

          {origin && (
            <a href={href(origin.path)} className="group flex items-center gap-3 border-y border-line py-3 hover:bg-soft/60">
              <div className="min-w-0 flex-1">
                <Label>{origin.label}</Label>
                <p className="mt-1 truncate text-[14px] text-ink">{origin.title}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-[13px] text-muted group-hover:text-ink">
                Open <ArrowUpRight size={13} aria-hidden />
              </span>
            </a>
          )}

          <Field label="Notes">
            <Textarea value={t.notes ?? ""} placeholder="Add a note" onChange={(e) => patch({ notes: e.target.value || undefined })} />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Field label="Due">
              <Input type="date" value={t.due ?? ""} onChange={(e) => patch({ due: e.target.value || undefined })} />
            </Field>
            <div className="flex flex-wrap gap-1">
              {quick.map(([name, date]) => (
                <Button key={name} size="sm" variant={t.due === date ? "outline" : "ghost"} onClick={() => patch({ due: date })}>
                  {name}
                </Button>
              ))}
              {t.due && (
                <Button size="sm" variant="ghost" onClick={() => patch({ due: undefined })}>
                  No date
                </Button>
              )}
            </div>
            {t.due && (
              <p className={cx("text-[12.5px]", isOverdue(t) ? "text-coral" : "text-muted")}>
                {longDate(t.due)}
                {isOverdue(t) ? ", overdue" : ""}
              </p>
            )}
          </div>

          <Field label="List">
            <Select value={t.list} onChange={(e) => patch({ list: e.target.value as TaskList })}>
              {taskLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>

          <label className="flex items-center justify-between gap-4 text-[14px]">
            <span>
              Priority
              <span className="block text-[12.5px] text-muted">Shown first, with a flag.</span>
            </span>
            <Switch label="Priority" checked={!!t.priority} onChange={(v) => patch({ priority: v || undefined })} />
          </label>
        </div>
      )}
    </Sheet>
  );
}

/* Page ---------------------------------------------------------------------------------------------- */

const baseViews: { key: View; label: string; icon: typeof SunHorizon }[] = [
  { key: "today", label: "Today", icon: SunHorizon },
  { key: "upcoming", label: "Upcoming", icon: CalendarBlank },
  { key: "nodate", label: "No date", icon: Tray },
];

const emptyCopy: Record<string, [string, string]> = {
  today: ["A clear day", "Nothing is due today. Add something above, or look at what's coming up."],
  upcoming: ["Nothing coming up", "Tasks with a date in the future will appear here, grouped by day."],
  nodate: ["Everything has a date", "Tasks without a due date collect here."],
  done: ["Nothing completed yet", "Ticked-off tasks move here."],
  list: ["This list is empty", "Add a task above and it will land here."],
};

export default function TasksPage() {
  const route = useRoute();
  const openId = route.rest[0];
  const all = useDB((d) => d.tasks);
  const [view, setView] = useState<View>("today");
  const [fading, setFading] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open a deep-linked task in its own list's context.
  const linked = useDB((d) => (openId ? d.tasks.find((t) => t.id === openId) : undefined));
  const firstLink = useRef(true);
  useEffect(() => {
    if (!firstLink.current || !linked) return;
    firstLink.current = false;
    if (linked.done) setView("done");
  }, [linked]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input,textarea,select,[contenteditable=true]") || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const today = on(0);
  const open = all.filter((t) => !t.done);
  const counts: Record<string, number> = {
    today: open.filter((t) => t.due && t.due <= today).length,
    upcoming: open.filter((t) => t.due && t.due > today).length,
    nodate: open.filter((t) => !t.due).length,
    done: all.filter((t) => t.done).length,
    ...Object.fromEntries(taskLists.map((l) => [l.id, open.filter((t) => t.list === l.id).length])),
  };
  const dueToday = open.filter((t) => t.due === today).length;
  const overdue = open.filter((t) => t.due && t.due < today).length;

  const onToggle = (t: Task) => {
    const done = !t.done;
    db.patch("tasks", t.id, { done, doneAt: done ? new Date().toISOString() : undefined });
    if (done && view !== "done") {
      setFading((f) => [...f, t.id]);
      window.setTimeout(() => setFading((f) => f.filter((x) => x !== t.id)), 900);
    }
    toast(done ? "Done" : "Moved back to your list", {
      label: "Undo",
      run: () => db.patch("tasks", t.id, { done: t.done, doneAt: t.doneAt }),
    });
  };

  const showing = (t: Task) => !t.done || fading.includes(t.id);
  const groups = groupsFor(view, all, showing);
  const viewLabel = isList(view) ? listName(view) : view === "done" ? "Completed" : baseViews.find((v) => v.key === view)!.label;
  const [emptyTitle, emptyText] = emptyCopy[isList(view) ? "list" : view];

  const clearCompleted = () => {
    const removed = all.filter((t) => t.done);
    db.set("tasks", (list) => list.filter((t) => !t.done));
    toast(`Cleared ${removed.length} completed`, { label: "Undo", run: () => db.set("tasks", (list) => [...list, ...removed]) });
  };

  const tabNames: [View, string][] = [
    ...baseViews.map((v): [View, string] => [v.key, v.label]),
    ...taskLists.map((l): [View, string] => [l.id, l.name]),
    ["done", "Completed"],
  ];
  const tabItems = tabNames.map(([k, label]): [View, ReactNode] => [
    k,
    <span key={k} className="inline-flex items-baseline gap-1.5">
      {label}
      {!!counts[k] && k !== "done" && <span className="font-mono text-[11px] tabular-nums text-faint">{counts[k]}</span>}
    </span>,
  ]);

  const lede =
    dueToday || overdue
      ? `${say(dueToday)} ${dueToday === 1 ? "task" : "tasks"} due today${overdue ? `, ${say(overdue).toLowerCase()} overdue` : ""}.`
      : "Nothing due today.";

  return (
    <Page eyebrow={longDate(today)} title="Tasks" lede={lede}>
      <div className="grid gap-10 lg:grid-cols-[184px_minmax(0,1fr)]">
        <nav aria-label="Task views" className="hidden lg:block">
          <div className="sticky top-8 flex flex-col gap-0.5">
            {baseViews.map((v) => (
              <ViewButton key={v.key} active={view === v.key} onClick={() => setView(v.key)} count={counts[v.key]} tone={v.key === "today" && overdue ? "coral" : undefined}>
                <v.icon size={16} weight={view === v.key ? "fill" : "regular"} className={view === v.key ? "text-accent" : "text-faint"} />
                {v.label}
              </ViewButton>
            ))}
            <Label className="mb-1 mt-5 px-2">Lists</Label>
            {taskLists.map((l) => (
              <ViewButton key={l.id} active={view === l.id} onClick={() => setView(l.id)} count={counts[l.id]}>
                <span className="grid size-4 place-items-center">
                  <Dot tone={listTone[l.id]} />
                </span>
                {l.name}
              </ViewButton>
            ))}
            <div className="mt-5" />
            <ViewButton active={view === "done"} onClick={() => setView("done")}>
              <CheckCircle size={16} weight={view === "done" ? "fill" : "regular"} className={view === "done" ? "text-accent" : "text-faint"} />
              Completed
            </ViewButton>
          </div>
        </nav>

        <div className="min-w-0">
          <Tabs<View> label="Task views" items={tabItems} value={view} onChange={setView} className="-mx-4 mb-6 px-4 lg:hidden" />
          {view !== "done" && <QuickAdd view={view} inputRef={inputRef} />}

          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-[26px] leading-none tracking-[-0.015em] text-ink">{viewLabel}</h2>
            {view === "done" && counts.done > 0 && (
              <Button size="sm" variant="ghost" onClick={clearCompleted}>
                Clear completed
              </Button>
            )}
          </div>

          {groups.length === 0 ? (
            <div className="border-t border-line">
              <Empty title={emptyTitle}>{emptyText}</Empty>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {groups.map((g) => (
                <section key={g.key} aria-label={typeof g.heading === "string" ? g.heading : g.key}>
                  {g.heading &&
                    (typeof g.heading === "string" ? (
                      <h3 className={cx("mb-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em]", g.tone === "coral" ? "text-coral" : "text-muted")}>
                        {g.heading}
                        <span className="ml-2 text-faint">{g.tasks.length}</span>
                      </h3>
                    ) : (
                      <h3 className="mb-3">{g.heading}</h3>
                    ))}
                  <ul className="divide-y divide-line border-y border-line">
                    <AnimatePresence initial={false}>
                      {g.tasks.map((t) => (
                        <TaskRow key={t.id} task={t} view={view} fading={fading.includes(t.id)} onToggle={onToggle} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskSheet id={openId} onClose={() => go("tasks")} />
    </Page>
  );
}

function ViewButton({ active, onClick, count, tone, children }: { active: boolean; onClick: () => void; count?: number; tone?: "coral"; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cx(
        "flex h-8 items-center gap-2.5 rounded-[7px] px-2 text-left text-[13.5px] transition-colors",
        active ? "bg-soft font-medium text-ink" : "text-muted hover:bg-soft/60 hover:text-ink",
      )}
    >
      {children}
      {!!count && <span className={cx("ml-auto font-mono text-[11px] tabular-nums", tone === "coral" ? "text-coral" : "text-faint")}>{count}</span>}
    </button>
  );
}
