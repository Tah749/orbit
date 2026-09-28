import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Archive,
  ArrowBendUpLeft,
  ArrowLeft,
  ArrowRight,
  CaretDown,
  CaretUp,
  CheckSquareOffset,
  Clock,
  EnvelopeSimple,
  FileText,
  PencilSimple,
  Star,
  Tray,
  Trash,
} from "@phosphor-icons/react";
import { Orb } from "../../../components/ui/Logo";
import { db, useDB, type DB } from "../../store";
import { href } from "../../router";
import { Avatar, Button, cx, IconButton, Kbd, Label, money, Source, Tag, Textarea } from "../../ui";
import { longDate, relDay, stamp, time } from "../../time";
import type { Ref } from "../../data/sources";
import type { Message } from "../../data/mail";
import { archive, counterpart, firstName, isSnoozed, makeTask, remove, sendReply, snooze, snoozeOptions, toggleStar, toInbox, unsnooze } from "./mail";

/** "today" and "tomorrow" read naturally mid-sentence; weekdays and dates keep their capitals. */
const when = (s: string) => relDay(s).replace(/^(Today|Tomorrow|Yesterday)$/, (w) => w.toLowerCase());

type Linked = { kind: string; title: string; meta?: string; path: string };

const bookingKind: Record<string, string> = { flight: "Flight", hotel: "Hotel", train: "Train", restaurant: "Table", event: "Tickets", car: "Car hire" };

function resolve(r: Ref, d: DB): Linked | null | undefined {
  switch (r.kind) {
    case "booking": {
      const b = d.bookings.find((x) => x.id === r.id);
      return b && { kind: bookingKind[b.kind] ?? "Booking", title: b.title, meta: `${relDay(b.start)}, ${time(b.start)}`, path: `plans/${b.id}` };
    }
    case "bill": {
      const b = d.bills.find((x) => x.id === r.id);
      return b && { kind: "Bill", title: `${b.name} · ${b.payee}`, meta: `${money(b.amount)} ${b.status === "paid" ? "paid" : `due ${when(b.due)}`}`, path: `money/bills/${b.id}` };
    }
    case "order": {
      const o = d.orders.find((x) => x.id === r.id);
      return o && { kind: "Delivery", title: `${o.retailer}: ${o.items[0]?.name ?? "order"}`, meta: o.status.replace(/-/g, " "), path: `deliveries/${o.id}` };
    }
    case "doc": {
      const x = d.docs.find((y) => y.id === r.id);
      return x && { kind: "Document", title: x.title, meta: x.expires ? `Renews ${when(x.expires)}` : undefined, path: `admin/${x.id}` };
    }
    case "event": {
      const e = d.events.find((x) => x.id === r.id);
      return e && { kind: "Event", title: e.title, meta: `${relDay(e.start)}, ${time(e.start)}`, path: `calendar/${e.id}` };
    }
    case "task": {
      const t = d.tasks.find((x) => x.id === r.id);
      return t && { kind: "Task", title: t.title, meta: t.due ? `Due ${when(t.due)}` : undefined, path: `tasks/${t.id}` };
    }
    case "contact": {
      const c = d.contacts.find((x) => x.id === r.id);
      return c && { kind: "Person", title: c.name, path: `people/${c.id}` };
    }
    default:
      return null;
  }
}

