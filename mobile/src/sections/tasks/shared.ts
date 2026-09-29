import { relDay } from "@orbit/time";
import { taskLists, type TaskList } from "@orbit/data/tasks";
import type { Ref } from "@orbit/data/sources";
import type { DB } from "../../store";

export const listName = (id: TaskList) => taskLists.find((l) => l.id === id)?.name ?? id;

export type Origin = { label: string; title: string; path: string };

/** Where a task came from, as a short label ("From email") and the item's own title. Path is a web section path. */
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
