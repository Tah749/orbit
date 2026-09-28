import { db, newId } from "../../store";
import { go } from "../../router";
import { toast } from "../../ui";
import { at, on, shortDate, startOfDay } from "../../time";
import type { Message, Person } from "../../data/mail";
import type { Task } from "../../data/tasks";

/* Views ------------------------------------------------------------------------------------------ */

export type ViewKey =
  | "priority"
  | "reply"
  | "all"
  | "work"
  | "personal"
  | "updates"
  | "receipts"
  | "newsletters"
  | "sent"
  | "drafts"
  | "archive"
  | "snoozed";

export const me: Person = { name: "Alex Rowe", email: "alex@rowe.example" };

export const isSnoozed = (m: Message, now = Date.now()) => !!m.snoozedUntil && new Date(m.snoozedUntil).getTime() > now;
const inInbox = (m: Message) => m.folder === "inbox" && !isSnoozed(m);
export const isPriority = (m: Message) => inInbox(m) && (m.category === "important" || !!m.needsReply || !!m.why);

type View = { key: ViewKey; label: string; group: "orbit" | "mail" | "category" | "folder"; test: (m: Message) => boolean; counts?: "unread" | "all"; empty: [string, string] };

export const views: View[] = [
  { key: "priority", label: "Priority", group: "orbit", test: isPriority, counts: "unread", empty: ["Nothing pressing", "When something needs you, Orbit will put it here."] },
  { key: "reply", label: "Needs reply", group: "orbit", test: (m) => inInbox(m) && !!m.needsReply, counts: "all", empty: ["You're all caught up", "No one is waiting on an answer from you."] },
  { key: "all", label: "All mail", group: "mail", test: (m) => inInbox(m) || m.folder === "archive", counts: "unread", empty: ["No mail", "Your inbox and archive are empty."] },
  { key: "work", label: "Work", group: "category", test: (m) => inInbox(m) && m.category === "work", counts: "unread", empty: ["Quiet at work", "No work email in your inbox."] },
  { key: "personal", label: "Personal", group: "category", test: (m) => inInbox(m) && m.category === "personal", counts: "unread", empty: ["Nothing personal waiting", "Messages from friends and family will show here."] },
  { key: "updates", label: "Updates", group: "category", test: (m) => inInbox(m) && (m.category === "updates" || m.category === "important"), counts: "unread", empty: ["No updates", "Bookings, deliveries and notices will show here."] },
  { key: "receipts", label: "Receipts", group: "category", test: (m) => inInbox(m) && m.category === "receipts", counts: "unread", empty: ["No receipts", "Bills and receipts will show here."] },
  { key: "newsletters", label: "Newsletters", group: "category", test: (m) => inInbox(m) && m.category === "newsletters", counts: "unread", empty: ["No newsletters", "Nothing to read later."] },
  { key: "sent", label: "Sent", group: "folder", test: (m) => m.folder === "sent", empty: ["Nothing sent yet", "Replies you send from Orbit will show here."] },
  { key: "drafts", label: "Drafts", group: "folder", test: (m) => m.folder === "drafts", counts: "all", empty: ["No drafts", "Messages you save for later will wait here."] },
  { key: "archive", label: "Archive", group: "folder", test: (m) => m.folder === "archive", empty: ["The archive is empty", "Archived mail leaves the inbox but stays searchable."] },
  { key: "snoozed", label: "Snoozed", group: "folder", test: (m) => m.folder === "inbox" && isSnoozed(m), counts: "all", empty: ["Nothing snoozed", "Snooze a message and it comes back when you're ready for it."] },
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

/** Who a row should name: the sender, or for sent mail and drafts, who it went to. */
export const counterpart = (m: Message) => (m.folder === "sent" || m.folder === "drafts" ? m.to[0] ?? me : m.from);

export const firstName = (p: Person) => p.name.split(/\s+/)[0];

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

/* Actions ---------------------------------------------------------------------------------------- */

export function archive(m: Message) {
  const prev = m.folder;
  db.patch("messages", m.id, { folder: "archive" });
  toast("Archived", { label: "Undo", run: () => db.patch("messages", m.id, { folder: prev }) });
}

export function toInbox(m: Message) {
  db.patch("messages", m.id, { folder: "inbox", snoozedUntil: undefined });
  toast("Moved to inbox", { label: "Undo", run: () => db.patch("messages", m.id, { folder: m.folder, snoozedUntil: m.snoozedUntil }) });
}

export function snooze(m: Message, o: SnoozeOption) {
  const was = m.snoozedUntil;
  db.patch("messages", m.id, { snoozedUntil: o.until(), folder: "inbox" });
  toast(`Snoozed until ${o.label.toLowerCase()}`, { label: "Undo", run: () => db.patch("messages", m.id, { snoozedUntil: was, folder: m.folder }) });
}

export function unsnooze(m: Message) {
  db.patch("messages", m.id, { snoozedUntil: undefined });
  toast("Back in your inbox");
}

export function toggleStar(m: Message) {
  db.patch("messages", m.id, { starred: !m.starred });
}

export function remove(m: Message) {
  const list = db.get().messages;
  const i = list.findIndex((x) => x.id === m.id);
  db.remove("messages", m.id);
  toast(m.folder === "drafts" ? "Draft deleted" : "Deleted", {
    label: "Undo",
    run: () => db.set("messages", (l) => [...l.slice(0, i), m, ...l.slice(i)]),
  });
}

export function makeTask(m: Message) {
  const p = m.from;
  const title = m.needsReply ? `Reply to ${firstName(p)}: ${m.subject}` : m.subject;
  const task: Task = {
    id: newId("tk"),
    title,
    notes: `From ${p.name}, ${shortDate(m.date)}.`,
    due: m.needsReply ? on(1) : undefined,
    done: false,
    list: m.category === "work" ? "work" : "personal",
    from: { kind: "message", id: m.id },
    source: m.source,
    createdAt: new Date().toISOString(),
  };
  db.insert("tasks", task);
  toast("Task added", { label: "Undo", run: () => db.remove("tasks", task.id) });
}

const paras = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

const snip = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 140);

