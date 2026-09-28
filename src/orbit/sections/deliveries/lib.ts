import type { Order } from "../../data/plans";
import { dayLabel, daysFrom, on, parse, relDay, time } from "../../time";

export type Group = "today" | "way" | "ordered" | "delivered";

export const groupTitle: Record<Group, string> = {
  today: "Arriving today",
  way: "On the way",
  ordered: "Ordered",
  delivered: "Delivered",
};

const done = (o: Order) => o.status === "delivered" || o.status === "returned";

/** When it arrived: the last delivery event, or the expected date. */
export function deliveredAt(o: Order) {
  const ev = [...o.events].reverse().find((e) => /deliver|received/i.test(e.text));
  return ev?.at ?? o.eta ?? o.orderedAt;
}

export function groupOf(o: Order): Group | undefined {
  if (done(o)) return daysFrom(deliveredAt(o)) >= -30 ? "delivered" : undefined;
  if (o.status === "out-for-delivery" || (o.eta && daysFrom(o.eta) <= 0)) return "today";
  return o.status === "dispatched" ? "way" : "ordered";
}

const dayWord = (s: string) => (Math.abs(daysFrom(s)) <= 1 ? relDay(s).toLowerCase() : relDay(s));

/** "Today 11:00–13:00", "Arriving tomorrow", "Due Thursday". */
export function etaText(o: Order) {
  if (!o.eta) return "No date yet";
  const n = daysFrom(o.eta);
  if (n === 0) return o.etaEnd ? `Today ${time(o.eta)}–${time(o.etaEnd)}` : o.status === "out-for-delivery" ? "Today" : "Due today";
  if (n < 0) return `Was due ${dayWord(o.eta)}`;
  return n === 1 ? "Arriving tomorrow" : `Arriving ${relDay(o.eta)}`;
}

export type ReturnWindow = { text: string; short: string; urgent: boolean; open: boolean };

/** "Return by Fri 14 Nov, 12 days left". Urgent under five days. */
export function returnWindow(o: Order): ReturnWindow | undefined {
  if (!o.returnBy || o.status === "returned") return undefined;
  const n = daysFrom(o.returnBy);
  const by = `Return by ${dayLabel(o.returnBy)}`;
  if (n < 0) return { text: "Return window closed", short: "Closed", urgent: false, open: false };
  const left = n === 0 ? "last day" : n === 1 ? "1 day left" : `${n} days left`;
  return { text: `${by}, ${left}`, short: left, urgent: n < 5, open: true };
}

/** The date for a "remind me to return" task: two days before the deadline, never in the past. */
export function returnReminderDue(o: Order) {
  const n = daysFrom(o.returnBy!) - 2;
  return on(Math.max(0, n));
}

export function itemsLine(o: Order) {
  const first = o.items[0]?.name ?? "Order";
  const more = o.items.length - 1;
  return more > 0 ? `${first} + ${more} more` : first;
}

export const eventStamp = (s: string) => `${relDay(s)}, ${time(s)}`;

export const byEta = (a: Order, b: Order) => (a.eta ?? a.orderedAt).localeCompare(b.eta ?? b.orderedAt);
export const byDeliveredDesc = (a: Order, b: Order) => parse(deliveredAt(b)).getTime() - parse(deliveredAt(a)).getTime();

const words = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
export const count = (n: number) => words[n] ?? String(n);
