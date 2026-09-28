import { useEffect, useRef, useState } from "react";
import { ArrowUp, ShieldCheck } from "@phosphor-icons/react";
import { Orb } from "../../components/ui/Logo";
import { IconTile } from "../../components/previews/primitives";
import { convos, type Source } from "../../components/Assistant";
import { useStore } from "../store";

type Msg = { id: number; role: "user" | "orbit"; text: string; sources?: Source[] };

const keywords: [RegExp, number][] = [
  [/tomorrow|prepare/i, 0],
  [/week|coming up|busy/i, 1],
  [/bill|pay|due|owe/i, 2],
  [/flight|fly|plane|airport/i, 3],
  [/hotel|confirmation|reservation|stay/i, 4],
];

function answer(q: string): Omit<Msg, "id" | "role"> {
  const hit = keywords.find(([re]) => re.test(q));
  if (hit) {
    const c = convos[hit[1]];
    return { text: c.answer, sources: c.sources };
  }
  return {
    text: "In this demo I can answer questions about your week, bills, flights, hotel bookings and tomorrow's plans. Try one of the suggestions below.",
  };
}

export function AssistantScreen() {
  const { consumeAsk } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(1);
  const end = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    setMsgs((m) => [...m, { id: nextId.current++, role: "user", text }]);
    setQ("");
    setThinking(true);
    window.setTimeout(() => {
      setMsgs((m) => [...m, { id: nextId.current++, role: "orbit", ...answer(text) }]);
      setThinking(false);
    }, 700);
  };

  useEffect(() => {
    const queued = consumeAsk();
    if (queued) send(queued);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, thinking]);

  return (
    <div className="mx-auto flex max-w-[820px] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Orb className="size-9" />
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.03em]">Ask Orbit</h1>
          <p className="text-[13px] text-muted">Answers come from the services you've connected, with sources.</p>
        </div>
      </div>

      <div className="flex min-h-[280px] flex-col gap-5" aria-live="polite">
        {msgs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-6 text-center text-[13.5px] text-muted">
            Good morning, Alex. Ask about your day, a booking, a bill or anything in your connected accounts.
          </div>
        )}
        {msgs.map((m) =>
          m.role === "user" ? (
            <p key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[14.5px] text-paper">{m.text}</p>
          ) : (
            <div key={m.id} className="flex gap-3">
              <Orb className="mt-1 size-6" />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p className="text-[15px] leading-relaxed">{m.text}</p>
                {m.sources && (
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {m.sources.map((s) => (
                      <li key={s.title} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                        <IconTile icon={s.icon} tone={s.tone} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{s.title}</p>
                          <p className="truncate text-[12px] text-muted">{s.detail}</p>
                          <p className="mt-0.5 truncate text-[11px] text-accent-fg">Source: {s.source}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-3 text-[13px] text-muted">
            <Orb className="size-6 animate-pulse" /> Checking your connected sources...
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 bg-paper pb-2 pt-2">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {convos.map((c) => (
            <button key={c.prompt} type="button" onClick={() => send(c.ask)} className="shrink-0 rounded-full border border-line bg-soft px-3.5 py-1.5 text-[12.5px] text-muted hover:border-line-strong hover:text-ink">
              {c.prompt}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(q);
          }}
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2"
        >
          <label htmlFor="ask" className="sr-only">Ask Orbit</label>
          <input id="ask" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask Orbit anything..." autoComplete="off" className="h-10 flex-1 bg-transparent text-[14.5px] placeholder:text-faint focus:outline-none" />
          <button type="submit" aria-label="Send" disabled={thinking} className="grid size-9 place-items-center rounded-full bg-accent text-paper disabled:opacity-60">
            <ArrowUp size={15} weight="bold" />
          </button>
        </form>
        <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
          <ShieldCheck size={13} className="text-accent-fg" /> Demo answers are prepared examples, not a live AI.
        </p>
      </div>
    </div>
  );
}
