import type { DB } from "../store";
import { daysFrom, on, parse } from "@orbit/time";
import { eventsOn, isActiveOrder, deliveryWindow } from "@orbit/sections/today/derive";
import { relDay } from "@orbit/time";

/** No goal exists in the sample data, so the steps gauge uses the common 10,000 target. */
export const STEP_GOAL = 10_000;

const spendable = (t: DB["txns"][number]) => t.amount < 0 && t.category !== "transfers" && t.category !== "business";

/** Spend in budgeted categories this calendar month, against the sum of the monthly budgets. */
export function monthBudget(d: DB) {
  const budgets = Object.entries(d.budgets) as [string, number][];
  const total = budgets.reduce((s, [, v]) => s + v, 0);
  const month = on(0).slice(0, 7);
  const cats = new Set(budgets.map(([k]) => k));
  const spent = -d.txns.filter((t) => t.amount < 0 && cats.has(t.category) && on(daysFrom(t.date)).slice(0, 7) === month).reduce((s, t) => s + t.amount, 0);
  return { spent, total };
}

/** Daily spend for the last `days` days, oldest first. */
export function spendSeries(d: DB, days = 30) {
  const out = new Array<number>(days).fill(0);
  for (const t of d.txns) {
    if (!spendable(t)) continue;
    const n = daysFrom(t.date);
    if (n <= 0 && n > -days) out[days - 1 + n] += -t.amount;
  }
  return out;
}

export function cashBalance(d: DB) {
  const accts = d.accounts.filter((a) => a.type === "current" || a.type === "savings");
  return { total: accts.reduce((s, a) => s + a.balance, 0), count: accts.length, sources: [...new Set(accts.map((a) => a.institution))] };
}

/** Tasks that count towards today: due today, overdue and open, or finished today. */
export function tasksToday(d: DB) {
  const t = on(0);
  const rel = d.tasks.filter((k) => k.due === t || (!k.done && !!k.due && k.due < t) || (k.done && !!k.doneAt && daysFrom(k.doneAt) === 0));
  return { done: rel.filter((k) => k.done).length, total: rel.length };
}

export function replies(d: DB) {
  const inbox = d.messages.filter((m) => m.folder === "inbox");
  return { waiting: inbox.filter((m) => m.needsReply).length, total: inbox.length };
}

export function todayStats(d: DB) {
  return d.daily.find((x) => x.date === on(0)) ?? [...d.daily].sort((a, b) => a.date.localeCompare(b.date)).filter((x) => x.date <= on(0)).pop();
}

export function revenueToday(d: DB) {
  const row = d.revenue.find((r) => r.date === on(0));
  const series = Array.from({ length: 14 }, (_, i) => d.revenue.find((r) => r.date === on(i - 13))?.revenue ?? 0);
  return { row, series };
}

export function nextTrip(d: DB) {
  const t = d.trips.filter((x) => daysFrom(x.end) >= 0).sort((a, b) => a.start.localeCompare(b.start))[0];
  if (!t) return undefined;
  const source = d.bookings.find((b) => b.tripId === t.id)?.source;
  return { trip: t, days: daysFrom(t.start), source };
}

export function deliveriesInTransit(d: DB) {
  const active = d.orders.filter(isActiveOrder);
  const next = active.filter((o) => o.eta).sort((a, b) => a.eta!.localeCompare(b.eta!))[0];
  return { count: active.length, next, when: next ? `${relDay(next.eta!)}${deliveryWindow(next) ? `, ${deliveryWindow(next)}` : ""}` : "" };
}

/** The next timed event today or tomorrow that has not started. */
export function nextEvent(d: DB, now: Date) {
  return [...eventsOn(d, 0), ...eventsOn(d, 1)].filter((e) => !e.allDay && parse(e.start) > now)[0];
}

export function timedToday(d: DB) {
  return eventsOn(d, 0).filter((e) => !e.allDay);
}

/** "now", "12m", "3h", "2d" since an ISO time. */
export function ago(iso: string, now: Date) {
  const m = Math.max(0, Math.round((now.getTime() - parse(iso).getTime()) / 60_000));
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}
