import { Flag } from "@phosphor-icons/react";
import { db, newId, type DB } from "../../store";
import { href } from "../../router";
import { daysFrom, relDay } from "../../time";
import { taskLists, type Task, type TaskList } from "../../data/tasks";
import type { Ref } from "../../data/sources";
import { Check, cx, Source, toast } from "../../ui";

/* Shared by Tasks, People and Life admin. */

export const listName = (id: TaskList) => taskLists.find((l) => l.id === id)?.name ?? id;

export type Origin = { label: string; title: string; path: string };

/** Where a task came from, as a short label ("From email") and the item's own title. */
export function originOf(ref: Ref | undefined, d: DB): Origin | undefined {
  if (!ref) return undefined;
  const { kind, id } = ref;
  if (kind === "message") {
    const m = d.messages.find((x) => x.id === id);
    return m && { label: "From email", title: `${m.from.name}: ${m.subject}`, path: `inbox/${id}` };
  }
  if (kind === "booking") {
    const b = d.bookings.find((x) => x.id === id);
    return b && { label: "From booking", title: b.title, path: `plans/${id}` };
  }
  if (kind === "doc") {
    const x = d.docs.find((y) => y.id === id);
    return x && { label: "From life admin", title: x.title, path: `admin/${id}` };
  }
  if (kind === "contact") {
    const c = d.contacts.find((y) => y.id === id);
    return c && { label: "From people", title: c.name, path: `people/${id}` };
  }
  if (kind === "event") {
    const e = d.events.find((y) => y.id === id);
    return e && { label: "From calendar", title: e.title, path: `calendar/${id}` };
  }
  if (kind === "bill") {
    const b = d.bills.find((y) => y.id === id);
    return b && { label: "From bills", title: b.name, path: `money/bills/${id}` };
  }
  if (kind === "order") {
    const o = d.orders.find((y) => y.id === id);
    return o && { label: "From delivery", title: o.retailer, path: `deliveries/${id}` };
  }
  return undefined;
}

/** "today", "tomorrow", "Friday", "Tue 14 Oct": for use mid-sentence. */
export function when(date: string) {
  const r = relDay(date);
  return /^(Today|Tomorrow|Yesterday)$/.test(r) ? r.toLowerCase() : r;
}

export const isOverdue = (t: Task) => !t.done && !!t.due && daysFrom(t.due) < 0;

/** Tick a task off (or back on), with Undo. */
export function toggleTask(t: Task) {
  const done = !t.done;
  db.patch("tasks", t.id, { done, doneAt: done ? new Date().toISOString() : undefined });
  toast(done ? "Done" : "Moved back to your list", {
    label: "Undo",
    run: () => db.patch("tasks", t.id, { done: t.done, doneAt: t.doneAt }),
  });
}

export function addTask(fields: Pick<Task, "title" | "list"> & Partial<Task>) {
  const task: Task = { id: newId("tk"), done: false, source: "manual", createdAt: new Date().toISOString(), ...fields };
  db.insert("tasks", task);
  return task;
}

/** A compact task line for other sections' sheets: check, title, due. */
export function MiniTask({ task }: { task: Task }) {
  const late = isOverdue(task);
  return (
    <li className="flex min-h-11 items-center gap-3 py-2">
      <Check checked={task.done} onChange={() => toggleTask(task)} label={task.done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`} />
      <a href={href(`tasks/${task.id}`)} className={cx("min-w-0 flex-1 truncate text-[14px] hover:underline", task.done ? "text-faint line-through" : "text-ink")}>
        {task.title}
      </a>
      {task.priority && !task.done && <Flag size={13} weight="fill" className="shrink-0 text-coral" aria-label="Priority" />}
      {task.due && <span className={cx("shrink-0 text-[12.5px] tabular-nums", late ? "text-coral" : "text-muted")}>{relDay(task.due)}</span>}
      {task.source === "orbit" && <Source id="orbit" className="max-sm:hidden" />}
    </li>
  );
}
