import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { MagnifyingGlass, PencilSimpleLine, X } from "@phosphor-icons/react";
import { db, useDB } from "../../store";
import { go, href, useRoute } from "../../router";
import { Button, cx, Empty, Kbd, Label, Tabs } from "../../ui";
import type { Message } from "../../data/mail";
import { MessageRow } from "./MessageList";
import { Reader } from "./Reader";
import { Compose } from "./Compose";
import { archive, bodyText, byDate, isSnoozed, matches, toggleStar, toText, viewByKey, viewCount, views, type Draft, type ViewKey } from "./mail";

function useMedia(query: string) {
  return useSyncExternalStore(
    (l) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", l);
      return () => mq.removeEventListener("change", l);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The view that best shows a message opened from a link. */
function viewFor(id: string | undefined): ViewKey {
  const m = id ? db.find("messages", id) : undefined;
  if (!m) return "priority";
  if (m.folder === "sent" || m.folder === "drafts" || m.folder === "archive") return m.folder;
  if (isSnoozed(m)) return "snoozed";
  return viewByKey("priority").test(m) ? "priority" : "all";
}

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

const groups: { key: (typeof views)[number]["group"]; label?: string }[] = [
  { key: "orbit" },
  { key: "mail" },
  { key: "category", label: "Categories" },
  { key: "folder", label: "Folders" },
];

function Rail({ view, setView, all, onCompose }: { view: ViewKey; setView: (v: ViewKey) => void; all: Message[]; onCompose: () => void }) {
  const unread = all.filter((m) => m.folder === "inbox" && !m.read && !isSnoozed(m)).length;
  return (
    <nav aria-label="Mail views" className="flex h-full flex-col px-3 pb-4 pt-7">
      <div className="px-2">
        <h1 className="font-serif text-[30px] font-normal leading-none tracking-[-0.02em] text-ink">Inbox</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted tabular-nums">{unread ? `${unread} unread` : "All read"}</p>
      </div>
      <Button variant="primary" onClick={onCompose} className="mx-2 mt-5">
        <PencilSimpleLine size={16} />
        Compose
      </Button>
      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.key} className="flex flex-col gap-0.5">
            {g.label && <p className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{g.label}</p>}
            {views
              .filter((v) => v.group === g.key)
              .map((v) => {
                const n = viewCount(v, all);
                const on = v.key === view;
                return (
                  <button
                    key={v.key}
                    type="button"
                    aria-current={on ? "true" : undefined}
                    onClick={() => setView(v.key)}
                    className={cx(
                      "flex h-8 items-center gap-2 rounded-[7px] px-2 text-left text-[13.5px] transition-colors",
                      on ? "bg-soft font-medium text-ink" : "text-muted hover:bg-soft/60 hover:text-ink",
                    )}
                  >
                    <span className="flex-1 truncate">{v.label}</span>
                    {n > 0 && <span className={cx("font-mono text-[11px] tabular-nums", on ? "text-ink" : "text-faint")}>{n}</span>}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
      <dl className="mx-2 mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-t border-line pt-4 text-[12px] text-faint">
        {(
          [
            ["j k", "Next, previous"],
            ["e", "Archive"],
            ["r", "Reply"],
            ["s", "Star"],
            ["/", "Search"],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="flex gap-1">
              {k.split(" ").map((x) => (
                <Kbd key={x}>{x}</Kbd>
              ))}
            </dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </nav>
  );
}

function SearchBox({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <div className="relative">
      <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
      <input
        id="mail-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setQ("");
            e.currentTarget.blur();
          }
        }}
        placeholder="Search mail"
        aria-label="Search mail by sender, subject or text"
        className="h-9 w-full rounded-[7px] border border-line bg-surface pl-9 pr-9 text-[14px] text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {q ? (
        <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[6px] text-faint hover:text-ink">
          <X size={14} />
        </button>
      ) : (
        <span className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 lg:block">
          <Kbd>/</Kbd>
        </span>
      )}
    </div>
  );
}

function ListBody({ list, openId, q, view }: { list: Message[]; openId?: string; q: string; view: ViewKey }) {
  const v = viewByKey(view);
  if (!list.length) {
    return q.trim() ? (
      <Empty title="No mail matches that">Nothing from a sender, subject or message contains “{q.trim()}”.</Empty>
    ) : (
      <Empty title={v.empty[0]}>{v.empty[1]}</Empty>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {list.map((m) => (
        <MessageRow key={m.id} m={m} active={m.id === openId} showWhy={!q && m.folder === "inbox"} showFolder={!!q.trim() || view === "all"} />
      ))}
    </ul>
  );
}

/** Desktop reading pane with nothing open: what's waiting, and how to move around. */
function Idle({ all }: { all: Message[] }) {
  const waiting = all.filter((m) => m.folder === "inbox" && m.needsReply && !isSnoozed(m)).sort(byDate);
  return (
    <div className="mx-auto max-w-[620px] px-8 pt-16">
      <p className="font-serif text-[24px] italic leading-snug text-ink">{waiting.length ? "Nothing open." : "Nothing open, and no one is waiting on you."}</p>
      <p className="mt-2 text-[14px] text-muted">Choose a message, or press j to start at the top.</p>
      {waiting.length > 0 && (
        <div className="mt-10">
          <Label className="mb-2">Waiting on a reply from you</Label>
          <ul className="divide-y divide-line border-y border-line">
            {waiting.map((m) => (
              <li key={m.id}>
                <a href={href(`inbox/${m.id}`)} className="flex min-h-12 items-center gap-4 py-2.5 transition-colors hover:bg-soft/50">
                  <span className="w-32 shrink-0 truncate text-[13.5px] font-medium text-ink">{m.from.name}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-muted">{m.why ?? m.subject}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  const { rest } = useRoute();
  const openId = rest[0];
  const all = useDB((d) => d.messages);
  const wide = useMedia("(min-width: 1024px)");
  const [view, setViewState] = useState<ViewKey>(() => viewFor(openId));
  const [q, setQ] = useState("");
  const [replying, setReplying] = useState(false);
  const [compose, setCompose] = useState<{ open: boolean; draft?: Draft }>({ open: false });
  const [, setTick] = useState(0);

  // Snoozed mail comes back on its own: re-check once a minute.
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const list = (q.trim() ? all.filter((m) => matches(m, q)) : all.filter(viewByKey(view).test)).sort(byDate);

  const current = openId ? all.find((m) => m.id === openId) : undefined;
  const index = current ? list.findIndex((m) => m.id === current.id) : -1;

  const setView = (v: ViewKey) => {
    setViewState(v);
    setQ("");
    if (!wide && openId) go("inbox");
  };

  // Mark read when opened.
  useEffect(() => {
    setReplying(false);
    if (!openId) return;
    const m = db.find("messages", openId);
    if (m && !m.read) db.patch("messages", openId, { read: true });
    document.querySelector(`[data-msg="${CSS.escape(openId)}"]`)?.scrollIntoView({ block: "nearest" });
  }, [openId]);

  // When the open message leaves the list (archived, snoozed, answered, deleted), move to its neighbour.
  const prev = useRef<{ ids: string[]; key: string }>({ ids: [], key: "" });
  useEffect(() => {
    const key = `${view}|${q}`;
    const ids = list.map((m) => m.id);
    const was = prev.current;
    prev.current = { ids, key };
    if (!openId || was.key !== key) return;
    const i = was.ids.indexOf(openId);
    if (i === -1 || ids.includes(openId)) return;
    if (!wide) return go("inbox");
    const next = ids[Math.min(i, ids.length - 1)];
    go(next ? `inbox/${next}` : "inbox");
  }, [list, openId, view, q, wide]);

  // Phones: keep the list's scroll position while a message is open.
  const listScroll = useRef(0);
  useEffect(() => {
    if (wide) return;
    if (openId) window.scrollTo(0, 0);
    else window.scrollTo(0, listScroll.current);
  }, [openId, wide]);
  useEffect(() => {
    if (wide || openId) return;
    const onScroll = () => (listScroll.current = window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [wide, openId]);

  const step = (d: 1 | -1) => {
    if (!list.length) return;
    const i = index === -1 ? (d === 1 ? 0 : list.length - 1) : Math.min(list.length - 1, Math.max(0, index + d));
    go(`inbox/${list[i].id}`);
  };

  const editDraft = (m: Message) => setCompose({ open: true, draft: { id: m.id, to: toText(m.to), subject: m.subject === "(No subject)" ? "" : m.subject, body: bodyText(m) } });

  // Keyboard: j/k, e, r, s, u, c, / and Escape. Ignored while typing or when a dialog is open.
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  keys.current = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector("dialog[open]")) return;
    const m = current;
    const outgoing = m && (m.folder === "sent" || m.folder === "drafts");
    switch (e.key) {
      case "j":
        step(1);
        break;
      case "k":
        step(-1);
        break;
      case "e":
        if (m && m.folder === "inbox" && !isSnoozed(m)) archive(m);
        break;
      case "r":
        if (m && !outgoing) setReplying(true);
        else if (m?.folder === "drafts") editDraft(m);
        break;
      case "s":
        if (m) toggleStar(m);
        break;
      case "u":
        if (m && !outgoing) db.patch("messages", m.id, { read: !m.read });
        break;
      case "c":
        setCompose({ open: true });
        break;
      case "/":
        document.getElementById("mail-search")?.focus();
        break;
      case "Escape":
        if (m) go("inbox");
        else if (q) setQ("");
        else return;
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const reader = current && (
    <Reader
      key={current.id}
      m={current}
      onBack={wide ? undefined : () => go("inbox")}
      onPrev={index > 0 ? () => step(-1) : undefined}
      onNext={index !== -1 && index < list.length - 1 ? () => step(1) : undefined}
      replying={replying}
      setReplying={setReplying}
      onEditDraft={() => editDraft(current)}
    />
  );

  const v = viewByKey(view);
  const heading = q.trim() ? "Search results" : v.label;
  const meta = q.trim() ? `${list.length} in all mail` : `${list.length} ${list.length === 1 ? "message" : "messages"}`;
  const sheet = <Compose open={compose.open} draft={compose.draft} onClose={() => setCompose({ open: false })} />;

  if (wide) {
    return (
      <div className="flex h-dvh min-w-0">
        <div className="w-[208px] shrink-0 border-r border-line">
          <Rail view={view} setView={setView} all={all} onCompose={() => setCompose({ open: true })} />
        </div>
        <section aria-label={heading} className="flex w-[360px] shrink-0 flex-col border-r border-line xl:w-[400px]">
          <div className="border-b border-line px-4 pb-3 pt-6">
            <SearchBox q={q} setQ={setQ} />
            <div className="mt-4 flex items-baseline justify-between gap-3 px-1">
              <h2 className="text-[13.5px] font-semibold text-ink">{heading}</h2>
              <span className="font-mono text-[11px] text-faint tabular-nums">{meta}</span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ListBody list={list} openId={openId} q={q} view={view} />
          </div>
        </section>
        <div className="min-w-0 flex-1 overflow-y-auto">
          {reader ?? (openId ? <Empty title="That message isn't here">It may have been deleted.</Empty> : <Idle all={all} />)}
        </div>
        {sheet}
      </div>
    );
  }

  if (openId) {
    return (
      <>
        {reader ?? (
          <div className="px-4 pt-10">
            <Empty title="That message isn't here" action={<Button onClick={() => go("inbox")}>Back to inbox</Button>}>
              It may have been deleted.
            </Empty>
          </div>
        )}
        {sheet}
      </>
    );
  }

  const unread = all.filter((m) => m.folder === "inbox" && !m.read && !isSnoozed(m)).length;
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pb-24 pt-6 sm:px-8 md:pt-10">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-[34px] font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-[42px]">Inbox</h1>
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted tabular-nums">{unread ? `${unread} unread` : "All read"}</p>
        </div>
        <Button variant="primary" onClick={() => setCompose({ open: true })} className="h-10">
          <PencilSimpleLine size={16} />
          Compose
        </Button>
      </header>
      <div className="mt-5">
        <SearchBox q={q} setQ={setQ} />
      </div>
      {!q.trim() && (
        <Tabs<ViewKey>
          label="Mail views"
          value={view}
          onChange={setView}
          className="mt-4"
          items={views.map((x) => {
            const n = viewCount(x, all);
            return [
              x.key,
              <span key={x.key} className="inline-flex items-baseline gap-1.5">
                {x.label}
                {n > 0 && <span className="font-mono text-[11px] tabular-nums text-faint">{n}</span>}
              </span>,
            ] as [ViewKey, ReactNode];
          })}
        />
      )}
      <div className={cx("-mx-4 sm:mx-0", q.trim() ? "mt-4 border-t border-line" : "")}>
        {q.trim() && <p className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-faint sm:px-1">{meta}</p>}
        <ListBody list={list} q={q} view={view} />
      </div>
      {sheet}
    </div>
  );
}
