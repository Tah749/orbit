import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowUpRight, Flag, Plus } from "phosphor-react-native";
import { dayLabel, daysFrom, longDate, on, relDay, stamp, ymd } from "@orbit/time";
import { taskLists, type Task, type TaskList } from "@orbit/data/tasks";
import { parseQuick } from "@orbit/sections/tasks/parse";
import { db, newId, useDB } from "../../store";
import { useTheme } from "../../theme";
import { Button, Check, Empty, Field, GUTTER, Input, Label, Page, Screen, Sheet, Source, Skeleton, SkeletonList, Switch, Tag, Text, Textarea, toast, useSimulatedLoad } from "../../ui";
import { routeFor } from "../ask/links";
import { listName, originOf, when } from "./shared";

type View_ = "today" | "upcoming" | "nodate" | "all" | "done";
type ListFilter = "all" | TaskList;

const dueViews: { key: View_; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "nodate", label: "No date" },
  { key: "all", label: "All" },
  { key: "done", label: "Done" },
];

const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const say = (n: number) => words[n] ?? String(n);

/** Priority first, then soonest, then newest. */
function byUrgency(a: Task, b: Task) {
  if (!!a.priority !== !!b.priority) return a.priority ? -1 : 1;
  if (a.due !== b.due) return !a.due ? 1 : !b.due ? -1 : a.due < b.due ? -1 : 1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

const isOverdue = (t: Task) => !t.done && !!t.due && daysFrom(t.due) < 0;

type Group = { key: string; heading?: string; sub?: string; tone?: "coral"; serif?: boolean; tasks: Task[] };

function groupsFor(view: View_, all: Task[], showing: (t: Task) => boolean): Group[] {
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
      if (!tasks.length) continue;
      const rel = relDay(date);
      days.push({ key: date, heading: rel, sub: rel === dayLabel(date) ? undefined : dayLabel(date), serif: true, tasks });
    }
    const later = soon.filter((t) => daysFrom(t.due!) > 14).sort(byUrgency);
    if (later.length) days.push({ key: "later", heading: "Later", serif: true, tasks: later });
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
  // All: open tasks by list.
  return taskLists.map((l) => ({ key: l.id, heading: l.name, tasks: open.filter((t) => t.list === l.id).sort(byUrgency) })).filter((g) => g.tasks.length);
}

function Chip({ label, count, on: active, onPress }: { label: string; count?: number; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: active ? c.ink : c.line, backgroundColor: active ? c.soft : "transparent", flexDirection: "row", alignItems: "center", gap: 6 }}
    >
      <Text size={13.5} font={active ? "sansMedium" : "sans"} tone={active ? "ink" : "muted"}>
        {label}
      </Text>
      {count ? (
        <Text size={11} font="mono" tone={active ? "ink" : "faint"} num>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8 }}>
      {children}
    </ScrollView>
  );
}

/* Quick add ------------------------------------------------------------------------------------------ */

function QuickAdd({ view, listFilter }: { view: View_; listFilter: ListFilter }) {
  const { c } = useTheme();
  const [text, setText] = useState("");
  const parsed = parseQuick(text);
  const due = parsed.due ?? (view === "today" ? on(0) : undefined);
  const list: TaskList = parsed.list ?? (listFilter !== "all" ? listFilter : "personal");
  const ready = parsed.title.length > 0;

  const submit = () => {
    if (!ready) return;
    const t: Task = { id: newId("tk"), title: parsed.title, due, list, priority: parsed.priority || undefined, done: false, source: "manual", createdAt: new Date().toISOString() };
    db.insert("tasks", t);
    setText("");
    toast(`Added to ${listName(list)}${due ? `, due ${when(due)}` : ""}`, { label: "Undo", run: () => db.remove("tasks", t.id) });
  };

  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 7, paddingLeft: 12 }}>
          <Plus size={16} color={c.faint} />
          <Input
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            placeholder="Add a task"
            returnKeyType="done"
            blurOnSubmit={false}
            accessibilityLabel="Add a task"
            style={{ flex: 1, borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0 }}
          />
        </View>
        <Button variant="primary" onPress={submit} disabled={!ready}>
          Add
        </Button>
      </View>
      <View accessibilityLiveRegion="polite" style={{ marginTop: 8, minHeight: 24, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {text && ready ? (
          <>
            <Text size={12.5} tone="muted">
              Adds
            </Text>
            <Text size={12.5} font="sansMedium" lines={1} style={{ maxWidth: 190 }}>
              {parsed.title}
            </Text>
            <Tag tone={due && daysFrom(due) < 0 ? "coral" : "accent"}>{due ? relDay(due) : "No date"}</Tag>
            <Tag>{listName(list)}</Tag>
            {parsed.priority ? <Tag tone="coral">Priority</Tag> : null}
          </>
        ) : (
          <Text size={12.5} tone="faint">
            Understands dates like tomorrow, friday, in 3 days, 14 Nov, a list with #work and ! for priority.
          </Text>
        )}
      </View>
    </View>
  );
}

