import { useState } from "react";
import { Sparkle, MapPin, Clock, CaretLeft, CaretRight, Plus, LinkSimple } from "@phosphor-icons/react";
import { useStore } from "../store";
import { calEvents, weekDays, type CalEvent } from "../data";
import { Card, Modal, PageHeader } from "../ui";

const tone = {
  violet: "bg-[#1f1936] text-info",
  rose: "bg-accent-bg text-accent-fg",
  amber: "bg-[#2b1d12] text-warn",
  neutral: "bg-soft text-ink",
};
const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
const START = 7, END = 22, H = 44;

export function CalendarScreen() {
  const { toast } = useStore();
  const [day, setDay] = useState(1);
  const [sel, setSel] = useState<CalEvent | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const dayEvents = calEvents.filter((e) => e.day === day).sort((a, b) => a.start - b.start);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Calendar"
        subtitle="Week of 13 October"
        actions={
          <>
            <div className="flex items-center rounded-full border border-line">
              <button type="button" aria-label="Previous week" onClick={() => toast("The demo only has this week.")} className="grid size-9 place-items-center text-muted hover:text-ink"><CaretLeft size={14} /></button>
              <span className="px-1 text-[13px]">This week</span>
              <button type="button" aria-label="Next week" onClick={() => toast("The demo only has this week.")} className="grid size-9 place-items-center text-muted hover:text-ink"><CaretRight size={14} /></button>
            </div>
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-paper hover:bg-[#ff6690]">
              <Plus size={13} weight="bold" /> New event
            </button>
          </>
        }
      />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {weekDays.map((d, i) => {
          const [dow, num] = d.split(" ");
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(i)}
              aria-pressed={day === i}
              className={`flex min-w-14 flex-col items-center rounded-2xl px-3 py-2 transition-colors ${day === i ? "bg-accent text-paper" : "border border-line text-muted hover:text-ink"}`}
            >
              <span className="text-[11px]">{dow}</span>
              <span className="font-mono text-[16px]">{num}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="hidden overflow-x-auto p-4 md:block">
          <div className="grid min-w-[640px] grid-cols-[40px_repeat(7,minmax(0,1fr))] gap-1.5">
            <span />
            {weekDays.map((d, i) => (
              <button key={d} type="button" onClick={() => setDay(i)} className={`pb-2 text-center text-[12px] ${i === day ? "font-medium text-accent" : "text-muted hover:text-ink"}`}>
                {d}
              </button>
            ))}
            <div className="relative" style={{ height: (END - START) * H }}>
              {Array.from({ length: END - START }, (_, i) => START + i).filter((h) => h % 2 === 0).map((h) => (
                <span key={h} className="absolute right-1 font-mono text-[10px] text-[#6e6780]" style={{ top: (h - START) * H - 6 }}>{fmt(h)}</span>
              ))}
            </div>
            {weekDays.map((d, di) => (
              <div
                key={d}
                className={`relative rounded-lg ${di === day ? "bg-[#1a1722]" : ""}`}
                style={{ height: (END - START) * H, backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${H * 2 - 1}px, rgba(46,42,58,0.6) ${H * 2 - 1}px, rgba(46,42,58,0.6) ${H * 2}px)` }}
              >
                {calEvents.filter((e) => e.day === di).map((e) => (
                  <button
                    key={e.title}
                    type="button"
                    onClick={() => setSel(e)}
                    className={`absolute inset-x-1 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight shadow-[inset_2px_0_0_currentColor] transition-transform hover:scale-[1.02] ${tone[e.tone]}`}
                    style={{ top: (e.start - START) * H + 1, height: Math.max(e.len * H - 3, 20) }}
                  >
                    <span className="block truncate font-medium">{e.title}</span>
                    {e.len >= 1 && <span className="block truncate opacity-75">{fmt(e.start)}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-2 p-4">
            <h2 className="text-[14px] font-medium">{weekDays[day]} October</h2>
            {dayEvents.length === 0 && <p className="py-4 text-[13px] text-muted">Nothing planned. Enjoy the free day.</p>}
            {dayEvents.map((e) => (
              <button key={e.title} type="button" onClick={() => setSel(e)} className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-soft">
                <span className="w-11 font-mono text-[11.5px] text-muted">{fmt(e.start)}</span>
                <span className={`h-8 w-[3px] rounded-full ${e.tone === "violet" ? "bg-info" : e.tone === "rose" ? "bg-accent" : e.tone === "amber" ? "bg-warn" : "bg-muted"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{e.title}</span>
                  <span className="block truncate text-[11.5px] text-muted">{e.where}</span>
                </span>
              </button>
            ))}
          </Card>
          <div className="rounded-2xl border border-[#3a2a55] bg-[#17122a] p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-info"><Sparkle size={13} weight="fill" /> Insight</p>
            <p className="mt-1.5 text-[13.5px] leading-snug">
              You have 45 minutes between your Friday wrap-up call and your train. Waverley is a 10 minute walk from the hotel.
            </p>
          </div>
        </div>
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.title ?? ""}>
        {sel && (
          <>
            <ul className="flex flex-col gap-2 text-[13.5px]">
              <li className="flex items-center gap-2 text-muted"><Clock size={15} /> {weekDays[sel.day]} Oct, {fmt(sel.start)} to {fmt(sel.start + sel.len)}</li>
              {sel.where && <li className="flex items-center gap-2 text-muted"><MapPin size={15} /> {sel.where}</li>}
              {sel.context && <li className="flex items-center gap-2 text-accent-fg"><LinkSimple size={15} /> {sel.context}</li>}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSel(null);
                  toast("Orbit suggested moving it 30 minutes later. Nothing changes until you approve.");
                }}
                className="rounded-full border border-line px-4 py-2 text-[13px] hover:bg-soft"
              >
                Suggest a new time
              </button>
              <button type="button" onClick={() => { setSel(null); toast("Reminder set for 15 minutes before."); }} className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-paper">
                Remind me
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title="New event">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setAdding(false);
            setTitle("");
            toast(title.trim() ? `"${title.trim()}" is ready to add. In the real app, you'd confirm first.` : "Give the event a name first.");
          }}
        >
          <label htmlFor="ev-title" className="text-[13px] font-medium">Event name</label>
          <input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Coffee with Tomás" className="h-11 rounded-xl border border-line bg-soft px-4 text-[14px] placeholder:text-[#8a8398] focus:border-accent focus:outline-none" />
          <button type="submit" className="mt-1 rounded-full bg-accent py-2.5 text-[14px] font-medium text-paper">Add to calendar</button>
        </form>
      </Modal>
    </div>
  );
}