/** Adds your reply to Sent. Nothing leaves the app: this is sample data. */
export function sendReply(m: Message, text: string) {
  const reply: Message = {
    id: newId("msg"),
    from: me,
    to: [m.from],
    subject: /^re:/i.test(m.subject) ? m.subject : `Re: ${m.subject}`,
    snippet: snip(text),
    body: paras(text),
    date: new Date().toISOString(),
    folder: "sent",
    read: true,
    starred: false,
    category: m.category,
    replyTo: m.id,
    source: m.source,
  };
  db.insert("messages", reply);
  db.patch("messages", m.id, { needsReply: false, repliedAt: reply.date, read: true });
  toast("Reply added to Sent. Sample data, so nothing was sent.");
}

export type Draft = { id?: string; to: string; subject: string; body: string };

function parseTo(to: string): Person[] {
  return to
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const known = db.get().messages.find((x) => x.from.email.toLowerCase() === s.toLowerCase() || x.from.name.toLowerCase() === s.toLowerCase());
      if (known && known.from.email !== me.email) return known.from;
      const angle = s.match(/^(.*)<(.+)>$/);
      if (angle) return { name: angle[1].trim() || angle[2].trim(), email: angle[2].trim() };
      return { name: s.includes("@") ? s.split("@")[0] : s, email: s.includes("@") ? s : "" };
    });
}

export const toText = (people: Person[]) => people.map((p) => (p.email ? `${p.name} <${p.email}>` : p.name)).join(", ");

/** Send a new message or a draft. Returns the id of the sent message. */
export function sendNew(d: Draft, folder: "sent" | "drafts") {
  const existing = d.id ? db.find("messages", d.id) : undefined;
  const item: Message = {
    id: d.id ?? newId("msg"),
    from: me,
    to: parseTo(d.to),
    subject: d.subject.trim() || "(No subject)",
    snippet: snip(d.body),
    body: paras(d.body),
    date: new Date().toISOString(),
    folder,
    read: true,
    starred: existing?.starred ?? false,
    category: existing?.category ?? "personal",
    source: existing?.source ?? "gmail",
  };
  if (existing) db.patch("messages", existing.id, item);
  else db.insert("messages", item);
  if (folder === "sent") toast("Added to Sent. Sample data, so nothing was sent.", { label: "View", run: () => go(`inbox/${item.id}`) });
  else toast("Draft saved");
  return item.id;
}

export const bodyText = (m: Message) => m.body.join("\n\n");
