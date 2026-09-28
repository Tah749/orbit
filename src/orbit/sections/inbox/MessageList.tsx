import { Paperclip, Star } from "@phosphor-icons/react";
import { href } from "../../router";
import { cx, Source, Tag } from "../../ui";
import { stamp } from "../../time";
import type { Message } from "../../data/mail";
import { counterpart, isSnoozed, toggleStar } from "./mail";

export function MessageRow({ m, active, showWhy, showFolder }: { m: Message; active: boolean; showWhy: boolean; showFolder: boolean }) {
  const who = counterpart(m);
  const outgoing = m.folder === "sent" || m.folder === "drafts";
  const unread = !m.read && !outgoing;
  const folderTag = m.folder === "archive" ? "Archived" : m.folder === "sent" ? "Sent" : m.folder === "drafts" ? "Draft" : isSnoozed(m) ? "Snoozed" : null;
  return (
    <li className="relative">
      <a
        href={href(`inbox/${m.id}`)}
        data-msg={m.id}
        aria-current={active ? "true" : undefined}
        className={cx(
          "group block py-3 pl-5 pr-4 transition-colors focus-visible:outline-offset-[-2px]",
          active ? "bg-soft" : "hover:bg-soft/50",
        )}
      >
        {unread && <span aria-label="Unread" className="absolute left-2 top-[19px] size-[6px] rounded-full bg-accent" />}
        <div className="flex items-baseline gap-2">
          <p className={cx("min-w-0 truncate text-[14px]", unread ? "font-semibold text-ink" : "text-ink")}>
            {outgoing && <span className="text-muted">{m.folder === "drafts" ? "Draft to " : "To "}</span>}
            {who.name}
          </p>
          <Source id={m.source} className="shrink-0" />
          <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-[11.5px] tabular-nums text-faint">
            {m.attachments?.length ? <Paperclip size={13} aria-label="Has attachment" /> : null}
            {stamp(m.date)}
          </span>
        </div>
        <p className={cx("mt-0.5 truncate pr-7 text-[13.5px]", unread ? "font-medium text-ink" : "text-ink/90")}>{m.subject}</p>
        <p className="mt-0.5 line-clamp-1 pr-7 text-[13px] leading-snug text-muted">{m.snippet}</p>
        {(showWhy && m.why) || (showFolder && folderTag) ? (
          <div className="mt-1.5 flex items-center gap-2 pr-7">
            {showFolder && folderTag && <Tag>{folderTag}</Tag>}
            {showWhy && m.why && (
              <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
                <span aria-hidden className="size-[5px] shrink-0 rounded-full border border-accent" />
                <span className="truncate">{m.why}</span>
              </p>
            )}
          </div>
        ) : null}
      </a>
      <button
        type="button"
        aria-label={m.starred ? `Unstar ${m.subject}` : `Star ${m.subject}`}
        aria-pressed={m.starred}
        onClick={() => toggleStar(m)}
        className={cx(
          "absolute bottom-2 right-2 grid size-8 place-items-center rounded-[7px] transition-colors hover:bg-soft",
          m.starred ? "text-warn" : "text-faint/70 hover:text-muted",
        )}
      >
        <Star size={15} weight={m.starred ? "fill" : "regular"} />
      </button>
    </li>
  );
}
