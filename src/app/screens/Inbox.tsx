import { useState } from "react";
import { AirplaneTakeoff, Receipt, EnvelopeSimple, BookmarkSimple, Cake, Warning, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { IconTile, Pill } from "../../components/previews/primitives";
import { useStore } from "../store";
import { inboxItems, type InboxItem } from "../data";
import { Card, Chip, PageHeader } from "../ui";

const filters = ["All", "Important", "Travel", "Bills", "Personal"] as const;
type Filter = (typeof filters)[number];

const iconFor = (i: InboxItem) =>
  i.kind === "Travel" ? { icon: AirplaneTakeoff, tone: "violet" as const }
  : i.kind === "Bills" ? { icon: Receipt, tone: "amber" as const }
  : i.kind === "Work" ? { icon: EnvelopeSimple, tone: "rose" as const }
  : i.title.includes("birthday") ? { icon: Cake, tone: "rose" as const }
  : { icon: BookmarkSimple, tone: "neutral" as const };

export function InboxScreen() {
  const { go, readInbox, markInboxRead, toast, addTask } = useStore();
  const [filter, setFilter] = useState<Filter>("All");
  const [done, setDone] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(1);

  const items = inboxItems.filter(
    (i) => !done.includes(i.id) && (filter === "All" || (filter === "Important" ? i.important : i.kind === filter || (filter === "Personal" && i.kind === "Personal"))),
  );
  const current = inboxItems.find((i) => i.id === selected && !done.includes(i.id)) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Life Inbox" subtitle="The things that need your attention, from across your connected services." />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {filters.map((f) => (
          <Chip key={f} on={filter === f} onClick={() => setFilter(f)}>
            {f}
            {f === "All" && ` ${inboxItems.length - done.length}`}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <ul className="flex flex-col gap-2">
          {items.length === 0 && (
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <CheckCircle size={28} className="text-accent" />
              <p className="text-[15px] font-medium">All clear</p>
              <p className="text-[13px] text-muted">Nothing here needs you right now.</p>
            </Card>
          )}
          {items.map((it) => {
            const { icon, tone } = iconFor(it);
            const unread = it.important && !readInbox.includes(it.id);
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(it.id);
                    markInboxRead(it.id);
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                    selected === it.id ? "border-accent/50 bg-soft" : "border-line bg-surface hover:border-[#433d52]"
                  }`}
                >
                  <IconTile icon={icon} tone={tone} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-[13.5px] ${unread ? "font-semibold" : "font-medium"}`}>{it.title}</p>
                      {it.badge && (
                        <Pill tone={it.badge.tone} className="shrink-0">
                          {it.badge.label === "High" && <Warning size={10} className="mr-0.5" />}
                          {it.badge.label}
                        </Pill>
                      )}
                    </div>
                    <p className="truncate text-[12.5px] text-muted">{it.preview}</p>
                    <p className="mt-1 text-[11px] text-[#8a8398]">{it.source}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted">{it.date}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {current ? (
          <Card className="flex h-fit flex-col gap-4 p-5 lg:sticky lg:top-4">
            <div className="flex items-start gap-3">
              <IconTile {...iconFor(current)} />
              <div>
                <h2 className="text-[17px] font-medium tracking-[-0.01em]">{current.title}</h2>
                <p className="text-[12.5px] text-muted">{current.source} · {current.date}</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2 rounded-xl bg-soft p-4 text-[13.5px] leading-snug">
              {current.detail.map((d) => (
                <li key={d} className="flex gap-2"><span className="mt-[7px] size-1 shrink-0 rounded-full bg-accent" />{d}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => go(current.action.tab)} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-paper hover:bg-[#ff6690]">
                {current.action.label} <ArrowRight size={13} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => {
                  addTask(current.title, "upcoming");
                  toast("Added to your tasks.");
                }}
                className="rounded-full border border-line px-4 py-2 text-[13px] hover:bg-soft"
              >
                Make it a task
              </button>
              <button
                type="button"
                onClick={() => {
                  setDone((d) => [...d, current.id]);
                  toast("Marked as done.");
                }}
                className="rounded-full border border-line px-4 py-2 text-[13px] hover:bg-soft"
              >
                Mark done
              </button>
            </div>
          </Card>
        ) : (
          <Card className="hidden h-fit p-8 text-center text-[13px] text-muted lg:block">Select an item to see the details.</Card>
        )}
      </div>
    </div>
  );
}
