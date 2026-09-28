import type { Account, Bill, Category, Txn } from "../../data/money";
import type { SourceId } from "../../data/sources";
import type { Task } from "../../data/tasks";
import { daysFrom, parse, ymd } from "../../time";

/** Spending means money out of personal accounts, not moving money between your own pots. */
export const isSpend = (t: Txn, accounts: Account[]) =>
  t.amount < 0 && t.category !== "transfers" && t.category !== "income" && accounts.find((a) => a.id === t.accountId)?.type !== "business";

const monthName = new Intl.DateTimeFormat("en-GB", { month: "long" });

/** This month so far, and last month up to the same day, so the comparison is like for like. */
export function monthWindows(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = now.getDate();
  const thisStart = new Date(y, m, 1);
  const lastStart = new Date(y, m - 1, 1);
  const lastDays = new Date(y, m, 0).getDate();
  const lastSameEnd = new Date(y, m - 1, Math.min(day, lastDays), 23, 59, 59);
  return {
    thisStart,
    lastStart,
    lastEnd: new Date(y, m, 0, 23, 59, 59),
    lastSameEnd,
    day,
    lastDays,
    daysInMonth: new Date(y, m + 1, 0).getDate(),
    thisName: monthName.format(thisStart),
    lastName: monthName.format(lastStart),
  };
}

export const inRange = (iso: string, from: Date, to: Date) => {
  const d = parse(iso);
  return d >= from && d <= to;
};

/** Running total of spending for each day of a month, starting at day 1. */
export function cumulative(list: Txn[], start: Date, days: number) {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < days; i++) {
    for (const t of list) {
      const d = parse(t.date);
      if (d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth() && d.getDate() === i + 1) sum -= t.amount;
    }
    out.push(sum);
  }
  return out;
}

export function byCategory(list: Txn[]) {
  const map = new Map<Category, number>();
  for (const t of list) map.set(t.category, (map.get(t.category) ?? 0) - t.amount);
  return map;
}

/** Monthly cost of a recurring bill. */
export function perMonth(b: Bill) {
  switch (b.recurrence) {
    case "weekly":
      return (b.amount * 52) / 12;
    case "monthly":
      return b.amount;
    case "quarterly":
      return b.amount / 3;
    case "yearly":
      return b.amount / 12;
    default:
      return 0;
  }
}

export const recurrenceName: Record<Bill["recurrence"], string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Every 3 months",
  yearly: "Yearly",
  once: "One-off",
};

/** The next due date after paying this one. */
export function nextDue(b: Bill) {
  const d = parse(b.due);
  if (b.recurrence === "weekly") d.setDate(d.getDate() + 7);
  if (b.recurrence === "monthly") d.setMonth(d.getMonth() + 1);
  if (b.recurrence === "quarterly") d.setMonth(d.getMonth() + 3);
  if (b.recurrence === "yearly") d.setFullYear(d.getFullYear() + 1);
  return ymd(d);
}

/** A day or two before the due date, but never in the past. */
export function remindBy(due: string, daysBefore = 2) {
  const d = parse(due);
  d.setDate(d.getDate() - daysBefore);
  return daysFrom(ymd(d)) < 0 ? ymd(new Date()) : ymd(d);
}

export const canCompare = (b: Bill) => b.category === "insurance" || b.category === "utilities";

/** Open tasks that belong to a bill: made from it, or already about comparing it. */
export function tasksFor(b: Bill, tasks: Task[]) {
  const name = b.name.toLowerCase();
  return tasks.filter(
    (t) => !t.done && ((t.from?.kind === "bill" && t.from.id === b.id) || (/compare|cancel/i.test(t.title) && t.title.toLowerCase().includes(name))),
  );
}

export function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (({ 1: "st", 2: "nd", 3: "rd" }) as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
}

export type Notice ={ id: string; text: string; source: SourceId; path: string };

const weeksAgo = (iso: string) => Math.round(-daysFrom(iso) / 7);
const countWord = (n: number) => ["no times", "once", "twice"][n] ?? `${n} times`;

/** Things Orbit noticed, as short plain sentences. Only facts found in the data. */
export function notices(bills: Bill[], txns: Txn[], accounts: Account[], fmt: (n: number) => string): Notice[] {
  const out: Notice[] = [];
  for (const b of bills) {
    if (b.previous && b.amount > b.previous && b.status !== "paid") {
      const what = b.recurrence === "yearly" ? "renewal" : "payment";
      out.push({
        id: `rise-${b.id}`,
        text: `${b.name} ${what} is ${fmt(b.amount)}, up ${fmt(b.amount - b.previous)} from ${fmt(b.previous)}.`,
        source: b.source,
        path: `money/bills/${b.id}`,
      });
    }
  }
  for (const b of bills) {
    if (b.kind !== "subscription" || !b.lastUsed || b.status === "paid" || -daysFrom(b.lastUsed) < 42) continue;
    const paid = txns.filter((t) => t.merchant === b.payee && t.amount < 0 && parse(t.date) > parse(b.lastUsed!)).length;
    out.push({
      id: `unused-${b.id}`,
      text: `The last ${b.name} ${b.usageSign ?? "sign of use"} was ${weeksAgo(b.lastUsed)} weeks ago. It has charged ${fmt(b.amount)} ${countWord(paid)} since.`,
      source: b.usageSource ?? b.source,
      path: `money/bills/${b.id}`,
    });
  }
  const recent = txns.filter((t) => isSpend(t, accounts) && t.category !== "bills" && -daysFrom(t.date) <= 30);
  const big = recent.reduce<Txn | null>((a, t) => (!a || t.amount < a.amount ? t : a), null);
  if (big && big.amount <= -150) {
    const acc = accounts.find((a) => a.id === big.accountId);
    out.push({
      id: `big-${big.id}`,
      text: `${fmt(-big.amount)} to ${big.merchant} was your largest single payment in the last 30 days, outside rent and bills.`,
      source: acc?.institution ?? "orbit",
      path: `money/transactions/${big.id}`,
    });
  }
  return out;
}
