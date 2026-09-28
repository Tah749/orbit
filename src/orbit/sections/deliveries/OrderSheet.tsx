import { useEffect, useState } from "react";
import { ArrowUpRight, Copy } from "@phosphor-icons/react";
import { db, newId, useDB } from "../../store";
import type { Order } from "../../data/plans";
import type { Task } from "../../data/tasks";
import { href } from "../../router";
import { Amount, Button, cx, Facts, IconButton, Label, Sheet, Source, Tag, Textarea, toast } from "../../ui";
import { dayLabel, daysFrom, relDay, stamp } from "../../time";
import { etaText, eventStamp, returnReminderDue, returnWindow } from "./lib";

async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} copied`);
  } catch {
    toast(`Couldn't copy the ${what.toLowerCase()}`);
  }
}

export const statusText: Record<Order["status"], string> = {
  ordered: "Ordered",
  dispatched: "On the way",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  returned: "Returned",
};

export function markReceived(o: Order) {
  const prev = { status: o.status, events: o.events };
  db.patch("orders", o.id, { status: "delivered", events: [...o.events, { at: new Date().toISOString(), text: "Marked as received by you" }] });
  toast("Marked as received", { label: "Undo", run: () => db.patch("orders", o.id, prev) });
}

function Timeline({ o }: { o: Order }) {
  const pending = o.status !== "delivered" && o.status !== "returned";
  const last = o.events.length - 1;
  return (
    <ol className="relative">
      {o.events.map((e, i) => (
        <li key={i} className="relative grid grid-cols-[18px_minmax(0,1fr)] gap-x-3 pb-4 last:pb-0">
          {(i < last || pending) && <span aria-hidden className="absolute bottom-0 left-[4.5px] top-[14px] w-px bg-line-strong" />}
          <span aria-hidden className={cx("mt-[5px] size-2.5 rounded-full", i === last ? "bg-accent" : "bg-ink/70")} />
          <div className="min-w-0">
            <p className={cx("text-[13.5px]", i === last ? "font-medium text-ink" : "text-ink")}>{e.text}</p>
            <p className="font-mono text-[11.5px] tabular-nums text-muted">{eventStamp(e.at)}</p>
          </div>
        </li>
      ))}
      {pending && (
        <li className="relative grid grid-cols-[18px_minmax(0,1fr)] gap-x-3 pt-4">
          <span aria-hidden className="mt-[5px] size-2.5 rounded-full border-[1.5px] border-line-strong bg-paper" />
          <div>
            <p className="text-[13.5px] text-muted">Delivered</p>
            <p className="font-mono text-[11.5px] text-faint">{etaText(o)}</p>
          </div>
        </li>
      )}
    </ol>
  );
}

