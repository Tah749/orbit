import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChatCircleText, MagnifyingGlass } from "@phosphor-icons/react";
import { sections } from "./sections";
import { go } from "./router";
import { db } from "./store";
import { cx, Kbd } from "./ui";
import { relDay } from "./time";

type Hit = { id: string; label: string; meta: string; path: string; group: string };

/** Everything searchable, built from the store when the palette opens. */
function index(): Hit[] {
  const d = db.get();
  return [
    ...sections.map((s) => ({ id: `s-${s.key}`, label: s.label, meta: "Go to", path: s.key, group: "Sections" })),
    ...d.messages.map((m) => ({ id: m.id, label: m.subject, meta: m.from.name, path: `inbox/${m.id}`, group: "Email" })),
    ...d.events.map((e) => ({ id: e.id, label: e.title, meta: relDay(e.start), path: `calendar/${e.id}`, group: "Calendar" })),
    ...d.tasks.filter((t) => !t.done).map((t) => ({ id: t.id, label: t.title, meta: t.due ? relDay(t.due) : "No date", path: `tasks/${t.id}`, group: "Tasks" })),
    ...d.bookings.map((b) => ({ id: b.id, label: b.title, meta: relDay(b.start), path: `plans/${b.id}`, group: "Plans" })),
    ...d.orders.map((o) => ({ id: o.id, label: `${o.retailer}: ${o.items[0].name}`, meta: o.status.replace(/-/g, " "), path: `deliveries/${o.id}`, group: "Deliveries" })),
    ...d.bills.map((b) => ({ id: b.id, label: b.name, meta: b.payee, path: `money/bills/${b.id}`, group: "Money" })),
    ...d.contacts.map((c) => ({ id: c.id, label: c.name, meta: c.relation, path: `people/${c.id}`, group: "People" })),
    ...d.docs.map((x) => ({ id: x.id, label: x.title, meta: x.expires ? `Renews ${relDay(x.expires)}` : "", path: `admin/${x.id}`, group: "Life admin" })),
  ];
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const all = useMemo(() => (open ? index() : []), [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setQ("");
      setSel(0);
      window.setTimeout(() => input.current?.focus(), 0);
    }
    if (!open && d.open) d.close();
  }, [open]);

  const needle = q.trim().toLowerCase();
  const hits = needle
    ? all.filter((h) => h.label.toLowerCase().includes(needle) || h.meta.toLowerCase().includes(needle)).slice(0, 12)
    : all.filter((h) => h.group === "Sections");
  // The first row always offers to ask Orbit the question as typed.
  const rows: Hit[] = needle ? [{ id: "ask", label: q.trim(), meta: "Ask Orbit", path: `ask/${encodeURIComponent(q.trim())}`, group: "Ask" }, ...hits] : hits;

  const pick = (h: Hit) => {
    go(h.path);
    onClose();
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Search or ask"
      className="mx-auto mt-[12vh] w-[min(92vw,600px)] rounded-[12px] border border-line bg-surface p-0 text-ink shadow-[0_30px_80px_-30px_var(--shade)] backdrop:bg-[color-mix(in_srgb,var(--ink)_22%,transparent)]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <MagnifyingGlass size={17} className="text-faint" />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") (e.preventDefault(), setSel((s) => Math.min(rows.length - 1, s + 1)));
            if (e.key === "ArrowUp") (e.preventDefault(), setSel((s) => Math.max(0, s - 1)));
            if (e.key === "Enter" && rows[sel]) pick(rows[sel]);
          }}
          placeholder="Search everything, or ask a question"
          aria-label="Search or ask"
          className="h-13 flex-1 bg-transparent py-4 text-[15px] placeholder:text-faint focus:outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>
      <ul role="listbox" aria-label="Results" className="max-h-[52vh] overflow-y-auto p-1.5">
        {rows.map((h, i) => (
          <li key={h.id} role="option" aria-selected={i === sel}>
            <button
              type="button"
              onMouseEnter={() => setSel(i)}
              onClick={() => pick(h)}
              className={cx("flex w-full items-center gap-3 rounded-[7px] px-3 py-2.5 text-left", i === sel && "bg-soft")}
            >
              {h.group === "Ask" ? <ChatCircleText size={16} className="text-accent" /> : <span className="w-[16px] font-mono text-[9.5px] uppercase text-faint">{h.group.slice(0, 2)}</span>}
              <span className="min-w-0 flex-1 truncate text-[14px]">{h.label}</span>
              <span className="shrink-0 text-[12px] text-muted">{h.meta}</span>
              {i === sel && <ArrowRight size={14} className="text-faint" />}
            </button>
          </li>
        ))}
        {needle && rows.length === 1 && <li className="px-3 py-3 text-[13px] text-muted">Nothing matches. Press Enter to ask Orbit instead.</li>}
      </ul>
    </dialog>
  );
}