/** A small popover menu for snooze times. Closes on outside click and Escape. */
function SnoozeMenu({ m, compact }: { m: Message; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") {
          e.stopPropagation();
          setOpen(false);
        }
        return;
      }
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", off, true);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", off, true);
    };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <Button variant="ghost" size="sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cx(compact && "px-2")}>
        <Clock size={16} />
        <span className={cx(compact && "sr-only")}>Snooze</span>
      </Button>
      {open && (
        <div role="menu" className="absolute left-0 top-9 z-30 w-52 rounded-[8px] border border-line bg-surface py-1 shadow-[0_16px_40px_-20px_var(--shade)]">
          {snoozeOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                snooze(m, o);
              }}
              className="flex h-9 w-full items-center justify-between gap-3 px-3 text-left text-[13.5px] text-ink hover:bg-soft focus-visible:bg-soft"
            >
              {o.label}
              <span className="font-mono text-[11px] text-faint">{o.hint()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Toolbar({ m, onBack, onPrev, onNext, onEditDraft }: { m: Message; onBack?: () => void; onPrev?: () => void; onNext?: () => void; onEditDraft: () => void }) {
  const outgoing = m.folder === "sent" || m.folder === "drafts";
  const snoozed = isSnoozed(m);
  return (
    <div className="sticky top-12 z-10 md:top-0 flex h-12 items-center gap-1 border-b border-line bg-paper/95 px-2 backdrop-blur sm:px-4">
      {onBack && (
        <IconButton label="Back to list" onClick={onBack} className="-ml-1 lg:hidden">
          <ArrowLeft size={18} />
        </IconButton>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-0.5">
        {!outgoing && m.folder === "inbox" && !snoozed && (
          <Button variant="ghost" size="sm" onClick={() => archive(m)} title="Archive (e)" className="max-sm:px-2">
            <Archive size={16} />
            <span className="max-sm:sr-only">Archive</span>
          </Button>
        )}
        {!outgoing && (m.folder === "archive" || snoozed) && (
          <Button variant="ghost" size="sm" onClick={() => (snoozed ? unsnooze(m) : toInbox(m))} className="max-sm:px-2">
            <Tray size={16} />
            <span className="max-sm:sr-only">{snoozed ? "Unsnooze" : "Move to inbox"}</span>
          </Button>
        )}
        {!outgoing && <SnoozeMenu m={m} compact />}
        {!outgoing && (
          <Button variant="ghost" size="sm" onClick={() => makeTask(m)} className="max-sm:px-2">
            <CheckSquareOffset size={16} />
            <span className="max-sm:sr-only">Make a task</span>
          </Button>
        )}
        {m.folder === "drafts" && (
          <Button variant="ghost" size="sm" onClick={onEditDraft}>
            <PencilSimple size={16} />
            Edit draft
          </Button>
        )}
        {outgoing && (
          <Button variant="ghost" size="sm" onClick={() => remove(m)} className="max-sm:px-2">
            <Trash size={16} />
            <span className="max-sm:sr-only">Delete</span>
          </Button>
        )}
      </div>
      {!outgoing && (
        <IconButton label={m.read ? "Mark as unread" : "Mark as read"} onClick={() => db.patch("messages", m.id, { read: !m.read })}>
          <EnvelopeSimple size={17} weight={m.read ? "regular" : "fill"} />
        </IconButton>
      )}
      <IconButton label={m.starred ? "Unstar" : "Star"} aria-pressed={m.starred} onClick={() => toggleStar(m)} className={m.starred ? "text-warn hover:text-warn" : ""}>
        <Star size={17} weight={m.starred ? "fill" : "regular"} />
      </IconButton>
      <div className="hidden items-center lg:flex">
        <IconButton label="Previous message (k)" onClick={onPrev} disabled={!onPrev} className="disabled:opacity-35">
          <CaretUp size={16} />
        </IconButton>
        <IconButton label="Next message (j)" onClick={onNext} disabled={!onNext} className="disabled:opacity-35">
          <CaretDown size={16} />
        </IconButton>
      </div>
    </div>
  );
}

function Paragraphs({ text, className }: { text: string[]; className?: string }) {
  return (
    <div className={cx("space-y-2.5 leading-relaxed text-ink", className)}>
      {text.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

function NoteRow({ kind, title, meta, path }: Linked) {
  return (
    <li>
      <a href={href(path)} className="group flex min-h-11 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-soft/60">
        <span className="w-[72px] shrink-0 font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">{kind}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] text-ink">{title}</span>
          {meta && <span className="block truncate text-[12px] text-muted first-letter:uppercase">{meta}</span>}
        </span>
        <ArrowRight size={14} className="shrink-0 text-faint transition-colors group-hover:text-ink" />
      </a>
    </li>
  );
}

function OrbitNote({ m }: { m: Message }) {
  const linked = useDB((d) => (m.links ?? []).map((r) => resolve(r, d)).filter((x): x is Linked => !!x));
  const tasks = useDB((d) => d.tasks.filter((t) => t.from?.kind === "message" && t.from.id === m.id));
  const rows: Linked[] = [
    ...linked,
    ...tasks.map((t) => ({ kind: t.done ? "Task, done" : "Task", title: t.title, meta: t.due ? `Due ${when(t.due)}` : undefined, path: `tasks/${t.id}` })),
  ];
  const line = m.why ?? (m.needsReply ? `${firstName(m.from)} is waiting for a reply.` : null);
  if (!line && !rows.length) return null;
  return (
    <aside aria-label="Orbit note" className="mt-6 rounded-[10px] border border-line bg-surface">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Orb className="mt-[3px] size-4 shrink-0 text-ink" />
        <div className="min-w-0">
          <Label>Orbit note</Label>
          {line && <p className="mt-1 text-[14px] leading-snug text-ink">{line.replace(/([^.])$/, "$1.")}</p>}
          {!line && <p className="mt-1 text-[14px] leading-snug text-ink">Connected to {rows.length === 1 ? "one item" : `${rows.length} items`} in Orbit.</p>}
        </div>
      </div>
      {rows.length > 0 && <ul className="divide-y divide-line border-t border-line">{rows.map((r) => <NoteRow key={r.path} {...r} />)}</ul>}
    </aside>
  );
}

function Replies({ m }: { m: Message }) {
  const replies = useDB((d) => d.messages.filter((x) => x.replyTo === m.id && x.folder === "sent").sort((a, b) => a.date.localeCompare(b.date)));
  if (!replies.length) return null;
  return (
    <div className="mt-8 border-t border-line pt-5">
      <Label>Your {replies.length === 1 ? "reply" : "replies"}</Label>
      {replies.map((r) => (
        <a key={r.id} href={href(`inbox/${r.id}`)} className="-mx-2 mt-3 block rounded-[7px] px-2 py-1.5 transition-colors hover:bg-soft/50">
          <p className="text-[12.5px] text-muted">
            You, {when(r.date)} at {time(r.date)}
          </p>
          <Paragraphs text={r.body} className="mt-1 text-[14px]" />
        </a>
      ))}
    </div>
  );
}

function ReplyBox({ m, open, setOpen }: { m: Message; open: boolean; setOpen: (v: boolean) => void }) {
  const [text, setText] = useState("");
  const blank = useRef(false);
  const suggested = m.needsReply ? m.suggestedReply : undefined;

  useEffect(() => {
    if (!open) return;
    if (!blank.current) setText((t) => t || suggested || "");
    blank.current = false;
    window.setTimeout(() => document.getElementById("reply-text")?.focus(), 0);
  }, [open, suggested]);

  // A different message closes the reply and clears the text.
  useEffect(() => {
    setText("");
  }, [m.id]);

  const send = () => {
    if (!text.trim()) return;
    sendReply(m, text);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <div className="mt-8 border-t border-line pt-5">
        {suggested && (
          <div className="mb-4">
            <Label>Suggested reply</Label>
            <Paragraphs text={suggested.split(/\n\s*\n/)} className="mt-2 border-l border-line-strong pl-3 font-serif text-[16px] text-ink/85" />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={m.needsReply ? "primary" : "outline"} onClick={() => setOpen(true)}>
            <ArrowBendUpLeft size={16} />
            {suggested ? "Edit and reply" : "Reply"}
          </Button>
          {suggested && (
            <Button
              variant="ghost"
              onClick={() => {
                blank.current = true;
                setText("");
                setOpen(true);
              }}
            >
              Write my own
            </Button>
          )}
          <span className="ml-auto hidden text-[12px] text-faint sm:inline">
            <Kbd>r</Kbd> to reply
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mt-8 border-t border-line pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Label>Reply to {m.from.name}</Label>
        <span className="truncate text-[12px] text-faint">{m.from.email}</span>
      </div>
      <Textarea
        id="reply-text"
        aria-label={`Reply to ${m.from.name}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            send();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }
        }}
        rows={10}
        className="min-h-56 text-[14.5px]"
      />
      {suggested && text === suggested && <p className="mt-2 text-[12.5px] text-muted">Orbit drafted this from the email. Change anything before you send it.</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" disabled={!text.trim()}>
          Send
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Discard
        </Button>
        <span className="ml-auto text-[12px] text-faint">Sample app: replies go to Sent, nothing is emailed.</span>
      </div>
    </form>
  );
}

export function Reader({
  m,
  onBack,
  onPrev,
  onNext,
  replying,
  setReplying,
  onEditDraft,
}: {
  m: Message;
  onBack?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  replying: boolean;
  setReplying: (v: boolean) => void;
  onEditDraft: () => void;
}) {
  const outgoing = m.folder === "sent" || m.folder === "drafts";
  const who = counterpart(m);
  const contact = useDB((d) => d.contacts.find((c) => c.email && c.email.toLowerCase() === m.from.email.toLowerCase()));
  const original = useDB((d) => (m.replyTo ? d.messages.find((x) => x.id === m.replyTo) : undefined));
  const snoozed = isSnoozed(m);

  let status: ReactNode = null;
  if (snoozed) status = <Tag tone="info">Snoozed until {when(m.snoozedUntil!)}, {time(m.snoozedUntil!)}</Tag>;
  else if (m.folder === "archive") status = <Tag>Archived</Tag>;
  else if (m.folder === "drafts") status = <Tag tone="warn">Draft</Tag>;
  else if (m.needsReply) status = <Tag tone="warn">Needs reply</Tag>;

  return (
    <article aria-label={m.subject} className="min-w-0">
      <Toolbar m={m} onBack={onBack} onPrev={onPrev} onNext={onNext} onEditDraft={onEditDraft} />
      <div className="mx-auto max-w-[720px] px-4 pb-24 pt-6 sm:px-8 lg:pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <Source id={m.source} />
          {status}
        </div>
        <h2 className="mt-3 font-serif text-[27px] font-normal leading-[1.15] tracking-[-0.015em] text-ink md:text-[32px]">{m.subject}</h2>

        <div className="mt-5 flex items-start gap-3 border-b border-line pb-5">
          <Avatar name={outgoing ? "Alex Rowe" : m.from.name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2 text-[14px]">
              {contact ? (
                <a href={href(`people/${contact.id}`)} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  {m.from.name}
                </a>
              ) : (
                <span className="font-medium text-ink">{outgoing ? "You" : m.from.name}</span>
              )}
              <span className="truncate text-[12.5px] text-muted">{m.from.email}</span>
            </p>
            <p className="mt-0.5 truncate text-[12.5px] text-muted">To {outgoing ? who.name : m.to.length === 1 && m.to[0].email === "alex@rowe.example" ? "you" : m.to.map((p) => p.name).join(", ")}</p>
          </div>
          <p className="shrink-0 text-right font-mono text-[11.5px] leading-relaxed text-faint tabular-nums">
            <span className="block">{stamp(m.date)}</span>
            <span className="hidden sm:block">{longDate(m.date)}</span>
          </p>
        </div>

        {!outgoing && <OrbitNote m={m} />}

        {original && (
          <p className="mt-5 text-[13px] text-muted">
            In reply to{" "}
            <a href={href(`inbox/${original.id}`)} className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              {original.from.name}: {original.subject}
            </a>
          </p>
        )}

        <div className="mt-6 space-y-4 text-[15px] leading-[1.65] text-ink">
          {m.body.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        {!!m.attachments?.length && (
          <div className="mt-8">
            <Label className="mb-2">
              {m.attachments.length} attachment{m.attachments.length > 1 ? "s" : ""}
            </Label>
            <ul className="divide-y divide-line border-y border-line">
              {m.attachments.map((a) => (
                <li key={a.name} className="flex min-h-11 items-center gap-3 py-2">
                  <FileText size={18} className="shrink-0 text-faint" />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{a.name}</span>
                  <span className="shrink-0 font-mono text-[11.5px] text-faint">{a.size}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-faint">Attachments are part of the sample data and can't be opened.</p>
          </div>
        )}

        {!outgoing && (
          <>
            <Replies m={m} />
            <ReplyBox m={m} open={replying} setOpen={setReplying} />
          </>
        )}
        {m.folder === "drafts" && (
          <div className="mt-8 flex gap-2 border-t border-line pt-5">
            <Button variant="primary" onClick={onEditDraft}>
              <PencilSimple size={16} />
              Edit draft
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
