import type { DB } from "../../seed";
import type { SourceId } from "../../data/sources";
import type { Booking } from "../../data/plans";
import type { Category } from "../../data/money";
import { categoryName } from "../../data/money";
import type { Contact } from "../../data/life";
import type { Message } from "../../data/mail";
import { daysFrom, on, parse, relDay, time } from "../../time";
import { money } from "../../format";
import { cap, count, deliveryWindow, eventsOn, firstName, flightNo, isActiveOrder, list, lower, nextBirthday, nights, topic, visible, when } from "../today/derive";

/* ------------------------------------------------------------------------------------------------
 * Ask Orbit's answer engine. Deterministic and local: it matches the question to a topic with
 * weighted keywords, reads the store, and writes a short answer with the items it used as sources.
 * It never invents: if the data isn't there, it says so.
 * ---------------------------------------------------------------------------------------------- */

export type Cite = { title: string; source: SourceId; date?: string; meta?: string; href: string };
export type Answer = { text: string; cites: Cite[]; matched: boolean };

type Ctx = { q: string; raw: string; v: DB; all: DB; now: Date; person?: Person };
type Intent = { name: string; weights: [RegExp, number][]; run: (c: Ctx) => Answer };

export const suggestions = [
  "What do I need to sort before Friday?",
  "When is my flight?",
  "Which bills are due this week?",
  "How much have I spent on eating out this month?",
  "When does my car insurance renew?",
  "Where are my parcels?",
  "How is the shop doing this week?",
  "Whose birthday is next?",
  "Am I free on Wednesday afternoon?",
];

/* Language helpers -------------------------------------------------------------------------------- */

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’`]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9'&£.:\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const wdRe = "(sun|mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?)(?:day)?";
const wdIndex = (w: string) => WD.findIndex((d) => d.startsWith(w.slice(0, 3)));
const offsetTo = (w: string, now: Date) => (wdIndex(w) - now.getDay() + 7) % 7;
const endOfWeek = (now: Date) => (7 - now.getDay()) % 7; // Sunday
const endOfMonth = (now: Date) => new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
const numWords: Record<string, number> = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fourteen: 14, thirty: 30 };

/** A single day mentioned in the question, as an offset from today. */
function dayIn(q: string, now: Date): { offset: number; label: string } | undefined {
  if (/\b(today|tonight|this (morning|afternoon|evening))\b/.test(q)) return { offset: 0, label: "today" };
  if (/\btomorrow\b/.test(q)) return { offset: 1, label: "tomorrow" };
  if (/\byesterday\b/.test(q)) return { offset: -1, label: "yesterday" };
  const m = q.match(new RegExp(`\\b(next )?${wdRe}\\b`));
  if (m) {
    let n = offsetTo(m[2], now);
    if (m[1] && n < 7 && n === 0) n = 7;
    return { offset: n, label: n === 0 ? "today" : n === 1 ? "tomorrow" : when(on(n)) };
  }
  return undefined;
}

type Span = { from: number; to: number; label: string };

/** A range of days mentioned in the question ("before Friday", "this week", "next 10 days"). */
function spanIn(q: string, now: Date): Span | undefined {
  const before = q.match(new RegExp(`\\b(before|until|till|by) ${wdRe}\\b`));
  if (before) {
    const n = offsetTo(before[2], now) || 7;
    const name = cap(WD[wdIndex(before[2])]);
    return before[1] === "by" ? { from: 0, to: n, label: `by ${name}` } : { from: 0, to: n - 1, label: `before ${name}` };
  }
  if (/\b(this|the) weekend\b/.test(q)) {
    const sat = (6 - now.getDay() + 7) % 7;
    return { from: now.getDay() === 0 ? 0 : sat, to: endOfWeek(now), label: "this weekend" };
  }
  if (/\bnext week\b/.test(q)) return { from: endOfWeek(now) + 1, to: endOfWeek(now) + 7, label: "next week" };
  if (/\bthis week\b|\bthe week\b/.test(q)) return { from: 0, to: endOfWeek(now), label: "this week" };
  if (/\bnext month\b/.test(q)) {
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { from: endOfMonth(now) + 1, to: daysFrom(end.toISOString()), label: "next month" };
  }
  if (/\bthis month\b|\bthe month\b/.test(q)) return { from: 0, to: endOfMonth(now), label: "this month" };
  const next = q.match(/\b(?:next|coming|within) (\d+|[a-z]+) days?\b/);
  if (next) {
    const n = Number(next[1]) || numWords[next[1]];
    if (n) return { from: 0, to: n, label: `in the next ${n} days` };
  }
  if (/\b(today|tonight)\b/.test(q)) return { from: 0, to: 0, label: "today" };
  if (/\btomorrow\b/.test(q)) return { from: 1, to: 1, label: "tomorrow" };
  return undefined;
}

/** "in 10 days", or "in about 7 months" for anything far off. */
function distance(s: string) {
  const n = daysFrom(s);
  if (n < 0) return `${-n} days ago`;
  if (n <= 1) return n ? "tomorrow" : "today";
  if (n < 60) return `in ${n} days`;
  const months = Math.round(n / 30.4);
  return months < 24 ? `in about ${months} months` : `in about ${Math.round(n / 365)} years`;
}

const fullDate = (s: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long", ...(daysFrom(s) > 200 ? { year: "numeric" } : {}) }).format(parse(s)).replace(",", "");

/** "tomorrow", "on Friday", or "on Wed 14 October" further out. */
const onDay = (s: string) => (daysFrom(s) < 7 ? when(s) : `on ${fullDate(s)}`);

const plural = (n: number, one: string, many = `${one}s`) => `${count(n)} ${n === 1 ? one : many}`;

/* People ----------------------------------------------------------------------------------------- */

type Person = { name: string; short: string; contact?: Contact; emails: string[] };

function people(d: DB): { re: RegExp; p: Person }[] {
  const out = new Map<string, Person>();
  const add = (key: string, p: Person) => {
    const k = norm(key);
    if (k.length > 2 && !out.has(k)) out.set(k, p);
  };
  for (const c of d.contacts) {
    const p: Person = { name: c.name.replace(/\s*\(.*\)/, ""), short: firstName(c.name), contact: c, emails: c.email ? [c.email] : [] };
    add(c.name.replace(/\s*\(.*\)/, ""), p);
    add(firstName(c.name), p);
    add(c.name.split(" ")[0], p);
    if (c.relation === "home" && /landlord/i.test(c.notes ?? "")) add("landlord", p);
    if (c.relation === "partner") add("partner", p);
  }
  for (const m of d.messages) {
    if (m.folder === "sent") continue;
    const known = [...out.values()].find((p) => p.emails.includes(m.from.email) || p.short === m.from.name);
    if (known) {
      if (!known.emails.includes(m.from.email)) known.emails.push(m.from.email);
      continue;
    }
    const p: Person = { name: m.from.name, short: m.from.name.split(" ")[0], emails: [m.from.email] };
    add(m.from.name, p);
    // A single first name is enough for people, not for companies ("Royal", "Hotel").
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(m.from.name) && !/(mail|air|energy|insurance|hotel|shop)/i.test(m.from.name)) add(m.from.name.split(" ")[0], p);
  }
  return [...out].sort((a, b) => b[0].length - a[0].length).map(([k, p]) => ({ re: new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}('s)?\\b`), p }));
}

/* Citations -------------------------------------------------------------------------------------- */