/* Rows ---------------------------------------------------------------------------------------------- */

function TaskRow({ task, showList, fading, onToggle, onOpen }: { task: Task; showList: boolean; fading: boolean; onToggle: (t: Task) => void; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  const router = useRouter();
  const origin = useDB((d) => originOf(task.from, d));
  const late = isOverdue(task);
  const done = task.done;
  return (
    <Pressable
      onPress={() => onOpen(task.id)}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}. Edit`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line, opacity: fading ? 0.45 : 1, backgroundColor: pressed ? c.soft : "transparent" })}
    >
      <View style={{ paddingTop: 1 }}>
        <Check checked={done} onChange={() => onToggle(task)} label={done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text size={14.5} tone={done ? "faint" : "ink"} lines={2} style={done ? { textDecorationLine: "line-through" } : undefined}>
          {task.title}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 4, marginTop: 4 }}>
          {done && task.doneAt ? (
            <Text size={12.5} tone="muted">
              Done {stamp(task.doneAt)}
            </Text>
          ) : null}
          {!done && task.due ? (
            <Text size={12.5} tone={late ? "coral" : "muted"} num>
              {relDay(task.due)}
            </Text>
          ) : null}
          {showList ? (
            <Text size={12.5} tone="muted">
              {listName(task.list)}
            </Text>
          ) : null}
          <Source id={task.source} />
        </View>
        {origin ? (
          <Pressable onPress={() => router.push(routeFor(origin.path) as never)} accessibilityRole="link" accessibilityLabel={`${origin.label}: ${origin.title}`} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 5, alignSelf: "flex-start", minHeight: 24 }}>
            <Text size={12.5} tone="muted" style={{ textDecorationLine: "underline", textDecorationColor: c.lineStrong }}>
              {origin.label}
            </Text>
            <ArrowUpRight size={11} color={c.muted} />
          </Pressable>
        ) : null}
      </View>
      {task.priority && !done ? (
        <View style={{ paddingTop: 3 }} accessibilityLabel="Priority">
          <Flag size={14} weight="fill" color={c.coral} />
        </View>
      ) : null}
    </Pressable>
  );
}

/* Edit sheet ---------------------------------------------------------------------------------------- */

const validDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  return !Number.isNaN(d.getTime()) && ymd(d) === s;
};

function TaskSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const { c } = useTheme();
  const router = useRouter();
  const task = useDB((d) => (id ? d.tasks.find((t) => t.id === id) : undefined));
  const origin = useDB((d) => originOf(task?.from, d));
  const last = useRef<Task | undefined>(undefined);
  if (task) last.current = task;
  const t = task ?? last.current;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [due, setDue] = useState("");
  const [list, setList] = useState<TaskList>("personal");
  const [priority, setPriority] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const cur = id ? db.find("tasks", id) : undefined;
    if (!cur) return;
    setTitle(cur.title);
    setNotes(cur.notes ?? "");
    setDue(cur.due ?? "");
    setList(cur.list);
    setPriority(!!cur.priority);
    setArmed(false);
  }, [id]);

  const dueOk = due === "" || validDate(due);
  const quick: [string, string][] = [
    ["Today", on(0)],
    ["Tomorrow", on(1)],
    ["Next week", on(((8 - new Date().getDay()) % 7) || 7)],
  ];

  const save = () => {
    if (!t || !dueOk) return;
    db.patch("tasks", t.id, { title: title.trim() || t.title, notes: notes.trim() || undefined, due: due || undefined, list, priority: priority || undefined });
    toast("Saved");
    onClose();
  };

  return (
    <Sheet
      open={!!task}
      onClose={onClose}
      title="Task"
      footer={
        t &&
        (armed ? (
          <>
            <Text size={13} tone="muted" style={{ marginRight: "auto", alignSelf: "center" }}>
              Delete this task?
            </Text>
            <Button variant="ghost" onPress={() => setArmed(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => {
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
            <Button key="delete" variant="danger" style={{ marginRight: "auto" }} onPress={() => setArmed(true)}>
              Delete
            </Button>
            <Button key="save" variant="outline" disabled={!dueOk} onPress={save}>
              Save
            </Button>
            <Button
              key="done"
              variant="primary"
              onPress={() => {
                const was = t;
                db.patch("tasks", t.id, { done: !t.done, doneAt: t.done ? undefined : new Date().toISOString() });
                onClose();
                toast(was.done ? "Moved back to your list" : "Done", { label: "Undo", run: () => db.patch("tasks", was.id, { done: was.done, doneAt: was.doneAt }) });
              }}
            >
              {t.done ? "Not done" : "Mark done"}
            </Button>
          </>
        ))
      }
    >
      {t ? (
        <View style={{ gap: 20 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 4 }}>
            <Source id={t.source} />
            <Text size={12.5} tone="muted">
              Added {stamp(t.createdAt)}
            </Text>
            {t.done && t.doneAt ? (
              <Text size={12.5} tone="muted">
                Done {stamp(t.doneAt)}
              </Text>
            ) : null}
          </View>

          {origin ? (
            <Pressable
              onPress={() => {
                onClose();
                router.push(routeFor(origin.path) as never);
              }}
              accessibilityRole="link"
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 12, backgroundColor: pressed ? c.soft : "transparent" })}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Label>{origin.label}</Label>
                <Text size={14} lines={1} style={{ marginTop: 4 }}>
                  {origin.title}
                </Text>
              </View>
              <Text size={13} tone="muted">
                Open
              </Text>
              <ArrowUpRight size={13} color={c.muted} />
            </Pressable>
          ) : null}

          <Field label="Title">
            <Input value={title} onChangeText={setTitle} accessibilityLabel="Title" />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChangeText={setNotes} placeholder="Add a note" accessibilityLabel="Notes" style={{ minHeight: 84 }} />
          </Field>

          <View style={{ gap: 8 }}>
            <Field label="Due" hint={!dueOk ? "Use the form 2026-11-14." : undefined}>
              <Input value={due} onChangeText={setDue} placeholder="YYYY-MM-DD" autoCapitalize="none" autoCorrect={false} keyboardType="numbers-and-punctuation" accessibilityLabel="Due date" style={!dueOk ? { borderColor: c.coral } : undefined} />
            </Field>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {quick.map(([name, date]) => (
                <Button key={name} size="sm" variant={due === date ? "outline" : "ghost"} onPress={() => setDue(date)}>
                  {name}
                </Button>
              ))}
              {due ? (
                <Button size="sm" variant="ghost" onPress={() => setDue("")}>
                  No date
                </Button>
              ) : null}
            </View>
            {due && dueOk ? (
              <Text size={12.5} tone={daysFrom(due) < 0 && !t.done ? "coral" : "muted"}>
                {longDate(due)}
                {daysFrom(due) < 0 && !t.done ? ", overdue" : ""}
              </Text>
            ) : null}
          </View>

          <Field label="List">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {taskLists.map((l) => (
                <Chip key={l.id} label={l.name} on={list === l.id} onPress={() => setList(l.id)} />
              ))}
            </View>
          </Field>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text size={14}>Priority</Text>
              <Text size={12.5} tone="muted">
                Shown first, with a flag.
              </Text>
            </View>
            <Switch label="Priority" checked={priority} onChange={setPriority} />
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

/* Screen -------------------------------------------------------------------------------------------- */

const emptyCopy: Record<View_, [string, string]> = {
  today: ["A clear day", "Nothing is due today. Add something above, or look at what's coming up."],
  upcoming: ["Nothing coming up", "Tasks with a date in the future will appear here, grouped by day."],
  nodate: ["Everything has a date", "Tasks without a due date collect here."],
  all: ["This list is empty", "Add a task above and it will land here."],
  done: ["Nothing completed yet", "Ticked-off tasks move here."],
};

function TasksSkeleton() {
  return (
    <View style={{ gap: 22 }}>
      {[3, 2].map((n, i) => (
        <View key={i} style={{ gap: 10 }}>
          <Skeleton width={90} height={10} radius={4} />
          <SkeletonList rows={n} />
        </View>
      ))}
    </View>
  );
}

export default function TasksScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const all = useDB((d) => d.tasks);
  const [view, setView] = useState<View_>("today");
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [fading, setFading] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | undefined>(typeof params.id === "string" ? params.id : undefined);
  const [refresh, setRefresh] = useState(0);
  const loading = useSimulatedLoad("tasks", refresh);

  // Deep link (?id=): open the task, in the Done view if it is done.
  const linkedId = typeof params.id === "string" ? params.id : undefined;
  useEffect(() => {
    if (!linkedId) return;
    setEditing(linkedId);
    if (db.find("tasks", linkedId)?.done) setView("done");
  }, [linkedId]);

  const today = on(0);
  const scoped = useMemo(() => (listFilter === "all" ? all : all.filter((t) => t.list === listFilter)), [all, listFilter]);
  const open = scoped.filter((t) => !t.done);
  const counts: Record<View_, number> = {
    today: open.filter((t) => t.due && t.due <= today).length,
    upcoming: open.filter((t) => t.due && t.due > today).length,
    nodate: open.filter((t) => !t.due).length,
    all: open.length,
    done: 0,
  };
  const allOpen = all.filter((t) => !t.done);
  const dueToday = allOpen.filter((t) => t.due === today).length;
  const overdue = allOpen.filter((t) => t.due && t.due < today).length;
  const doneCount = scoped.filter((t) => t.done).length;

  const onToggle = (t: Task) => {
    const done = !t.done;
    db.patch("tasks", t.id, { done, doneAt: done ? new Date().toISOString() : undefined });
    if (done && view !== "done") {
      setFading((f) => [...f, t.id]);
      setTimeout(() => setFading((f) => f.filter((x) => x !== t.id)), 900);
    }
    toast(done ? "Done" : "Moved back to your list", { label: "Undo", run: () => db.patch("tasks", t.id, { done: t.done, doneAt: t.doneAt }) });
  };

  const showing = (t: Task) => !t.done || fading.includes(t.id);
  const groups = groupsFor(view, scoped, showing);
  const [emptyTitle, emptyText] = emptyCopy[view];

  const clearCompleted = () => {
    const removed = scoped.filter((t) => t.done);
    const ids = new Set(removed.map((t) => t.id));
    db.set("tasks", (l) => l.filter((t) => !ids.has(t.id)));
    toast(`Cleared ${removed.length} completed`, { label: "Undo", run: () => db.set("tasks", (l) => [...l, ...removed]) });
  };

  const lede =
    dueToday || overdue
      ? `${say(dueToday)} ${dueToday === 1 ? "task" : "tasks"} due today${overdue ? `, ${say(overdue).toLowerCase()} overdue` : ""}.`
      : "Nothing due today.";

  return (
    <Screen back onRefresh={() => setRefresh((n) => n + 1)}>
      <Page eyebrow={longDate(today)} title="Tasks" lede={lede}>
        {view !== "done" ? <QuickAdd view={view} listFilter={listFilter} /> : null}

        <ChipRow>
          {dueViews.map((v) => (
            <Chip key={v.key} label={v.label} count={counts[v.key]} on={view === v.key} onPress={() => setView(v.key)} />
          ))}
        </ChipRow>
        <View style={{ height: 8 }} />
        <ChipRow>
          <Chip label="All lists" on={listFilter === "all"} onPress={() => setListFilter("all")} />
          {taskLists.map((l) => (
            <Chip key={l.id} label={l.name} on={listFilter === l.id} onPress={() => setListFilter(l.id)} />
          ))}
        </ChipRow>

        <View style={{ marginTop: 20, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <Text size={24} font="serif" accessibilityRole="header" style={{ letterSpacing: -0.3 }}>
            {dueViews.find((v) => v.key === view)!.label === "Done" ? "Completed" : dueViews.find((v) => v.key === view)!.label}
          </Text>
          {view === "done" && doneCount > 0 ? (
            <Button size="sm" variant="ghost" onPress={clearCompleted}>
              Clear completed
            </Button>
          ) : null}
        </View>

        {loading ? (
          <TasksSkeleton />
        ) : groups.length === 0 ? (
          <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
            <Empty title={emptyTitle}>{emptyText}</Empty>
          </View>
        ) : (
          <View style={{ gap: 24 }}>
            {groups.map((g) => (
              <View key={g.key} accessibilityLabel={g.heading ?? g.key}>
                {g.heading ? (
                  g.serif ? (
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                      <Text size={20} font="serif" accessibilityRole="header">
                        {g.heading}
                      </Text>
                      {g.sub ? (
                        <Text size={11} font="mono" tone="faint" style={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                          {g.sub}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <Label tone={g.tone === "coral" ? "coral" : "muted"} style={{ marginBottom: 8 }}>
                      {g.heading}  {g.tasks.length}
                    </Label>
                  )
                ) : null}
                <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
                  {g.tasks.map((t) => (
                    <TaskRow key={t.id} task={t} showList={listFilter === "all" && view !== "all"} fading={fading.includes(t.id)} onToggle={onToggle} onOpen={setEditing} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
      <TaskSheet id={editing} onClose={() => setEditing(undefined)} />
    </Screen>
  );
}
