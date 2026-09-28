import { useState } from "react";
import { Sparkle, ArrowBendUpLeft, Archive, FileText, ArrowLeft, PaperPlaneTilt } from "@phosphor-icons/react";
import { Pill } from "../../components/previews/primitives";
import { useStore } from "../store";
import { mails } from "../data";
import { Card, Chip, Modal, PageHeader } from "../ui";

const folders = ["All", "Important", "Travel", "Bills"] as const;
type Folder = (typeof folders)[number];
const tagTone = { Important: "rose", Travel: "violet", Bills: "amber", Other: "neutral" } as const;

export function EmailScreen() {
  const { toast } = useStore();
  const [folder, setFolder] = useState<Folder>("All");
  // Desktop opens the first email beside the list; phones start on the list.
  const [selId, setSelId] = useState<number | null>(() => (window.matchMedia("(min-width: 1024px)").matches ? 1 : null));
  const [archived, setArchived] = useState<number[]>([]);
  const [read, setRead] = useState<number[]>([]);
  const [replied, setReplied] = useState<number[]>([]);
  const [draft, setDraft] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const list = mails.filter((m) => !archived.includes(m.id) && (folder === "All" || m.folder === folder));
  const sel = mails.find((m) => m.id === selId && !archived.includes(m.id)) ?? null;

  const open = (id: number) => {
    setSelId(id);
    setRead((r) => [...r, id]);
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Email" subtitle="Gmail, connected as an example account." />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {folders.map((f) => (
          <Chip key={f} on={folder === f} onClick={() => setFolder(f)}>{f}</Chip>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className={`h-fit overflow-hidden ${sel ? "hidden lg:block" : ""}`}>
          <ul className="divide-y divide-line">
            {list.map((m) => {
              const unread = m.unread && !read.includes(m.id);
              return (
                <li key={m.id}>
                  <button type="button" onClick={() => open(m.id)} className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors ${selId === m.id ? "bg-soft" : "hover:bg-soft/60"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex items-center gap-2 truncate text-[13.5px] ${unread ? "font-semibold" : ""}`}>
                        {unread && <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                        {m.from}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted">{m.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12.5px] text-muted">{m.subject}</span>
                      {replied.includes(m.id) ? <Pill tone="neutral" className="shrink-0">Replied</Pill> : <Pill tone={tagTone[m.folder]} className="shrink-0">{m.folder}</Pill>}
                    </div>
                  </button>
                </li>
              );
            })}
            {list.length === 0 && <li className="p-6 text-center text-[13px] text-muted">No emails here.</li>}
          </ul>
        </Card>

        {sel && (
          <Card className="flex h-fit flex-col gap-4 p-5">
            <button type="button" onClick={() => setSelId(null)} className="flex items-center gap-1.5 text-[13px] text-muted lg:hidden">
              <ArrowLeft size={13} /> All email
            </button>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[17px] font-medium tracking-[-0.01em]">{sel.subject}</h2>
                <p className="truncate text-[12.5px] text-muted">{sel.from} &lt;{sel.email}&gt; · {sel.time}</p>
              </div>
              <button
                type="button"
                aria-label="Archive"
                onClick={() => {
                  setArchived((a) => [...a, sel.id]);
                  toast("Archived.");
                }}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink"
              >
                <Archive size={15} />
              </button>
            </div>
            <div className="rounded-xl bg-accent-bg p-4">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-accent-fg"><Sparkle size={13} weight="fill" /> Summary</p>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[13.5px] leading-snug marker:text-accent">
                {sel.summary.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink/90">{sel.body}</p>
            {sel.attachment && (
              <p className="flex w-fit items-center gap-2 rounded-xl border border-line px-3 py-2 text-[12.5px] text-muted"><FileText size={15} /> {sel.attachment}</p>
            )}
            {draft === null ? (
              <div className="flex flex-wrap gap-2">
                {sel.suggestedReply && (
                  <button type="button" onClick={() => setDraft(sel.suggestedReply!)} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-paper hover:bg-accent-hover">
                    <Sparkle size={13} weight="fill" /> Suggest a reply
                  </button>
                )}
                <button type="button" onClick={() => setDraft("")} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] hover:bg-soft">
                  <ArrowBendUpLeft size={13} /> Reply
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="reply" className="text-[12.5px] font-medium text-muted">Your reply (edit before sending)</label>
                <textarea id="reply" value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} className="rounded-xl border border-line bg-soft p-3 text-[13.5px] leading-relaxed focus:border-accent focus:outline-none" />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => (draft.trim() ? setConfirm(true) : toast("Write a reply first."))} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-paper">
                    <PaperPlaneTilt size={13} weight="fill" /> Review and send
                  </button>
                  <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-line px-4 py-2 text-[13px] hover:bg-soft">Discard</button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Send this reply?">
        <p className="text-[13.5px] text-muted">Orbit always asks before sending anything on your behalf.</p>
        <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-xl bg-soft p-3 text-[13px]">{draft}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setConfirm(false)} className="rounded-full border border-line px-4 py-2 text-[13px]">Keep editing</button>
          <button
            type="button"
            onClick={() => {
              setConfirm(false);
              if (sel) setReplied((r) => [...r, sel.id]);
              setDraft(null);
              toast("Demo only: marked as replied, nothing was sent.");
            }}
            className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-paper"
          >
            Send
          </button>
        </div>
      </Modal>
    </div>
  );
}