const cite = {
  event: (e: DB["events"][number]): Cite => ({ title: e.title, source: e.source, date: e.allDay ? relDay(e.start) : `${relDay(e.start)}, ${time(e.start)}`, meta: e.location, href: `calendar/${e.id}` }),
  task: (t: DB["tasks"][number]): Cite => ({ title: t.title, source: t.source, date: t.due ? relDay(t.due) : undefined, meta: "Task", href: `tasks/${t.id}` }),
  message: (m: Message): Cite => ({ title: m.subject, source: m.source, date: relDay(m.date), meta: m.from.name, href: `inbox/${m.id}` }),
  bill: (b: DB["bills"][number]): Cite => ({ title: `${b.name} · ${money(b.amount)}`, source: b.source, date: relDay(b.due), meta: b.payee, href: `money/bills/${b.id}` }),
  booking: (b: Booking): Cite => ({ title: b.title, source: b.source, date: relDay(b.start), meta: `${b.provider} · ref ${b.ref}`, href: `plans/${b.id}` }),
  order: (o: DB["orders"][number]): Cite => ({ title: `${o.retailer}: ${o.items.map((i) => i.name).join(", ")}`, source: o.source, date: o.eta ? relDay(o.eta) : undefined, meta: o.carrier, href: `deliveries/${o.id}` }),
  doc: (x: DB["docs"][number]): Cite => ({ title: x.title, source: x.source, date: x.expires ? relDay(x.expires) : undefined, meta: x.reference, href: `admin/${x.id}` }),
  contact: (c: Contact): Cite => ({ title: c.name, source: c.source, date: c.birthday ? relDay(nextBirthday(c)!) : undefined, meta: "Contact", href: `people/${c.id}` }),
};

const answer = (text: string, cites: Cite[] = []): Answer => ({ text, cites, matched: true });

/* Topics ----------------------------------------------------------------------------------------- */

const airports: Record<string, string> = { LHR: "Heathrow", LGW: "Gatwick", EDI: "Edinburgh", LIS: "Lisbon", STN: "Stansted", LCY: "London City" };

function flightWords(b: Booking) {
  const m = b.title.match(/([A-Z]{3}) to ([A-Z]{3})/);
  const term = b.details.find(([k]) => k === "Terminal")?.[1];
  const from = m ? airports[m[1]] ?? m[1] : "";
  const to = m ? airports[m[2]] ?? m[2] : "";
  const t = term ? (/^\d+$/.test(term) ? ` T${term}` : term === "Main" ? "" : ` ${term}`) : "";
  return { from: `${from}${t}`, to };
}

const fact = (b: Booking, key: string) => b.details.find(([k]) => k === key)?.[1];

function travel(c: Ctx): Answer {
  const { q, v, now } = c;
  const future = v.bookings.filter((b) => b.status !== "cancelled" && parse(b.end ?? b.start) > now).sort((a, b) => a.start.localeCompare(b.start));
  const place = v.trips.find((t) => q.includes(norm(t.title)) || q.includes(norm(t.destination.split(",")[0])));
  const pool = place ? future.filter((b) => b.tripId === place.id) : future;

  if (/\b(hotel|stay|staying|airbnb|accommodation|check.?out)\b/.test(q)) {
    const h = pool.find((b) => b.kind === "hotel");
    if (!h) return answer(place ? `I can't see a place to stay booked for ${place.title}.` : "There's no hotel or stay booked from now on.");
    const addr = fact(h, "Address");
    const extras = [fact(h, "Room"), fact(h, "Breakfast") === "Included" ? "breakfast included" : undefined].filter(Boolean).join(", ");
    const started = parse(h.start) <= now;
    return answer(
      `${started ? "You're staying" : "You're booked"} at ${h.title}${addr ? `, ${addr}` : ""}, for ${plural(nights(h), "night")} ${started ? `until ${when(h.end!).replace(/^on /, "")}` : `from ${when(h.start).replace(/^on /, "")}`}. Check-in is from ${time(h.start)} and check-out by ${time(h.end!)}${extras ? `; ${extras}` : ""}. Reference ${h.ref}.`,
      [cite.booking(h)],
    );
  }

  if (/\b(restaurant|dinner|table|reservation|eating)\b/.test(q)) {
    const r = pool.find((b) => b.kind === "restaurant");
    if (!r) return answer("There are no restaurant bookings coming up.");
    const size = fact(r, "Table for");
    const more = pool.filter((b) => b.kind === "restaurant" && b.id !== r.id);
    return answer(
      `Your next table is at ${r.title} ${when(r.start)} at ${time(r.start)}${size ? `, for ${Number(size) ? count(Number(size)) : size}` : ""}${fact(r, "Address") ? ` (${fact(r, "Address")})` : ""}.${more.length ? ` After that: ${list(more.map((b) => `${b.title} ${when(b.start)}`))}.` : ""}`,
      [r, ...more].map(cite.booking),
    );
  }

  if (/\b(tickets?|gig|concert|show|event)\b/.test(q)) {
    const e = pool.find((b) => b.kind === "event");
    if (!e) return answer("There are no tickets booked from now on.");
    return answer(`${e.title} is ${onDay(e.start)} at ${time(e.start)}. ${e.details.map(([k, val]) => `${k}: ${val}`).join("; ")}.`, [cite.booking(e)]);
  }

  const flights = pool.filter((b) => b.kind === "flight");
  const wantsTrip = /\b(trip|holiday|travel\w*|away|going|break)\b/.test(q) && !/\bflights?\b/.test(q);
  if (wantsTrip || (place && !/\b(fly|flight|flying|check.?in)\b/.test(q))) {
    const trip = place ?? v.trips.filter((t) => daysFrom(t.end) >= 0).sort((a, b) => a.start.localeCompare(b.start))[0];
    if (!trip) return answer("There are no trips booked from now on.");
    const bs = future.filter((b) => b.tripId === trip.id);
    const out = bs.find((b) => b.kind === "flight");
    const back = [...bs].reverse().find((b) => b.kind === "flight" && b.id !== out?.id);
    const stay = bs.find((b) => b.kind === "hotel");
    const with_ = trip.travellers.filter((t) => t !== "Alex");
    const parts = [
      `Your next trip is ${trip.title}, ${when(trip.start).replace(/^on /, "")} to ${when(trip.end).replace(/^on /, "")}${with_.length ? `, with ${list(with_)}` : ""}.`,
      out ? `You fly out on ${flightNo(out)} at ${time(out.start)}${back ? ` and back on ${flightNo(back)} ${when(back.start)} at ${time(back.start)}` : ""}.` : "",
      stay ? `You're staying at ${stay.title}${fact(stay, "Area") ? ` in ${fact(stay, "Area")}` : ""}.` : "",
    ];
    return answer(parts.filter(Boolean).join(" "), bs.map(cite.booking));
  }

  if (!flights.length) return answer(place ? `I can't see any flights booked for ${place.title}.` : "There are no flights booked from now on.");
  const wantsBack = /\b(back|return|home)\b/.test(q);
  const f = (wantsBack ? [...flights].reverse().find((b) => b.tripId === flights[0].tripId && b.id !== flights[0].id) : undefined) ?? flights[0];
  const w = flightWords(f);
  const seats = fact(f, "Seats");
  const task = v.tasks.find((t) => !t.done && t.from?.kind === "booking" && t.from.id === f.id);
  const mail = v.messages.find((m) => m.links?.some((l) => l.kind === "booking" && l.id === f.id));
  const checkin =
    f.status === "checked-in"
      ? "You're checked in."
      : task
        ? `Check-in is open and still to do${seats && seats !== "Not chosen" ? `; seats ${seats}` : ""}.`
        : seats === "Not chosen"
          ? "Seats aren't chosen yet."
          : "";
  const text = `${/\bcheck.?in\b/.test(q) && task ? "Check-in is open for" : wantsBack ? "Your flight back is" : "Your next flight is"} ${flightNo(f)} from ${w.from} to ${w.to}, ${when(f.start)} at ${time(f.start)}${f.end ? `, landing at ${time(f.end)}` : ""}. ${checkin ? `${checkin} ` : ""}Booking reference ${f.ref}.`;
  const cites = [cite.booking(f)];
  if (task) cites.push(cite.task(task));
  if (mail) cites.push(cite.message(mail));
  return answer(text.replace(/\s+/g, " "), cites);
}

