import { at, startOfDay } from "@orbit/time";
import type { Message, Person } from "@orbit/data/mail";

/* Views, ported from the web inbox (src/orbit/sections/inbox/mail.ts). */

export type ViewKey = "priority" | "reply" | "all" | "work" | "personal" | "updates" | "receipts" | "newsletters" | "sent" | "drafts" | "archive" | "snoozed";

export const me: Person = { name: "Alex Rowe", email: "alex@rowe.example" };

export const isSnoozed = (m: Message, now = Date.now()) => !!m.snoozedUntil && new Date(m.snoozedUntil).getTime() > now;
const inInbox = (m: Message) => m.folder === "inbox" && !isSnoozed(m);
export const isPriority = (m: Message) => inInbox(m) && (m.category === "important" || !!m.needsReply || !!m.why);

export type View = { key: ViewKey; label: string; test: (m: Message) => boolean; counts?: "unread" | "all"; empty: [string, string] };

export const views: View[] = [
  { key: "priority", label: "Priority", test: isPriority, counts: "unread", empty: ["Nothing pressing", "When something needs you, Orbit will put it here."] },
  { key: "reply", label: "Needs reply", test: (m) => inInbox(m) && !!m.needsReply, counts: "all", empty: ["You're all caught up", "No one is waiting on an answer from you."] },
  { key: "all", label: "All mail", test: (m) => inInbox(m) || m.folder === "archive", counts: "unread", empty: ["No mail", "Your inbox and archive are empty."] },
  { key: "work", label: "Work", test: (m) => inInbox(m) && m.category === "work", counts: "unread", empty: ["Quiet at work", "No work email in your inbox."] },
  { key: "personal", label: "Personal", test: (m) => inInbox(m) && m.category === "personal", counts: "unread", empty: ["Nothing personal waiting", "Messages from friends and family will show here."] },
  { key: "updates", label: "Updates", test: (m) => inInbox(m) && (m.category === "updates" || m.category === "important"), counts: "unread", empty: ["No updates", "Bookings, deliveries and notices will show here."] },
  { key: "receipts", label: "Receipts", test: (m) => inInbox(m) && m.category === "receipts", counts: "unread", empty: ["No receipts", "Bills and receipts will show here."] },
  { key: "newsletters", label: "Newsletters", test: (m) => inInbox(m) && m.category === "newsletters", counts: "unread", empty: ["No newsletters", "Nothing to read later."] },
  { key: "sent", label: "Sent", test: (m) => m.folder === "sent", empty: ["Nothing sent yet", "Replies you send from Orbit will show here."] },
  { key: "drafts", label: "Drafts", test: (m) => m.folder === "drafts", counts: "all", empty: ["No drafts", "Messages you save for later will wait here."] },
  { key: "archive", label: "Archive", test: (m) => m.folder === "archive", empty: ["The archive is empty", "Archived mail leaves the inbox but stays searchable."] },
  { key: "snoozed", label: "Snoozed", test: (m) => m.folder === "inbox" && isSnoozed(m), counts: "all", empty: ["Nothing snoozed", "Snooze a message and it comes back when you're ready for it."] },
];

export const viewByKey = (k: ViewKey) => views.find((v) => v.key === k) ?? views[0];

export function viewCount(v: View, list: Message[]) {
  if (!v.counts) return 0;
  return list.filter((m) => v.test(m) && (v.counts === "all" || !m.read)).length;
}

export function matches(m: Message, q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  const hay = [m.from.name, m.from.email, ...m.to.map((p) => p.name), m.subject, ...m.body].join("\n").toLowerCase();
  return n.split(/\s+/).every((w) => hay.includes(w));
}

export const byDate = (a: Message, b: Message) => b.date.localeCompare(a.date);
export const isOutgoing = (m: Message) => m.folder === "sent" || m.folder === "drafts";

/** Who a row should name: the sender, or for sent mail and drafts, who it went to. */
export const counterpart = (m: Message) => (isOutgoing(m) ? m.to[0] ?? me : m.from);
export const firstName = (p: Person) => p.name.split(/\s+/)[0];
export const bodyText = (m: Message) => m.body.join("\n\n");
export const toText = (people: Person[]) => people.map((p) => (p.email ? `${p.name} <${p.email}>` : p.name)).join(", ");

/* Snooze ----------------------------------------------------------------------------------------- */

export type SnoozeOption = { key: string; label: string; until: () => string; hint: () => string };

export const snoozeOptions: SnoozeOption[] = [
  {
    key: "later",
    label: "Later today",
    until: () => {
      const now = new Date();
      // 18:00, or three hours from now once it's late in the day.
      return now.getHours() < 15 ? at(0, "18:00") : new Date(now.getTime() + 3 * 3_600_000).toISOString();
    },
    hint: () => (new Date().getHours() < 15 ? "18:00" : "In 3 hours"),
  },
  { key: "tomorrow", label: "Tomorrow", until: () => at(1, "08:00"), hint: () => "08:00" },
  {
    key: "week",
    label: "Next week",
    until: () => {
      const day = startOfDay().getDay(); // 0 Sunday
      const toMonday = ((8 - day) % 7) || 7;
      return at(toMonday, "08:00");
    },
    hint: () => "Mon 08:00",
  },
];
