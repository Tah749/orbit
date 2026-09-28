import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { db } from "../../store";
import { href, useRoute } from "../../router";
import { Button, cx, Label, Source } from "../../ui";
import { time } from "../../time";
import { ask, suggestions, type Answer, type Cite } from "./engine";

type Exchange = { id: number; q: string; a: Answer; at: string };

/** The conversation lasts for the session, so it's still here after a look at another section. */
let thread: Exchange[] = [];

function Sources({ cites }: { cites: Cite[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? cites : cites.slice(0, 6);
  return (
    <div className="mt-5">
      <Label>{cites.length === 1 ? "Source" : `Sources · ${cites.length}`}</Label>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {shown.map((c, i) => (
          <li key={`${c.href}-${i}`}>
            <a href={href(c.href)} className="flex min-w-0 items-center gap-3 px-1 py-2.5 transition-colors hover:bg-soft/60">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] text-ink">{c.title}</span>
                <span className="mt-0.5 flex min-w-0 items-center gap-3 text-[12px] text-muted">
                  <Source id={c.source} />
                  {c.meta && <span className="truncate">{c.meta}</span>}
                </span>
              </span>
              {c.date && <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-faint">{c.date}</span>}
            </a>
          </li>
        ))}
      </ul>
      {cites.length > shown.length && (
        <button type="button" onClick={() => setAll(true)} className="mt-2 text-[12.5px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
          Show {cites.length - shown.length} more
        </button>
      )}
    </div>
  );
}

function Suggestions({ items, onPick, className }: { items: string[]; onPick: (q: string) => void; className?: string }) {
  return (
    <ul className={cx("flex flex-col items-start", className)}>
      {items.map((s) => (
        <li key={s}>
          <button
            type="button"
            onClick={() => onPick(s)}
            className="py-1.5 text-left text-[15px] leading-snug text-ink underline decoration-line-strong underline-offset-[5px] transition-colors hover:decoration-ink"
          >
            {s}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ExchangeView({ ex, onPick, last }: { ex: Exchange; onPick: (q: string) => void; last: boolean }) {
  return (
    <li data-last={last || undefined} className="scroll-mt-16 border-t border-line py-8 first:border-t-0 md:scroll-mt-8">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">Asked at {time(ex.at)}</p>
      <h2 className="mt-2 font-serif text-[24px] font-normal leading-[1.2] tracking-[-0.01em] text-ink [overflow-wrap:anywhere] md:text-[28px]">{ex.q}</h2>
      <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-ink">{ex.a.text}</p>
      {ex.a.cites.length > 0 && <Sources cites={ex.a.cites} />}
      {!ex.a.matched && (
        <div className="mt-5">
          <Label>You could ask</Label>
          <Suggestions items={suggestions.slice(0, 4)} onPick={onPick} className="mt-1" />
        </div>
      )}
    </li>
  );
}

export default function AskPage() {
  const route = useRoute();
  const [items, setItems] = useState<Exchange[]>(() => thread);
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const scrollNext = useRef(false);

  const submit = useCallback((text: string) => {
    const q = text.trim();
    if (!q) return;
    thread = [...thread, { id: Date.now() + Math.random(), q, a: ask(q, db.get()), at: new Date().toISOString() }];
    scrollNext.current = true;
    setItems(thread);
    setDraft("");
  }, []);

  // `#/app/ask/<question>` (from the command palette) asks it on arrival.
  const linked = route.rest[0];
  useEffect(() => {
    if (linked && thread[thread.length - 1]?.q !== linked.trim()) submit(linked);
  }, [linked, submit]);

  useEffect(() => {
    if (!scrollNext.current) return;
    scrollNext.current = false;
    // After the shell's own scroll-to-top on navigation.
    const id = window.requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      list.current?.querySelector("[data-last]")?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [items]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) input.current?.focus();
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(draft);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    // Up arrow in an empty box brings back the last question, like a terminal.
    if (e.key === "ArrowUp" && !draft && thread.length) {
      e.preventDefault();
      setDraft(thread[thread.length - 1].q);
    }
  };

  const clear = () => {
    thread = [];
    setItems([]);
    input.current?.focus();
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[760px] flex-col px-4 pb-[calc(56px+env(safe-area-inset-bottom))] pt-6 sm:px-8 md:min-h-dvh md:pb-0 md:pt-10">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-5">
        <div className="min-w-0">
          <Label className="mb-2">From your connected data</Label>
          <h1 className="font-serif text-[34px] font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-[42px]">Ask Orbit</h1>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear conversation
          </Button>
        )}
      </header>

      <div className="flex-1">
        {items.length === 0 ? (
          <div className="py-8">
            <p className="max-w-[56ch] text-[15px] leading-relaxed text-muted">
              Ask in your own words. Orbit answers from the sample data in this app and lists the items it used, so you can check them. If it doesn't know, it
              says so.
            </p>
            <Label className="mt-8">Try asking</Label>
            <Suggestions items={suggestions} onPick={submit} className="mt-2" />
          </div>
        ) : (
          <ol ref={list} aria-label="Conversation" aria-live="polite">
            {items.map((ex, i) => (
              <ExchangeView key={ex.id} ex={ex} onPick={submit} last={i === items.length - 1} />
            ))}
          </ol>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-line bg-paper px-4 pb-3 pt-3 sm:-mx-8 sm:px-8 md:bottom-0 md:pb-5"
      >
        <label htmlFor="ask-input" className="sr-only">
          Ask Orbit a question
        </label>
        <div className="flex items-center gap-2">
          <input
            id="ask-input"
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about your day, money or plans"
            autoComplete="off"
            enterKeyHint="send"
            className="h-11 w-full min-w-0 rounded-[7px] border border-line bg-surface px-3 text-[15px] text-ink transition-colors placeholder:text-faint hover:border-line-strong focus:border-accent focus:outline-none"
          />
          <Button type="submit" variant="primary" className="h-11 max-sm:w-11 max-sm:px-0" disabled={!draft.trim()} aria-label="Ask">
            <span className="max-sm:hidden">Ask</span>
            <ArrowUp size={15} />
          </Button>
        </div>
        <p className="mt-2 hidden text-[11.5px] text-faint sm:block">Answers come from sample data kept in this browser. Nothing is sent anywhere.</p>
      </form>
    </div>
  );
}