const billWords: [RegExp, (b: DB["bills"][number]) => boolean][] = [
  [/\brent\b/, (b) => b.category === "housing"],
  [/\bcouncil tax\b/, (b) => b.category === "tax"],
  [/\b(electric\w*|energy|power)\b/, (b) => b.name === "Electricity"],
  [/\b(broadband|internet|wifi|wi-fi)\b/, (b) => b.name === "Broadband"],
  [/\bwater\b/, (b) => b.name === "Water"],
  [/\b(mobile|phone bill|phone contract)\b/, (b) => b.category === "phone"],
  [/\bcar insurance\b/, (b) => b.name === "Car insurance"],
];

function bills(c: Ctx): Answer {
  const { q, v, now } = c;
  const upcoming = v.bills.filter((b) => b.status !== "paid" && daysFrom(b.due) >= 0).sort((a, b) => a.due.localeCompare(b.due));
  // A named bill or subscription.
  const named = upcoming.find((b) => billWords.some(([re, f]) => re.test(q) && f(b)) || new RegExp(`\\b${norm(b.name)}\\b`).test(q) || new RegExp(`\\b${norm(b.payee)}\\b`).test(q));
  if (named) {
    const change = named.previous != null ? ` That's ${named.amount > named.previous ? "up" : "down"} from ${money(named.previous)}.` : "";
    const how = named.autopay ? `It's paid by Direct Debit from ${v.accounts.find((a) => a.id === named.accountId)?.name ?? "your account"}.` : "It isn't on Direct Debit, so it needs paying by hand.";
    return answer(`${named.name} (${money(named.amount)} to ${named.payee}) is due ${onDay(named.due)}, ${distance(named.due)}. ${how}${change}`, [cite.bill(named)]);
  }

  const subsOnly = /\bsubscriptions?\b/.test(q);
  if (subsOnly && !spanIn(q, now)) {
    const subs = v.bills.filter((b) => b.kind === "subscription");
    const monthly = subs.reduce((s, b) => s + (b.recurrence === "yearly" ? b.amount / 12 : b.recurrence === "quarterly" ? b.amount / 3 : b.amount), 0);
    const rises = subs.filter((b) => b.previous != null && b.amount > b.previous);
    return answer(
      `You have ${plural(subs.length, "subscription")}, about ${money(monthly)} a month: ${list(subs.map((b) => `${b.name} ${money(b.amount)}`))}.${rises.length ? ` ${list(rises.map((b) => b.name))} went up recently.` : ""}`,
      subs.map(cite.bill),
    );
  }

  const span = spanIn(q, now) ?? { from: 0, to: 7, label: "in the next 7 days" };
  const due = upcoming.filter((b) => (!subsOnly || b.kind === "subscription") && daysFrom(b.due) >= span.from && daysFrom(b.due) <= span.to);
  const noun = subsOnly ? "subscription" : "bill";
  if (!due.length) {
    const next = upcoming.find((b) => daysFrom(b.due) > span.to && (!subsOnly || b.kind === "subscription"));
    return answer(`Nothing is due ${span.label}.${next ? ` The next ${noun} is ${lower(next.name)} (${money(next.amount)}) ${when(next.due)}.` : ""}`, next ? [cite.bill(next)] : []);
  }
  const total = due.reduce((s, b) => s + b.amount, 0);
  const manual = due.filter((b) => !b.autopay);
  const shown = due.slice(0, 6).map((b) => `${b.kind === "bill" ? lower(b.name) : b.name} ${money(b.amount)} ${when(b.due).replace(/^on /, "")}`);
  if (due.length > 6) shown.push(`${count(due.length - 6)} more`);
  const pay = manual.length ? `${list(manual.map((b) => b.name))} ${manual.length === 1 ? "needs" : "need"} paying by hand; the rest go out by Direct Debit.` : "All of them go out by Direct Debit.";
  return answer(`${cap(plural(due.length, noun))} ${due.length === 1 ? "is" : "are"} due ${span.label}, ${money(total)} in total: ${list(shown)}. ${pay}`, due.map(cite.bill));
}

