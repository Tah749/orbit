import { useEffect, useState } from "react";
import { ArrowUpRight, Copy } from "@phosphor-icons/react";
import { db, newId, useDB } from "../../store";
import type { Booking } from "../../data/plans";
import type { Task } from "../../data/tasks";
import { href } from "../../router";
import { Button, Facts, IconButton, Label, Sheet, Source, Tag, Textarea, toast } from "../../ui";
import { relDay, stamp, time } from "../../time";
import { dayPhrase, dayWord, openTaskFor, reminderFor, statusText, statusTone, whenText } from "./lib";
import { kinds } from "./kinds";

export async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} copied`);
  } catch {
    toast(`Couldn't copy the ${what.toLowerCase()}`);
  }
}

export function addReminder(b: Booking, r: { title: string; due: string }) {
  const task: Task = { id: newId("tk"), title: r.title, due: r.due, done: false, list: "personal", from: { kind: "booking", id: b.id }, source: "manual", createdAt: new Date().toISOString() };
  db.insert("tasks", task);
  toast(`Added to tasks for ${dayWord(r.due)}`, { label: "Undo", run: () => db.remove("tasks", task.id) });
}

function Related({ id }: { id: string }) {
  const mails = useDB((d) => d.messages.filter((m) => m.links?.some((l) => l.kind === "booking" && l.id === id)));
  const events = useDB((d) => d.events.filter((e) => e.links?.some((l) => l.kind === "booking" && l.id === id)));
  const tasks = useDB((d) => d.tasks.filter((t) => t.from?.kind === "booking" && t.from.id === id));
  const rows = [
    ...mails.map((m) => ({ key: m.id, kind: "Email", text: m.subject, meta: stamp(m.date), path: `inbox/${m.id}` })),
    ...events.map((e) => ({ key: e.id, kind: "Calendar", text: e.title, meta: `${relDay(e.start)} ${time(e.start)}`, path: `calendar/${e.id}` })),
    ...tasks.map((t) => ({ key: t.id, kind: t.done ? "Task, done" : "Task", text: t.title, meta: t.due ? relDay(t.due) : "", path: `tasks/${t.id}` })),
  ];
  if (!rows.length) return null;
  return (
    <div>
      <Label className="mb-2">Related</Label>
      <ul className="divide-y divide-line border-y border-line">
        {rows.map((r) => (
          <li key={r.key}>
            <a href={href(r.path)} className="group flex min-h-11 items-center gap-3 px-1 py-2 text-[13.5px] hover:bg-soft/60">
              <span className="w-[68px] shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">{r.kind}</span>
              <span className="min-w-0 flex-1 truncate text-ink">{r.text}</span>
              <span className="shrink-0 text-[12px] tabular-nums text-muted">{r.meta}</span>
              <ArrowUpRight size={14} className="shrink-0 text-faint group-hover:text-ink" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Notes({ b }: { b: Booking }) {
  const [draft, setDraft] = useState(b.notes ?? "");
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setDraft(b.notes ?? "");
    setEditing(false);
  }, [b.id, b.notes]);
  const save = () => {
    db.patch("bookings", b.id, { notes: draft.trim() || undefined });
    setEditing(false);
    toast(draft.trim() ? "Note saved" : "Note removed");
  };
  return (
    <div>
      <Label className="mb-2">Your notes</Label>
      {editing ? (
        <div className="grid gap-2">
          <Textarea autoFocus aria-label="Notes" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Door codes, who's collecting the keys, what to pack" />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={save}>
              Save note
            </Button>
            <Button size="sm" variant="ghost" onClick={() => (setDraft(b.notes ?? ""), setEditing(false))}>
              Cancel
            </Button>
          </div>
        </div>
      ) : b.notes ? (
        <button type="button" onClick={() => setEditing(true)} className="w-full rounded-[7px] text-left text-[13.5px] leading-relaxed text-ink hover:bg-soft/60">
          <span className="whitespace-pre-wrap">{b.notes}</span>
          <span className="mt-1 block text-[12px] text-muted underline decoration-line-strong underline-offset-4">Edit note</span>
        </button>
      ) : (
        <Button size="sm" onClick={() => setEditing(true)}>
          Add a note
        </Button>
      )}
    </div>
  );
}

export function BookingSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const b = useDB((d) => (id ? d.bookings.find((x) => x.id === id) : undefined));
  const trip = useDB((d) => (b?.tripId ? d.trips.find((t) => t.id === b.tripId) : undefined));
  const tasks = useDB((d) => d.tasks);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => setConfirming(false), [id]);

  const r = b ? reminderFor(b) : undefined;
  const existing = b && r ? openTaskFor(tasks, b.id, r.title) : undefined;
  const cancelled = b?.status === "cancelled";
  const K = b ? kinds[b.kind] : undefined;

  const cancel = () => {
    if (!b) return;
    const prev = b.status;
    db.patch("bookings", b.id, { status: "cancelled" });
    setConfirming(false);
    toast("Booking marked as cancelled", { label: "Undo", run: () => db.patch("bookings", b.id, { status: prev }) });
  };

  return (
    <Sheet
      open={!!b}
      onClose={onClose}
      title={b ? <span className={cancelled ? "text-muted line-through decoration-1" : undefined}>{b.title}</span> : ""}
      footer={
        b &&
        (confirming ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <p className="mr-auto text-[13px] text-muted">Mark this as cancelled in Orbit?</p>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={cancel}>
              Yes, cancel
            </Button>
          </div>
        ) : (
          <>
            {!cancelled && (
              <Button variant="danger" onClick={() => setConfirming(true)}>
                Cancel booking
              </Button>
            )}
            {existing ? (
              <a href={href(`tasks/${existing.id}`)} className="inline-flex h-9 items-center rounded-[7px] border border-line bg-surface px-3.5 text-[13.5px] font-medium text-ink hover:border-line-strong">
                In your tasks
              </a>
            ) : (
              !cancelled && (
                <Button variant="primary" onClick={() => addReminder(b, r!)}>
                  Add to tasks
                </Button>
              )
            )}
          </>
        ))
      }
    >
      {b && K && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-7">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                <K.icon size={14} className="text-faint" />
                {K.name}
              </span>
              <Tag tone={statusTone[b.status]}>{statusText[b.status]}</Tag>
            </div>
            <p className="mt-3 text-[15px] tabular-nums text-ink">{whenText(b)}</p>
            {trip && (
              <a href={href(`plans/trip/${trip.id}`)} className="mt-1 inline-block text-[13px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
                Part of your {trip.title} trip
              </a>
            )}
          </div>

          {b.ref && (
          <div>
            <Label className="mb-1.5">Reference</Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[20px] tracking-[0.06em] text-ink">{b.ref}</span>
              <IconButton label="Copy reference" onClick={() => copyText(b.ref, "Reference")}>
                <Copy size={16} />
              </IconButton>
            </div>
          </div>
          )}

          <Facts items={[...(b.provider ? ([["Provider", b.provider]] as [string, string][]) : []), ...b.details, ["Status", statusText[b.status]], ["From", <Source key="s" id={b.source} />]]} />

          {!cancelled && existing === undefined && r && (
            <p className="-mt-2 text-[12.5px] text-muted">
              Add to tasks reminds you: “{r.title}”, {dayPhrase(r.due)}.
            </p>
          )}

          <Notes b={b} />
          <Related id={b.id} />
        </div>
      )}
    </Sheet>
  );
}