function Notes({ o }: { o: Order }) {
  const [draft, setDraft] = useState(o.notes ?? "");
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setDraft(o.notes ?? "");
    setEditing(false);
  }, [o.id, o.notes]);
  const save = () => {
    db.patch("orders", o.id, { notes: draft.trim() || undefined });
    setEditing(false);
    toast(draft.trim() ? "Note saved" : "Note removed");
  };
  return (
    <div>
      <Label className="mb-2">Your notes</Label>
      {editing ? (
        <div className="grid gap-2">
          <Textarea autoFocus aria-label="Note" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Size runs small, gift for Sam, leave with number 12" />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={save}>
              Save note
            </Button>
            <Button size="sm" variant="ghost" onClick={() => (setDraft(o.notes ?? ""), setEditing(false))}>
              Cancel
            </Button>
          </div>
        </div>
      ) : o.notes ? (
        <button type="button" onClick={() => setEditing(true)} className="w-full rounded-[7px] text-left text-[13.5px] leading-relaxed text-ink hover:bg-soft/60">
          <span className="whitespace-pre-wrap">{o.notes}</span>
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

export function OrderSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const o = useDB((d) => (id ? d.orders.find((x) => x.id === id) : undefined));
  const mails = useDB((d) => (id ? d.messages.filter((m) => m.links?.some((l) => l.kind === "order" && l.id === id)) : []));
  const task = useDB((d) => (id ? d.tasks.find((t) => !t.done && t.from?.kind === "order" && t.from.id === id) : undefined));

  const rw = o ? returnWindow(o) : undefined;
  const received = o?.status === "delivered" || o?.status === "returned";

  const remind = () => {
    if (!o) return;
    const t: Task = {
      id: newId("tk"),
      title: `Return ${o.items[0]?.name ?? "order"} to ${o.retailer}`,
      notes: `Return window ends ${dayLabel(o.returnBy!)}.`,
      due: returnReminderDue(o),
      done: false,
      list: "personal",
      from: { kind: "order", id: o.id },
      source: "manual",
      createdAt: new Date().toISOString(),
    };
    db.insert("tasks", t);
    const due = relDay(t.due!);
    toast(`Reminder set for ${Math.abs(daysFrom(t.due!)) <= 1 ? due.toLowerCase() : due}`, { label: "Undo", run: () => db.remove("tasks", t.id) });
  };

  return (
    <Sheet
      open={!!o}
      onClose={onClose}
      title={o?.retailer ?? ""}
      footer={
        o && (
          <>
            {rw?.open &&
              (task ? (
                <a href={href(`tasks/${task.id}`)} className="inline-flex h-9 items-center rounded-[7px] border border-line bg-surface px-3.5 text-[13.5px] font-medium text-ink hover:border-line-strong">
                  Return reminder set
                </a>
              ) : (
                <Button variant={received ? "primary" : "outline"} onClick={remind}>
                  Remind me to return
                </Button>
              ))}
            {!received && (
              <Button variant="primary" onClick={() => markReceived(o)}>
                Mark as received
              </Button>
            )}
          </>
        )
      }
    >
      {o && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone={o.status === "out-for-delivery" ? "accent" : o.status === "returned" ? "info" : "neutral"}>{statusText[o.status]}</Tag>
              <span className="text-[13px] text-muted">Ordered {dayLabel(o.orderedAt)}</span>
            </div>
            <p className={cx("mt-3 text-[15px] tabular-nums", rw?.urgent ? "text-coral" : "text-ink")}>{received ? (rw ? rw.text : statusText[o.status]) : etaText(o)}</p>
          </div>

          <div>
            <Label className="mb-2">Items</Label>
            <ul className="divide-y divide-line border-t border-line">
              {o.items.map((it, i) => (
                <li key={i} className="flex items-baseline gap-3 py-2.5 text-[13.5px]">
                  <span className="min-w-0 flex-1 text-ink">
                    {it.name}
                    {it.qty > 1 && <span className="text-muted"> × {it.qty}</span>}
                  </span>
                  <Amount value={it.price * it.qty} className="text-ink" />
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-ink/70 pt-2.5 text-[14px] font-medium">
              <span>Total</span>
              <Amount value={o.total} />
            </div>
          </div>

          {o.tracking && (
            <div>
              <Label className="mb-1.5">Tracking number</Label>
              <div className="flex items-center gap-2">
                <span className="min-w-0 break-all font-mono text-[17px] tracking-[0.04em] text-ink">{o.tracking}</span>
                <IconButton label="Copy tracking number" onClick={() => copyText(o.tracking!, "Tracking number")}>
                  <Copy size={16} />
                </IconButton>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-3">Tracking</Label>
            <Timeline o={o} />
          </div>

          <Facts
            items={[
              ["Carrier", o.carrier ?? "Not given yet"],
              ...(o.returnBy ? ([["Return by", `${dayLabel(o.returnBy)}${rw?.open ? `, ${rw.short}` : ""}`]] as [string, string][]) : []),
              ["From", <Source key="s" id={o.source} />],
            ]}
          />

          {mails.length > 0 && (
            <div>
              <Label className="mb-2">Related</Label>
              <ul className="divide-y divide-line border-y border-line">
                {mails.map((m) => (
                  <li key={m.id}>
                    <a href={href(`inbox/${m.id}`)} className="group flex min-h-11 items-center gap-3 px-1 py-2 text-[13.5px] hover:bg-soft/60">
                      <span className="w-[52px] shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">Email</span>
                      <span className="min-w-0 flex-1 truncate text-ink">{m.subject}</span>
                      <span className="shrink-0 text-[12px] tabular-nums text-muted">{stamp(m.date)}</span>
                      <ArrowUpRight size={14} className="shrink-0 text-faint group-hover:text-ink" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Notes o={o} />
        </div>
      )}
    </Sheet>
  );
}