const catWords: [RegExp, Category][] = [
  [/\b(groceries|grocery|supermarkets?|food shop\w*|sainsbury'?s|tesco|waitrose)\b/, "groceries"],
  [/\b(eating out|restaurants?|takeaways?|coffee|lunch(es)?|food out|deliveroo)\b/, "eating-out"],
  [/\b(transport|travel ?card|tfl|tube|uber|taxis?|trains?|commut\w*)\b/, "transport"],
  [/\b(shopping|clothes)\b/, "shopping"],
  [/\b(entertainment|cinema|netflix|going out)\b/, "entertainment"],
  [/\b(health|pharmacy|boots|gym)\b/, "health"],
  [/\b(travel|flights?|holidays?)\b/, "travel"],
  [/\bbills\b/, "bills"],
];

function spending(c: Ctx): Answer {
  const { q, v, now } = c;
  let from: number;
  let to = 0;
  let label: string;
  const mon = (now.getDay() + 6) % 7;
  if (/\blast week\b/.test(q)) (from = -mon - 7), (to = -mon - 1), (label = "last week");
  else if (/\bthis week\b/.test(q)) (from = -mon), (label = "this week");
  else if (/\blast month\b/.test(q)) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    from = daysFrom(start.toISOString());
    to = -now.getDate();
    label = "last month";
  } else if (/\b(last|past) (\d+|[a-z]+) days\b/.test(q)) {
    const m = q.match(/\b(?:last|past) (\d+|[a-z]+) days\b/)!;
    const n = Number(m[1]) || numWords[m[1]] || 7;
    from = -(n - 1);
    label = `in the last ${n} days`;
  } else if (/\btoday\b/.test(q)) (from = 0), (label = "today");
  else (from = -(now.getDate() - 1)), (label = "this month");

  const out = v.txns.filter((t) => t.amount < 0 && !["transfers", "business", "income"].includes(t.category) && daysFrom(t.date) >= from && daysFrom(t.date) <= to);
  const acc = (id: string) => v.accounts.find((a) => a.id === id);
  const txCite = (t: DB["txns"][number]): Cite => ({ title: `${t.merchant} · ${money(-t.amount)}`, source: acc(t.accountId)?.institution ?? "monzo", date: relDay(t.date), meta: categoryName[t.category], href: "money" });
  const sum = (xs: typeof out) => -xs.reduce((s, t) => s + t.amount, 0);
  const earliest = v.txns.reduce((m, t) => Math.min(m, daysFrom(t.date)), 0);
  const partial = earliest > from ? ` I only have transactions from ${when(on(earliest)).replace(/^on /, "")}, so this may be incomplete.` : "";

  const merchant = [...new Set(v.txns.map((t) => t.merchant))].find((m) => q.includes(norm(m).replace(/'s\b/, "")));
  if (merchant) {
    const xs = out.filter((t) => t.merchant === merchant);
    if (!xs.length) return answer(`I can't see any spending at ${merchant} ${label}.${partial}`);
    return answer(`You've spent ${money(sum(xs))} at ${merchant} ${label}, across ${plural(xs.length, "payment")}.${partial}`, xs.map(txCite));
  }

  const cat = catWords.find(([re]) => re.test(q))?.[1];
  if (cat) {
    const xs = out.filter((t) => t.category === cat).sort((a, b) => a.amount - b.amount);
    const spent = sum(xs);
    const budget = v.budgets[cat];
    let b = "";
    if (budget && label === "this month") {
      b = spent > budget ? ` That's ${money(spent - budget)} over your ${money(budget, true)} budget.` : ` That's ${Math.round((spent / budget) * 100)}% of your ${money(budget, true)} budget, with ${money(budget - spent)} left.`;
    }
    if (!xs.length) return answer(`Nothing spent on ${categoryName[cat].toLowerCase()} ${label}.${b}${partial}`);
    return answer(
      `You've spent ${money(spent)} on ${categoryName[cat].toLowerCase()} ${label}, across ${plural(xs.length, "payment")}; the largest was ${xs[0].merchant} at ${money(-xs[0].amount)}.${b}${partial}`,
      xs.slice(0, 6).map(txCite),
    );
  }

  if (!out.length) return answer(`I can't see any spending ${label}.${partial}`);
  const byCat = new Map<Category, number>();
  for (const t of out) byCat.set(t.category, (byCat.get(t.category) ?? 0) - t.amount);
  const top = [...byCat].sort((a, b) => b[1] - a[1]).slice(0, 3);
  let budgets = "";
  if (label === "this month") {
    const rows = (Object.entries(v.budgets) as [Category, number][]).map(([k, lim]) => ({ k, lim, used: byCat.get(k) ?? 0 }));
    const over = rows.filter((r) => r.used > r.lim);
    const close = rows.filter((r) => r.used <= r.lim && r.used / r.lim >= 0.8);
    budgets = over.length
      ? ` Over budget: ${list(over.map((r) => `${categoryName[r.k].toLowerCase()} by ${money(r.used - r.lim)}`))}.`
      : close.length
        ? ` Every budget is on track; ${list(close.map((r) => categoryName[r.k].toLowerCase()))} ${close.length === 1 ? "is" : "are"} close to the limit.`
        : ` Every budget is on track, with ${list(rows.map((r) => `${categoryName[r.k].toLowerCase()} at ${Math.round((r.used / r.lim) * 100)}%`).slice(0, 3))}.`;
  }
  return answer(
    `You've spent ${money(sum(out))} ${label}, not counting transfers or the shop. The biggest amounts are ${list(top.map(([k, n]) => `${categoryName[k].toLowerCase()} ${money(n)}`))}.${budgets}${partial}`,
    [...out].sort((a, b) => a.amount - b.amount).slice(0, 5).map(txCite),
  );
}

const docWords: [RegExp, (x: DB["docs"][number], q: string) => boolean][] = [
  [/\bpassports?\b/, (x, q) => x.kind === "passport" && (/\bsam\b/.test(q) ? x.holder === "Sam Rowe" : x.holder !== "Sam Rowe")],
  [/\bmot\b/, (x) => x.kind === "mot"],
  [/\b(contents|home) insurance\b/, (x) => x.id === "doc-contents"],
  [/\b(car|motor)? ?insurance\b/, (x) => x.kind === "insurance" && /car/i.test(x.title)],
  [/\b(car|vehicle|road) tax\b|\btaxed\b/, (x) => x.kind === "tax"],
  [/\btv licen[cs]e\b/, (x) => x.kind === "tv-licence"],
  [/\b(driving )?licen[cs]e\b/, (x) => x.kind === "licence"],
  [/\bwarrant(y|ies)\b/, (x) => x.kind === "warranty"],
  [/\b(tenancy|lease|contract on the flat)\b/, (x) => x.kind === "tenancy"],
  [/\b(ghic|ehic|health card)\b/, (x) => x.kind === "health"],
];

function renewals(c: Ctx): Answer {
  const { q, v } = c;
  const hit = docWords.find(([re]) => re.test(q));
  const doc = hit && v.docs.find((x) => hit[1](x, q));
  if (hit && !doc) return answer("I can't find that document in Life admin, so I can't say when it renews.");
  if (doc && doc.expires) {
    const verb = doc.kind === "mot" ? "is due" : ["passport", "licence", "warranty", "health"].includes(doc.kind) ? "expires" : "renews";
    const whose = doc.holder === "Sam Rowe" ? "Sam's" : "Your";
    const name = lower(doc.title.replace(/\s*\(Sam\)/, "").split(" · ")[0]);
    const bill = v.bills.find((b) => b.due === doc.expires && b.name.toLowerCase() === doc.title.toLowerCase());
    const task = v.tasks.find((t) => !t.done && t.from?.kind === "doc" && t.from.id === doc.id);
    const notes = doc.notes ? ` ${doc.notes.replace(/\.?$/, ".")}` : "";
    const todo = task ? ` There's a task to ${lower(task.title)}${task.due ? `, due ${when(task.due).replace(/^on /, "")}` : ""}.` : "";
    const cites = [cite.doc(doc)];
    if (bill) cites.push(cite.bill(bill));
    if (task) cites.push(cite.task(task));
    const car = doc.kind === "mot" || doc.kind === "tax" ? ` for ${doc.reference ?? doc.title.split(" · ")[1] ?? "the car"}` : "";
    return answer(`${whose} ${name}${car} ${verb} ${onDay(doc.expires)}, ${distance(doc.expires)}.${notes}${todo}`, cites);
  }
  const next = v.docs.filter((x) => x.expires && daysFrom(x.expires) >= 0).sort((a, b) => a.expires!.localeCompare(b.expires!)).slice(0, 4);
  if (!next.length) return answer("Nothing in Life admin is due to renew or expire.");
  return answer(
    `Next up: ${list(next.map((x) => `${lower(x.title.split(" · ")[0])} ${onDay(x.expires!)}`))}.`,
    next.map(cite.doc),
  );
}

function deliveries(c: Ctx): Answer {
  const { q, v, now } = c;
  if (/\breturns?\b|\bsend (it )?back\b/.test(q)) {
    const rs = v.orders.filter((o) => o.returnBy && daysFrom(o.returnBy) >= 0 && o.status !== "returned").sort((a, b) => a.returnBy!.localeCompare(b.returnBy!));
    if (!rs.length) return answer("Nothing you've ordered is still inside its returns window.");
    return answer(`You can still return ${list(rs.map((o) => `the ${lower(o.items[0].name.split(",")[0])} from ${o.retailer} until ${fullDate(o.returnBy!)}`))}.`, rs.map(cite.order));
  }
  let active = v.orders.filter(isActiveOrder).sort((a, b) => (a.eta ?? "~").localeCompare(b.eta ?? "~"));
  const shop = active.find((o) => q.includes(norm(o.retailer).split(" ")[0]));
  if (shop) active = [shop];
  const day = dayIn(q, now);
  if (day && !shop) active = active.filter((o) => o.eta && daysFrom(o.eta) === day.offset);
  if (!active.length) {
    const last = v.orders.filter((o) => o.status === "delivered").sort((a, b) => (b.eta ?? "").localeCompare(a.eta ?? ""))[0];
    return answer(`${day ? `Nothing is due to arrive ${day.label}.` : "Nothing is on its way at the moment."}${last && !day ? ` The last delivery was ${last.retailer}, ${when(last.eta!)}.` : ""}`, last && !day ? [cite.order(last)] : []);
  }
  const line = (o: DB["orders"][number]) =>
    o.status === "out-for-delivery"
      ? `${o.retailer} is out for delivery ${deliveryWindow(o)}`
      : o.status === "dispatched"
        ? `${o.retailer} is with ${o.carrier ?? "the courier"}, due ${when(o.eta ?? "").replace(/^on /, "")}`
        : `${o.retailer} hasn't shipped yet${o.eta ? `; it's expected ${when(o.eta).replace(/^on /, "")}` : ""}`;
  const head = active.length === 1 ? "" : `${cap(plural(active.length, "parcel"))} ${day ? `${day.label === "today" ? "arriving today" : `due ${day.label}`}` : "on the way"}. `;
  return answer(`${head}${active.map((o) => cap(line(o))).join(". ")}.`, active.map(cite.order));
}

function shopAnswer(c: Ctx): Answer {
  const { q, v, all } = c;
  if (!v.revenue.length && !v.shopOrders.length) return answer("Shopify and Etsy are both switched off, so I can't see the shop.");
  const shopCite = (o: DB["shopOrders"][number]): Cite => ({
    title: `Order ${o.number} to ${o.shipTo}`,
    source: o.channel,
    date: relDay(o.date),
    meta: `${money(o.total)} · ${o.items.map((i) => `${i.qty} × ${all.products.find((p) => p.id === i.productId)?.name ?? "item"}`).join(", ")}`,
    href: "business",
  });

  if (/\b(stock|restock|running low|sold out|inventory)\b/.test(q)) {
    const low = v.products.filter((p) => p.reorderAt > 0 && p.stock <= p.reorderAt).sort((a, b) => a.stock - b.stock);
    if (!low.length) return answer("Nothing is below its reorder level.");
    const task = v.tasks.find((t) => !t.done && t.list === "shop" && /restock/i.test(t.title));
    return answer(
      `${cap(plural(low.length, "product"))} ${low.length === 1 ? "is" : "are"} running low: ${list(low.map((p) => `${p.name} (${p.stock} left, reorder at ${p.reorderAt})`))}.${task ? ` There's a task to ${lower(task.title)} ${when(task.due ?? on(0))}.` : ""}`,
      [...low.map((p): Cite => ({ title: p.name, source: "shopify", meta: `${p.stock} in stock`, href: "business" })), ...(task ? [cite.task(task)] : [])],
    );
  }

  if (/\bpayouts?\b|\bpaid out\b/.test(q)) {
    const ps = v.payouts.filter((p) => p.status !== "paid").sort((a, b) => a.date.localeCompare(b.date));
    if (!ps.length) return answer("There are no payouts on the way.");
    return answer(
      `${list(ps.map((p) => `${money(p.amount)} from ${p.channel === "etsy" ? "Etsy" : "Shopify"} ${p.status === "in-transit" ? `is on its way (sent ${when(p.date).replace(/^on /, "")})` : `is scheduled ${when(p.date)}`}`))}.`,
      ps.map((p): Cite => ({ title: `Payout · ${money(p.amount)}`, source: p.channel, date: relDay(p.date), meta: p.status.replace("-", " "), href: "business" })),
    );
  }

  const open = v.shopOrders.filter((o) => o.status === "unfulfilled").sort((a, b) => a.date.localeCompare(b.date));
  if (/\b(unfulfilled|to send|to ship|to post|fulfil\w*|dispatch)\b/.test(q)) {
    if (!open.length) return answer("Every shop order has been sent.");
    return answer(
      `${cap(plural(open.length, "order"))} ${open.length === 1 ? "is" : "are"} waiting to be sent: ${list(open.map((o) => `${o.number} to ${o.shipTo} (${relDay(o.date).toLowerCase()})`))}.`,
      open.map(shopCite),
    );
  }

  const day = dayIn(q, c.now);
  if (day && day.offset <= 0) {
    const r = v.revenue.find((x) => x.date === on(day.offset));
    if (!r) return answer(`I don't have sales figures for ${day.label}.`);
    return answer(`Fern & Thread took ${money(r.revenue)} from ${plural(r.orders, "order")} ${day.label}.`, [{ title: `Sales ${day.label}`, source: "shopify", date: relDay(r.date), meta: `${r.orders} orders`, href: "business" }]);
  }

  const month = /\bmonth\b|\b30 days\b/.test(q);
  const len = month ? 30 : 7;
  const cur = v.revenue.filter((r) => daysFrom(r.date) > -len);
  const prev = v.revenue.filter((r) => daysFrom(r.date) <= -len && daysFrom(r.date) > -2 * len);
  const total = cur.reduce((s, r) => s + r.revenue, 0);
  const orders = cur.reduce((s, r) => s + r.orders, 0);
  const before = prev.reduce((s, r) => s + r.revenue, 0);
  const trend = prev.length === len && before > 0 ? `, ${total >= before ? "up" : "down"} ${Math.abs(Math.round(((total - before) / before) * 100))}% on the ${len} days before` : "";
  const openLine = open.length ? ` ${cap(plural(open.length, "order"))} ${open.length === 1 ? "is" : "are"} waiting to be sent, the oldest from ${relDay(open[0].date).toLowerCase()}.` : " Every order has been sent.";
  return answer(`Fern & Thread took ${money(total)} from ${orders} orders in the last ${len} days${trend}.${openLine}`, [
    { title: `Sales, last ${len} days`, source: "shopify", date: "Today", meta: `${orders} orders`, href: "business" },
    ...open.map(shopCite),
  ]);
}

function birthdays(c: Ctx): Answer {
  const { v, person } = c;
  const withBd = v.contacts.filter((x) => x.birthday).map((x) => ({ c: x, date: nextBirthday(x)! })).sort((a, b) => a.date.localeCompare(b.date));
  if (person?.contact) {
    const x = person.contact;
    if (!x.birthday) return answer(`I don't have a birthday saved for ${person.name}.`, [cite.contact(x)]);
    const date = nextBirthday(x)!;
    const gift = v.tasks.find((t) => !t.done && t.from?.kind === "contact" && t.from.id === x.id);
    const note = gift ? ` There's a task to ${lower(gift.title)}${gift.notes ? `; ${lower(gift.notes.replace(/\.$/, ""))}` : ""}.` : x.notes ? ` ${x.notes}` : "";
    return answer(`${firstName(x.name)}'s birthday is ${onDay(date)}, ${distance(date)}.${note}`, [cite.contact(x), ...(gift ? [cite.task(gift)] : [])]);
  }
  if (!withBd.length) return answer("I don't have any birthdays saved.");
  const [first, ...rest] = withBd;
  const gift = v.tasks.find((t) => !t.done && t.from?.kind === "contact" && t.from.id === first.c.id);
  const others = rest.slice(0, 2).map((x) => `${firstName(x.c.name)} ${onDay(x.date)}`);
  return answer(
    `${firstName(first.c.name)}'s is next, ${onDay(first.date)} (${distance(first.date)}).${others.length ? ` After that, ${list(others)}.` : ""}${gift ? ` There's still a task to ${lower(gift.title)}.` : ""}`,
    [...withBd.slice(0, 3).map((x) => cite.contact(x.c)), ...(gift ? [cite.task(gift)] : [])],
  );
}

function emails(c: Ctx): Answer {
  const { q, v, person } = c;
  const inbox = v.messages.filter((m) => m.folder === "inbox").sort((a, b) => b.date.localeCompare(a.date));
  const name = (m: Message) => firstName(m.from.name);
  if (person) {
    const from = inbox.filter((m) => person.emails.includes(m.from.email) || m.from.name === person.name);
    if (!from.length) return answer(`There's nothing from ${person.name} in your inbox.`, person.contact ? [cite.contact(person.contact)] : []);
    const m = from[0];
    const state = [!m.read && "unread", m.needsReply && "waiting for a reply"].filter(Boolean).join(" and ");
    const more = from.length > 1 ? ` There ${from.length - 1 === 1 ? "is" : "are"} ${plural(from.length - 1, "older email")} from ${person.short} too.` : "";
    return answer(
      `${person.short} emailed ${daysFrom(m.date) === 0 ? `today at ${time(m.date)}` : when(m.date)} about “${m.subject}”: ${m.snippet}${state ? ` It's ${state}.` : ""}${more}`,
      from.slice(0, 4).map(cite.message),
    );
  }
  const waiting = inbox.filter((m) => m.needsReply);
  const unread = inbox.filter((m) => !m.read);
  if (/\b(repl(y|ies)|respond|answer|waiting)\b/.test(q)) {
    if (!waiting.length) return answer("Nothing in your inbox is waiting for a reply.");
    return answer(`${cap(plural(waiting.length, "email"))} ${waiting.length === 1 ? "needs" : "need"} a reply: ${list(waiting.map((m) => `${name(m)} (${topic(m.subject)})`))}.`, waiting.map(cite.message));
  }
  if (!unread.length && !waiting.length) return answer("Your inbox is clear: nothing unread and nothing waiting for a reply.");
  const important = unread.filter((m) => m.why && !m.needsReply);
  return answer(
    `You have ${plural(unread.length, "unread email")}${waiting.length ? `, and ${count(waiting.length)} need a reply: ${list(waiting.map((m) => `${name(m)} (${topic(m.subject)})`))}` : ""}.${important.length ? ` Also worth a look: ${list(important.map((m) => `“${m.subject}” from ${m.from.name}`))}.` : ""}`,
    [...waiting, ...important].map(cite.message),
  );
}

function agenda(c: Ctx): Answer {
  const { q, v, now } = c;
  if (/\bnext (meeting|event|appointment|thing)\b/.test(q)) {
    const work = /\bmeeting\b/.test(q);
    const e = v.events.filter((e) => !e.allDay && parse(e.start) > now && (!work || e.calendar === "work")).sort((a, b) => a.start.localeCompare(b.start))[0];
    if (!e) return answer("Nothing else is in the diary.");
    return answer(`${e.title}, ${when(e.start)} at ${time(e.start)}${e.location ? ` in ${e.location}` : e.video ? ` on ${e.video}` : ""}.`, [cite.event(e)]);
  }
  const span = spanIn(q, now);
  if (span && span.to > span.from) {
    const evs = v.events.filter((e) => daysFrom(e.start) >= span.from && daysFrom(e.start) <= span.to && (daysFrom(e.start) > 0 || parse(e.end) > now)).sort((a, b) => a.start.localeCompare(b.start));
    if (!evs.length) return answer(`Nothing is in the diary ${span.label}.`);
    return answer(`${cap(plural(evs.length, "thing"))} in the diary ${span.label}: ${list(evs.slice(0, 6).map((e) => `${lower(e.title)} ${when(e.start).replace(/^on /, "")}${e.allDay ? "" : ` at ${time(e.start)}`}`))}${evs.length > 6 ? `, and ${count(evs.length - 6)} more` : ""}.`, evs.map(cite.event));
  }
  const day = dayIn(q, now) ?? { offset: 0, label: "today" };
  const evs = eventsOn(v, day.offset);
  const trip = v.trips.find((t) => daysFrom(t.start) <= day.offset && daysFrom(t.end) >= day.offset);
  const away = trip ? ` You're in ${trip.title}${daysFrom(trip.start) === day.offset ? " from that evening" : ""}.` : "";
  if (!evs.length) return answer(`Nothing is in the diary ${day.label}.${away}`);
  const timed = evs.filter((e) => !e.allDay);
  const allDay = evs.filter((e) => e.allDay);
  const left = day.offset === 0 ? timed.filter((e) => parse(e.end) > now) : timed;
  const item = (e: (typeof evs)[number]) => `${lower(e.title)} at ${time(e.start)}${e.location && !/flight/i.test(e.title) ? ` (${e.location})` : ""}`;
  const head =
    day.offset === 0 && left.length < timed.length
      ? left.length
        ? `${cap(plural(left.length, "thing"))} left today`
        : "That's everything in the diary done for today"
      : `${cap(plural(timed.length, "thing"))} ${day.label}`;
  const body = left.length ? `: ${list(left.slice(0, 5).map(item))}${left.length > 5 ? `, and ${count(left.length - 5)} more` : ""}.` : ".";
  const ad = allDay.length ? ` It's also ${list(allDay.map((e) => lower(e.title)))}.` : "";
  return answer(`${timed.length ? `${head}${body}` : ""}${ad}${trip && !day.offset ? "" : away}${clashes(left)}`.trim(), [...allDay, ...left].map(cite.event));
}

/** " Note that 5-a-side at 19:00 overlaps dinner at The Kitchin at 19:30." for the first overlapping pair. */
function clashes(evs: DB["events"]) {
  const t = evs.filter((e) => !e.allDay).sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 0; i < t.length - 1; i++) {
    if (parse(t[i + 1].start) < parse(t[i].end)) return ` Note that ${lower(t[i].title)} at ${time(t[i].start)} overlaps ${lower(t[i + 1].title)} at ${time(t[i + 1].start)}.`;
  }
  return "";
}

const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function free(c: Ctx): Answer {
  const { q, v, now } = c;
  const day = dayIn(q, now) ?? { offset: 0, label: "today" };
  let [lo, hi] = [8 * 60, 22 * 60];
  let part = "";
  if (/\bmorning\b/.test(q)) [lo, hi, part] = [8 * 60, 12 * 60, " morning"];
  else if (/\bafternoon\b/.test(q)) [lo, hi, part] = [12 * 60, 17 * 60 + 30, " afternoon"];
  else if (/\b(evening|tonight|after work)\b/.test(q)) [lo, hi, part] = [17 * 60 + 30, 22 * 60, " evening"];
  if (day.offset === 0) lo = Math.max(lo, Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15);
  const label = day.label === "today" ? (part === " evening" ? "this evening" : part ? `this${part}` : "today") : `${day.label}${part}`;
  if (lo >= hi) return answer(`That part of ${day.label} has already gone.`);

  const evs = eventsOn(v, day.offset).filter((e) => !e.allDay);
  const mins = (s: string) => {
    const d = parse(s);
    return daysFrom(s) > day.offset ? 24 * 60 : d.getHours() * 60 + d.getMinutes();
  };
  const busy = evs.map((e) => [mins(e.start), mins(e.end)] as const).filter(([a, b]) => b > lo && a < hi).sort((a, b) => a[0] - b[0]);
  const gaps: [number, number][] = [];
  let cursor = lo;
  for (const [a, b] of busy) {
    if (a - cursor >= 30) gaps.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (hi - cursor >= 30) gaps.push([cursor, hi]);
  const trip = v.trips.find((t) => daysFrom(t.start) <= day.offset && daysFrom(t.end) >= day.offset);
  const away = trip ? ` Bear in mind you're away in ${trip.title} that day.` : "";
  const cites = evs.filter((e) => mins(e.end) > lo && mins(e.start) < hi).map(cite.event);

  if (!busy.length) return answer(`Nothing is in the diary ${label}, so you're free${part ? ` all${part}` : ` from ${hhmm(lo)} onwards`}.${away}`, cites);
  if (!gaps.length) return answer(`You're booked up ${label}: ${list(busy.map((_, i) => `${lower(evs.filter((e) => mins(e.end) > lo && mins(e.start) < hi)[i]?.title ?? "")}`).filter(Boolean))}.${away}`, cites);
  const phr = gaps.map(([a, b]) =>
    a === lo && day.offset === 0 && !part && lo > 8 * 60
      ? `now until ${hhmm(b)}`
      : a === lo && lo === 8 * 60
        ? `before ${hhmm(b)}`
        : b === hi && hi === 22 * 60
          ? `after ${hhmm(a)}`
          : `${hhmm(a)} to ${hhmm(b)}`,
  );
  const longest = gaps.reduce((m, g) => (g[1] - g[0] > m[1] - m[0] ? g : m));
  const len = longest[1] - longest[0];
  return answer(
    `${cap(label)} you're free ${list(phr)}. The longest gap is ${len >= 60 ? `${Math.floor(len / 60)} h${len % 60 ? ` ${len % 60} min` : ""}` : `${len} min`}, from ${hhmm(longest[0])}.${away}${clashes(evs)}`,
    cites,
  );
}

function sortOut(c: Ctx): Answer {
  const { q, v, now } = c;
  const span = spanIn(q, now) ?? { from: 0, to: endOfWeek(now) || 7, label: "this week" };
  const tasks = v.tasks.filter((t) => !t.done && t.due && daysFrom(t.due) <= span.to).sort((a, b) => a.due!.localeCompare(b.due!) || Number(!!b.priority) - Number(!!a.priority));
  const replies = v.messages.filter((m) => m.folder === "inbox" && m.needsReply);
  const bills = v.bills.filter((b) => b.status !== "paid" && daysFrom(b.due) >= 0 && daysFrom(b.due) <= span.to);
  const manual = bills.filter((b) => !b.autopay);
  const auto = bills.filter((b) => b.autopay);
  const total = tasks.length + replies.length + manual.length;
  if (!total && !auto.length) return answer(`Nothing needs sorting ${span.label}. No tasks are due and no one is waiting on a reply.`);

  const taskPhrase = (t: (typeof tasks)[number]) => {
    const n = daysFrom(t.due!);
    return `${lower(t.title)} (${n < 0 ? "overdue" : n === 0 ? "today" : n === 1 ? "tomorrow" : relDay(t.due!)})`;
  };
  const parts: string[] = [`${cap(span.label)} there ${total === 1 ? "is" : "are"} ${plural(total, "thing")} to sort.`];
  if (tasks.length) parts.push(`${tasks.length > 3 ? "Most pressing" : cap(plural(tasks.length, "task"))}: ${list(tasks.slice(0, 3).map(taskPhrase))}${tasks.length > 3 ? `, plus ${count(tasks.length - 3)} more ${tasks.length - 3 === 1 ? "task" : "tasks"}` : ""}.`);
  const extra: string[] = [];
  if (replies.length) {
    const names = replies.slice(0, 3).map((m) => firstName(m.from.name));
    if (replies.length > 3) names.push(`${count(replies.length - 3)} more`);
    extra.push(`${list(names)} ${replies.length === 1 ? "is" : "are"} waiting for a reply`);
  }
  if (manual.length) extra.push(`${list(manual.map((b) => `${lower(b.name)} (${money(b.amount)})`))} needs paying by hand`);
  if (auto.length === 1) extra.push(`${auto[0].kind === "bill" ? lower(auto[0].name) : auto[0].name} (${money(auto[0].amount)}) will go out by Direct Debit`);
  else if (auto.length) {
    const names = auto.slice(0, 3).map((b) => (b.kind === "bill" ? lower(b.name) : b.name));
    if (auto.length > 3) names.push(`${count(auto.length - 3)} more`);
    extra.push(`${list(names)} will go out by Direct Debit, ${money(auto.reduce((s, b) => s + b.amount, 0))} in all`);
  }
  if (extra.length) parts.push(`${cap(extra.join("; "))}.`);
  return answer(parts.join(" "), [...tasks.map(cite.task), ...replies.map(cite.message), ...bills.map(cite.bill)]);
}

function investments(c: Ctx): Answer {
  const { v } = c;
  if (!v.holdings.length) return answer("Trading 212 and Vanguard are switched off, so I can't see your investments.");
  const val = (h: DB["holdings"][number]) => h.units * h.price;
  const total = v.holdings.reduce((s, h) => s + val(h), 0);
  const cost = v.holdings.reduce((s, h) => s + h.cost, 0);
  const gain = total - cost;
  const by = (a: string) => v.holdings.filter((h) => h.account === a).reduce((s, h) => s + val(h), 0);
  const names: Record<string, string> = { ISA: "Stocks and Shares ISA", SIPP: "pension", GIA: "general account" };
  const accounts = ["ISA", "SIPP", "GIA"].filter((a) => by(a) > 0);
  const biggest = [...v.holdings].sort((a, b) => val(b) - val(a))[0];
  return answer(
    `Your investments are worth ${money(total)} at the latest prices, ${money(Math.abs(gain))} (${Math.abs(Math.round((gain / cost) * 1000) / 10)}%) ${gain >= 0 ? "more" : "less"} than you paid in. ${cap(list(accounts.map((a) => `the ${names[a]} holds ${money(by(a))}`)))}. The largest holding is ${biggest.name}, at ${money(val(biggest))}.`,
    [...v.holdings].sort((a, b) => val(b) - val(a)).map((h): Cite => ({ title: `${h.name} (${h.ticker})`, source: h.broker, meta: `${h.account} · ${money(val(h))}`, href: "money" })),
  );
}

function balances(c: Ctx): Answer {
  const { v } = c;
  if (!v.accounts.length) return answer("Your bank connections are switched off, so I can't see any balances.");
  const debit = v.accounts.filter((a) => a.balance >= 0);
  const credit = v.accounts.filter((a) => a.balance < 0);
  const cur = v.accounts.filter((a) => a.type === "current").reduce((s, a) => s + a.balance, 0);
  return answer(
    `${cap(list(debit.map((a) => `${a.name} has ${money(a.balance)}`)))}.${credit.length ? ` You owe ${list(credit.map((a) => `${money(-a.balance)} on ${a.name}`))}.` : ""} That's ${money(cur)} in current accounts.`,
    v.accounts.map((a): Cite => ({ title: `${a.name} ···${a.mask}`, source: a.institution, date: relDay(a.updatedAt), meta: money(a.balance), href: "money" })),
  );
}

function health(c: Ctx): Answer {
  const { q, v } = c;
  const y = v.daily.find((d) => d.date === on(-1));
  const t = v.daily.find((d) => d.date === on(0));
  const avg = (k: "steps" | "sleepMin") => (v.daily.length ? Math.round(v.daily.reduce((s, d) => s + d[k], 0) / v.daily.length) : 0);
  const hm = (m: number) => `${Math.floor(m / 60)} h ${m % 60} min`;
  const dayCite = (d: DB["daily"][number], meta: string): Cite => ({ title: "Daily activity", source: "apple-health", date: relDay(d.date), meta, href: "health" });
  if (/\b(sleep|slept)\b/.test(q)) {
    if (!t) return answer("Apple Health is switched off, so I can't see your sleep.");
    return answer(`You slept ${hm(t.sleepMin)} last night. Your two-week average is ${hm(avg("sleepMin"))}.`, [dayCite(t, hm(t.sleepMin))]);
  }
  if (/\b(workouts?|exercise|run|ran|runs|gym|swim|ride|yoga)\b/.test(q)) {
    const week = v.workouts.filter((w) => daysFrom(w.date) >= -6).sort((a, b) => b.date.localeCompare(a.date));
    const last = [...v.workouts].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!last) return answer("I can't see any workouts.");
    return answer(
      `${cap(plural(week.length, "workout"))} in the last 7 days, ${week.reduce((s, w) => s + w.minutes, 0)} minutes in all. The most recent was ${lower(last.title)} ${when(last.date)}${last.km ? `, ${last.km} km` : ""} in ${last.minutes} minutes.`,
      week.map((w): Cite => ({ title: w.title, source: w.source, date: relDay(w.date), meta: `${w.minutes} min${w.km ? ` · ${w.km} km` : ""}`, href: "health" })),
    );
  }
  if (!y) return answer("Apple Health is switched off, so I can't see your activity.");
  return answer(`You walked ${y.steps.toLocaleString("en-GB")} steps yesterday, against a two-week average of ${avg("steps").toLocaleString("en-GB")}.${t ? ` Last night you slept ${hm(t.sleepMin)}.` : ""}`, [dayCite(y, `${y.steps} steps`), ...(t ? [dayCite(t, hm(t.sleepMin))] : [])]);
}

function contactInfo(c: Ctx): Answer {
  const x = c.person?.contact;
  if (!c.person) return answer("Who would you like the details for? Try a name, like \"What's Tomás's number?\"");
  if (!x) return answer(`${c.person.name} isn't in your contacts. The email address I have is ${c.person.emails[0]}.`);
  const bits = [x.phone && `phone ${x.phone}`, x.email && `email ${x.email}`].filter(Boolean);
  if (!bits.length) return answer(`I don't have a phone number or email saved for ${c.person.name}.`, [cite.contact(x)]);
  return answer(`${c.person.name}: ${list(bits as string[])}.${x.notes ? ` ${x.notes}` : ""}`, [cite.contact(x)]);
}

const HELP =
  "I answer from the sample data in this app, and show where each answer came from. Ask about your diary and free time, emails waiting on you, tasks, bills and spending, balances and investments, trips and bookings, parcels, renewals like the MOT or passport, birthdays, the shop, or sleep and steps.";

/* Routing --------------------------------------------------------------------------------------- */

const days = "today|tomorrow|tonight|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend";

const intents: Intent[] = [
  { name: "help", weights: [[/\b(help|what can you (do|answer|tell)|what do you know|how does this work|what can i ask)\b/, 6]], run: () => answer(HELP) },
  {
    name: "contact",
    weights: [[/\b(phone number|number for|'s number|email address|contact details|how do i (reach|contact)|call)\b/, 6]],
    run: contactInfo,
  },
  {
    name: "free",
    weights: [
      [/\b(free|availab\w*|spare time|gaps?|slot|nothing on)\b/, 4],
    ],
    run: free,
  },
  {
    name: "sort",
    weights: [
      [/\b(sort( out)?|need to do|needs? (doing|me|my attention|sorting)|to ?do|outstanding|urgent|deal with|on my plate|pressing|priorit\w*|what'?s left|catch up|overdue|tasks?|jobs|forget)\b/, 3],
      [new RegExp(`\\b(before|by) ${wdRe}\\b`), 2],
      [/\bthis week\b/, 1],
    ],
    run: sortOut,
  },
  {
    name: "travel",
    weights: [
      [/\b(flights?|fly|flying|plane|airport|boarding|check.?in|gate|terminal)\b/, 5],
      [/\b(hotel|stay|staying|airbnb|accommodation|check.?out)\b/, 5],
      [/\b(trip|holiday|travel\w*|away|getaway|break|edinburgh|lisbon)\b/, 3],
      [/\b(restaurant|dinner|table|reservation|booking|booked|tickets?|gig|concert)\b/, 2],
    ],
    run: travel,
  },
  {
    name: "bills",
    weights: [
      [/\b(bills?|direct debits?|subscriptions?|standing orders?|payments? due|outgoings|rent|council tax|electricity|broadband|water bill|netflix|spotify|phone bill)\b/, 4],
      [/\b(due|owe|pay|paying|go(ing)? out|renew)\b/, 1],
    ],
    run: bills,
  },
  {
    name: "spending",
    weights: [
      [/\b(spen[dt]|spending|budgets?|expenses?|cost me|splurg\w*)\b/, 5],
      [/\b(eating out|groceries|takeaways?|coffee)\b/, 2],
    ],
    run: spending,
  },
  {
    name: "renewals",
    weights: [
      [/\b(renew\w*|expir\w*|mot|passports?|insurance|insured|licen[cs]e|vehicle tax|car tax|road tax|taxed|warrant(y|ies)|tenancy|lease|ghic|ehic)\b/, 4],
    ],
    run: renewals,
  },
  {
    name: "deliveries",
    weights: [
      [/\b(parcels?|deliver\w*|packages?|arriv\w*|tracking|courier|royal mail|evri|dpd|returns?|post)\b/, 4],
      [/\b(orders?|ordered|amazon|arlo|hive)\b/, 2],
    ],
    run: deliveries,
  },
  {
    name: "shop",
    weights: [
      [/\b(shop|fern|store|etsy|shopify|revenue|sales|sold|selling|takings|unfulfilled|fulfil\w*|stock|restock|customers?|payouts?)\b/, 4],
      [/\borders? to (send|ship|post)\b/, 4],
    ],
    run: shopAnswer,
  },
  { name: "birthdays", weights: [[/\b(birthdays?|bday|born)\b/, 6]], run: birthdays },
  {
    name: "emails",
    weights: [
      [/\b(emails?|e-mails?|mail|inbox|unread|messages?|repl(y|ies)|respond|wrote|heard from|written|get back to)\b/, 3],
    ],
    run: emails,
  },
  {
    name: "agenda",
    weights: [
      [/\bwhat'?s on\b|\bwhat am i (doing|up to)\b|\bam i busy\b|\bnext (meeting|event|appointment)\b|\bwhat (have i got|do i have|is happening|'?s happening|is coming up|'?s coming up)\b/, 4],
      [/\b(happening|coming up|going on)\b/, 2],
      [/\b(schedule|diary|agenda|calendar|meetings?|appointments?|events?|plans)\b/, 3],
      [new RegExp(`\\b(${days})\\b`), 1],
    ],
    run: agenda,
  },
  { name: "investments", weights: [[/\b(invest\w*|portfolio|isa|pension|sipp|shares|stocks|holdings?|etfs?|funds?|trading 212|vanguard)\b/, 5]], run: investments },
  {
    name: "balance",
    weights: [[/\b(balances?|how much (money )?(do i have|have i got|is in)|in the bank|bank accounts?|overdrawn|credit card|amex|monzo|starling|savings)\b/, 4]],
    run: balances,
  },
  { name: "health", weights: [[/\b(steps|sleep|slept|workouts?|exercise|run|ran|runs|gym|resting heart|heart rate|active|fitness|walked)\b/, 4]], run: health },
];

/** Connections that are off and would otherwise have contributed sample data. */
function switchedOff(all: DB) {
  const data = JSON.stringify({ ...all, connections: [], settings: null });
  return all.connections.filter((c) => c.status !== "connected" && data.includes(`"${c.id}"`));
}

/** Answer a question from the store. Pure: the same data and question give the same answer. */
export function ask(raw: string, all: DB, now = new Date()): Answer {
  const q = norm(raw);
  const v = visible(all);
  const person = people(v).find((x) => x.re.test(q))?.p;
  const ctx: Ctx = { q, raw, v, all, now, person };

  const scored = intents.map((it, i) => {
    let s = it.weights.reduce((n, [re, w]) => n + (re.test(q) ? w : 0), 0);
    if (person && s > 0 && it.name === "emails") s += 2;
    if (person && it.name === "emails" && /\b(want|ask|say|said|sent|send|about)\b/.test(q)) s += 3;
    return { it, s, i };
  });
  // "Sort" words are generic: a clear topic ("bills this week") beats them.
  const best = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i)[0];

  const off = switchedOff(all);
  if (!best) {
    if (person) return emails(ctx);
    return {
      matched: false,
      text: `I couldn't find anything on that, and I'd rather not guess. ${HELP.replace(/^I answer from the sample data in this app, and show where each answer came from\. /, "")}${off.length ? " Some sources are switched off in Settings, so their items are left out." : ""}`,
      cites: [],
    };
  }
  const a = best.it.run(ctx);
  if (!a.cites.length && off.length && best.it.name !== "help") a.text += ` Some sources are switched off in Settings, so this may be incomplete.`;
  return a;
}
