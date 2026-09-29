import { router } from "expo-router";
import { on, shortDate } from "@orbit/time";
import type { Message, Person } from "@orbit/data/mail";
import type { Task } from "@orbit/data/tasks";
import { db, newId } from "../../store";
import { toast } from "../../ui";
import { firstName, me, type SnoozeOption } from "./views";

/* Mail actions against the mobile db. Same behaviour as the web's mail.ts. */

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

export const toggleStar = (m: Message) => db.patch("messages", m.id, { starred: !m.starred });
export const toggleRead = (m: Message) => db.patch("messages", m.id, { read: !m.read });
export const markRead = (id: string) => db.patch("messages", id, { read: true });

export function remove(m: Message) {
  const i = db.get().messages.findIndex((x) => x.id === m.id);
  db.remove("messages", m.id);
  toast(m.folder === "drafts" ? "Draft deleted" : "Deleted", {
    label: "Undo",
    run: () => db.set("messages", (l) => [...l.slice(0, i), m, ...l.slice(i)]),
  });
}

export function makeTask(m: Message) {
  const p = m.from;
  const task: Task = {
    id: newId("tk"),
    title: m.needsReply ? `Reply to ${firstName(p)}: ${m.subject}` : m.subject,
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
  return reply.id;
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

/** Send a new message or a draft. Returns the id of the message. */
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
  if (folder === "sent") toast("Added to Sent. Sample data, so nothing was sent.", { label: "View", run: () => router.push(`/inbox/${item.id}` as never) });
  else toast("Draft saved");
  return item.id;
}
