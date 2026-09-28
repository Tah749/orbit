import type { DB } from "../../store";
import type { SourceId } from "../../data/sources";
import type { Booking } from "../../data/plans";
import type { Message } from "../../data/mail";
import type { Contact } from "../../data/life";
import { dayLabel, daysFrom, on, parse, time } from "../../time";
import { money } from "../../ui";

/* ------------------------------------------------------------------------------------------------
 * Shared reading of the store for Today and Ask Orbit. Pure functions of the data and the clock,
 * so both pages say the same thing about the same day.
 * ---------------------------------------------------------------------------------------------- */

export { visible } from "../../visible";

/** Sources that are switched off, by name, for honest "nothing to show" answers. */
export const offline = (d: DB) => new Set<SourceId>(d.connections.filter((c) => c.status !== "connected").map((c) => c.id));

/* Words ------------------------------------------------------------------------------------------ */

const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const count = (n: number) => words[n] ?? String(n);
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const proper = /^(Mum|Dad|Sam|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|The|Q\d)\b/;
/** "Team stand-up" → "team stand-up", but leaves "Mum's birthday" and "Q3 review" alone. */
export const lower = (s: string) => (/^[A-Z][a-z]/.test(s) && !proper.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

export function list(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "today", "tomorrow", "on Thursday", "on Thu 8 Oct". */
export function when(s: string) {
  const n = daysFrom(s);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  if (n > 1 && n < 7) return `on ${new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(parse(s))}`;
  return `on ${dayLabel(s)}`;
}

/** First name, or the relationship in brackets: "Jan Rowe (Mum)" → "Mum". */
export function firstName(name: string) {
  const alias = name.match(/\(([^)]+)\)/);
  if (alias) return alias[1];
  return name.split(/\s+/)[0];
}

/** "Numbers for Thursday" → "numbers for Thursday"; drops a trailing question mark. */
export const topic = (subject: string) => lower(subject.replace(/[?.!]+$/, ""));

/* Days ------------------------------------------------------------------------------------------- */

export const today = () => on(0);

/** Next occurrence of an MM-DD birthday, as YYYY-MM-DD (today counts). */
export function nextBirthday(c: Contact) {
  if (!c.birthday) return undefined;
  const t = today();
  const y = Number(t.slice(0, 4));
  const d = `${y}-${c.birthday}`;
  return d >= t ? d : `${y + 1}-${c.birthday}`;
}

export function eventsOn(d: DB, offset: number) {
  return d.events
    .filter((e) => (e.allDay ? daysFrom(e.start) <= offset && daysFrom(e.end) > offset : daysFrom(e.start) === offset))
    .sort((a, b) => (a.allDay === b.allDay ? a.start.localeCompare(b.start) : a.allDay ? -1 : 1));
}

/** "between 11:00 and 13:00" from a tracking event, or "from 11:00". */
export function deliveryWindow(o: DB["orders"][number]) {
  const last = o.events[o.events.length - 1]?.text ?? "";
  const m = last.match(/(\d\d:\d\d) to (\d\d:\d\d)/);
  if (m) return `between ${m[1]} and ${m[2]}`;
  return o.eta ? `from ${time(o.eta)}` : "";
}

export const isActiveOrder = (o: DB["orders"][number]) => o.status === "ordered" || o.status === "dispatched" || o.status === "out-for-delivery";

/** Upcoming flight within `days`, with the trip and the diary entry it belongs to. */
export function nextFlight(d: DB, now: Date, days = 400) {
  const f = d.bookings
    .filter((b) => b.kind === "flight" && b.status !== "cancelled" && parse(b.start) > now && daysFrom(b.start) <= days)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (!f) return undefined;
  return {
    flight: f,
    trip: d.trips.find((t) => t.id === f.tripId),
    event: d.events.find((e) => e.links?.some((l) => l.kind === "booking" && l.id === f.id)),
    checkinTask: d.tasks.find((t) => !t.done && t.from?.kind === "booking" && t.from.id === f.id),
    checkinMail: d.messages.find((m) => m.links?.some((l) => l.kind === "booking" && l.id === f.id) && /check-in/i.test(m.subject)),
  };
}

/** "BZ 1452" from "BZ 1452 · LHR to EDI". */
export const flightNo = (b: Booking) => b.title.split("·")[0].trim();

export const nights = (b: Booking) => (b.end ? Math.max(1, daysFrom(b.end) - daysFrom(b.start)) : 1);

/* Needs you --------------------------------------------------------------------------------------- */

export type Need = {
  key: string;
  kind: "task" | "reply" | "checkin" | "price" | "shop";
  title: string;
  reason: string;
  /** Short timing note shown on the right. */
  due?: string;
  source: SourceId;
  href: string;
  score: number;
  taskId?: string;
  messageId?: string;
};

const senderName = (m: Message) => (m.from.name === "Mum" ? "Mum" : m.from.name);

/** Everything that wants a decision from Alex, most pressing first. */
export function needsYou(d: DB, now: Date, withShop: boolean): Need[] {
  const t = today();
  const out: Need[] = [];

  for (const k of d.tasks) {
    if (k.done || !k.due || k.due > t) continue;
    const late = k.due < t;
    out.push({
      key: `task:${k.id}`,
      kind: "task",
      title: k.title,
      reason: k.notes ?? (late ? `Was due ${when(k.due)}` : "Due today"),
      due: late ? (daysFrom(k.due) === -1 ? "Overdue" : `${-daysFrom(k.due)} days late`) : "Today",
      source: k.source,
      href: `tasks/${k.id}`,
      score: late ? 100 : k.priority ? 92 : 88,
      taskId: k.id,
    });
  }

  const f = nextFlight(d, now, 2);
  if (f && f.flight.status === "confirmed" && (f.checkinTask || f.checkinMail)) {
    const where = f.trip?.title ?? f.flight.title.split(" to ").pop();
    out.push({
      key: `checkin:${f.flight.id}`,
      kind: "checkin",
      title: `Check in for ${flightNo(f.flight)}`,
      reason: `Check-in is open. The flight to ${where} leaves ${when(f.flight.start)} at ${time(f.flight.start)}.`,
      due: daysFrom(f.flight.start) === 0 ? "Today" : "Before the flight",
      source: f.checkinMail?.source ?? f.flight.source,
      href: f.checkinMail ? `inbox/${f.checkinMail.id}` : `plans/${f.flight.id}`,
      score: 95,
      taskId: f.checkinTask?.id,
    });
  }

  d.messages
    .filter((m) => m.folder === "inbox" && m.needsReply)
    .sort((a, b) => Number(!!b.why) - Number(!!a.why) || b.date.localeCompare(a.date))
    .forEach((m, i) =>
      out.push({
        key: `reply:${m.id}`,
        kind: "reply",
        title: `Reply to ${senderName(m)}`,
        reason: m.why ? `${m.subject.replace(/[?.!]+$/, "")}. ${m.why}.` : m.subject,
        due: daysFrom(m.date) === 0 ? `Sent ${time(m.date)}` : `Sent ${when(m.date).replace(/^on /, "")}`,
        source: m.source,
        href: `inbox/${m.id}`,
        score: 80 - i,
        messageId: m.id,
      }),
    );

  for (const b of d.bills) {
    if (b.status !== "upcoming" || b.previous == null || b.amount - b.previous < 10 || daysFrom(b.due) > 30) continue;
    out.push({
      key: `price:${b.id}`,
      kind: "price",
      title: `${b.name} is going up by ${money(b.amount - b.previous)}`,
      reason: `${money(b.amount)}, from ${money(b.previous)} last time. ${b.autopay ? `It renews automatically ${when(b.due)}.` : `Due ${when(b.due)}.`}`,
      due: `${daysFrom(b.due)} days`,
      source: b.source,
      href: `money/bills/${b.id}`,
      score: 50,
    });
  }

  if (withShop) {
    const late = d.shopOrders.filter((o) => o.status === "unfulfilled" && daysFrom(o.date) < 0);
    if (late.length) {
      out.push({
        key: `shop:${late.map((o) => o.id).join(",")}`,
        kind: "shop",
        title: `${cap(count(late.length))} shop ${late.length === 1 ? "order" : "orders"} still to send`,
        reason: `${list(late.map((o) => `${o.number} to ${o.shipTo}`))}, from ${when(late[0].date).replace(/^on /, "")}.`,
        due: "Fern & Thread",
        source: late[0].channel,
        href: "business",
        score: 45,
      });
    }
  }

  return out.sort((a, b) => b.score - a.score);
}

/* Coming up --------------------------------------------------------------------------------------- */

export type Upcoming = {
  key: string;
  date: string;
  /** For ordering within a day. */
  sort: string;
  kind: "bill" | "booking" | "birthday" | "renewal" | "delivery";
  title: string;
  meta: string;
  amount?: number;
  source: SourceId;
  href: string;
};

const renewVerb = (kind: DB["docs"][number]["kind"]) => (kind === "mot" ? "due" : kind === "passport" || kind === "licence" || kind === "warranty" || kind === "health" ? "expires" : "renews");

/** Bills, bookings, birthdays, renewals and deliveries from tomorrow to `days` ahead. */
export function comingUp(d: DB, from = 1, days = 10): Upcoming[] {
  const inRange = (s?: string) => !!s && daysFrom(s) >= from && daysFrom(s) <= days;
  const acct = (id: string) => d.accounts.find((a) => a.id === id)?.name;
  const out: Upcoming[] = [];

  for (const b of d.bills) {
    if (b.status === "paid" || !inRange(b.due)) continue;
    out.push({
      key: b.id,
      date: b.due,
      sort: "1",
      kind: "bill",
      title: b.name,
      meta: b.autopay ? `Direct Debit${acct(b.accountId) ? ` from ${acct(b.accountId)}` : ""}` : `To pay ${b.payee}`,
      amount: b.amount,
      source: b.source,
      href: `money/bills/${b.id}`,
    });
  }
  for (const b of d.bookings) {
    if (b.status === "cancelled" || !inRange(b.start)) continue;
    const meta =
      b.kind === "flight"
        ? `${time(b.start)} · ${b.provider} · ref ${b.ref}`
        : b.kind === "hotel"
          ? `Check in from ${time(b.start)} · ${nights(b)} ${nights(b) === 1 ? "night" : "nights"}`
          : `${time(b.start)} · ${b.details.find(([k]) => k === "Table for") ? `table for ${b.details.find(([k]) => k === "Table for")![1]}` : b.provider}`;
    out.push({ key: b.id, date: b.start, sort: `0${b.start}`, kind: "booking", title: b.title, meta, source: b.source, href: `plans/${b.id}` });
  }
  for (const c of d.contacts) {
    const bd = nextBirthday(c);
    if (!inRange(bd)) continue;
    const gift = d.tasks.find((t) => !t.done && t.from?.kind === "contact" && t.from.id === c.id);
    out.push({
      key: `bd-${c.id}`,
      date: bd!,
      sort: "2",
      kind: "birthday",
      title: `${firstName(c.name)}'s birthday`,
      meta: gift ? `Still to do: ${lower(gift.title)}` : c.notes ?? "",
      source: c.source,
      href: `people/${c.id}`,
    });
  }
  for (const x of d.docs) {
    if (!inRange(x.expires)) continue;
    // A renewal that's also a bill on the same day is shown once, as the bill.
    if (d.bills.some((b) => b.due === x.expires && b.name.toLowerCase() === x.title.toLowerCase())) continue;
    out.push({ key: x.id, date: x.expires!, sort: "3", kind: "renewal", title: `${x.title} ${renewVerb(x.kind)}`, meta: x.notes ?? x.reference ?? "", source: x.source, href: `admin/${x.id}` });
  }
  for (const o of d.orders) {
    if (!isActiveOrder(o) || !inRange(o.eta)) continue;
    out.push({
      key: o.id,
      date: o.eta!,
      sort: "4",
      kind: "delivery",
      title: `${o.retailer} parcel`,
      meta: `${o.items.map((i) => i.name).join(", ")}${o.carrier ? ` · ${o.carrier}` : ""}`,
      source: o.source,
      href: `deliveries/${o.id}`,
    });
  }
  return out.sort((a, b) => a.date.slice(0, 10).localeCompare(b.date.slice(0, 10)) || a.sort.localeCompare(b.sort));
}

/* The written briefing ---------------------------------------------------------------------------- */

/** Two to four plain sentences about the day, composed from the data. */
export function briefing(d: DB, now: Date): string[] {
  const out: string[] = [];

  // The diary.
  const timed = eventsOn(d, 0).filter((e) => !e.allDay);
  const left = timed.filter((e) => parse(e.end) > now);
  const item = (e: (typeof timed)[number]) => `${lower(e.title)} at ${time(e.start)}`;
  if (!timed.length) out.push("Nothing is in the diary today.");
  else if (!left.length) out.push("That's everything in the diary done for today.");
  else {
    const all = left.length === timed.length;
    const head = all ? `${cap(count(left.length))} ${left.length === 1 ? "thing" : "things"} in the diary today` : `${cap(count(left.length))} ${left.length === 1 ? "thing" : "things"} left in the diary today`;
    out.push(left.length <= 4 ? `${head}: ${list(left.map(item))}.` : `${head}, starting with ${item(left[0])} and finishing with ${item(left[left.length - 1])}.`);
  }

  // Travel in the next two days.
  const f = nextFlight(d, now, 2);
  if (f) {
    const where = f.trip?.title ?? f.flight.title.split(" to ").pop();
    const from = f.event?.location ? ` from ${f.event.location}` : "";
    let s = `${cap(when(f.flight.start))} you fly to ${where} at ${time(f.flight.start)}${from}`;
    if (f.checkinTask) s += " (check-in is open)";
    const hotel = f.trip && d.bookings.find((b) => b.kind === "hotel" && b.tripId === f.trip!.id);
    if (hotel) s += `, with ${count(nights(hotel))} ${nights(hotel) === 1 ? "night" : "nights"} booked at ${hotel.title}`;
    out.push(`${s}.`);
  }

  // Replies.
  const waiting = d.messages
    .filter((m) => m.folder === "inbox" && m.needsReply)
    .sort((a, b) => Number(!!b.why) - Number(!!a.why) || b.date.localeCompare(a.date));
  if (waiting.length) {
    const top = waiting.slice(0, 2).map((m) => `${firstName(m.from.name)} (${topic(m.subject)})`);
    const rest = waiting.length - top.length;
    out.push(
      `${list(top)} ${top.length === 1 ? "is" : "are"} waiting for a reply${rest ? `, with ${count(rest)} more in the inbox` : ""}.`,
    );
  }

  // Money and parcels share a sentence.
  const bills = d.bills.filter((b) => b.status === "upcoming" && daysFrom(b.due) >= 0 && daysFrom(b.due) <= 4).sort((a, b) => a.due.localeCompare(b.due));
  const parts: string[] = [];
  if (bills.length === 1) {
    const b = bills[0];
    parts.push(`${cap(lower(b.name))} (${money(b.amount)}) ${b.autopay ? "goes out by Direct Debit" : "is due"} ${when(b.due)}`);
  } else if (bills.length > 1) {
    const total = bills.reduce((s, b) => s + b.amount, 0);
    const shown = bills.slice(0, 3).map((b, i) => `${i ? (b.kind === "bill" ? lower(b.name) : b.name) : cap(lower(b.name))} (${money(b.amount)})`);
    if (bills.length > 3) shown.push(`${count(bills.length - 3)} more`);
    parts.push(`${list(shown)} go out ${bills.every((b) => b.autopay) ? "by Direct Debit " : ""}by ${when(bills[bills.length - 1].due).replace(/^on /, "")}, ${money(total)} in all`);
  }
  const parcel = d.orders.find((o) => o.status === "out-for-delivery" && o.eta && daysFrom(o.eta) === 0);
  if (parcel) parts.push(`${parts.length ? "your" : "Your"} ${parcel.retailer} parcel should arrive ${deliveryWindow(parcel)}`);
  if (parts.length) out.push(`${parts.join(", and ")}.`);

  return out.slice(0, 4);
}
