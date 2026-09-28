import { useEffect, useState, type ReactNode } from "react";
import { AirplaneTilt, ArrowRight, ArrowUpRight, EnvelopeSimple, Storefront, TrendUp, X } from "@phosphor-icons/react";
import { db, useDB, type DB } from "../../store";
import { href } from "../../router";
import type { CalEvent } from "../../data/calendar";
import { cx, Amount, Check, Dot, Empty, IconButton, Label, money, Page, Section, Source, Tag, toast, type Tone } from "../../ui";
import { daysFrom, greeting, longDate, on, parse, relDay, shortDate, time } from "../../time";
import { briefing, comingUp, deliveryWindow, eventsOn, isActiveOrder, needsYou, visible, type Need, type Upcoming } from "./derive";

/** Re-render every minute so "now" stays true while the page is open. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/* Schedule ---------------------------------------------------------------------------------------- */

const calTone: Record<CalEvent["calendar"], Tone> = { work: "info", personal: "accent", family: "warn", travel: "coral" };

function minutesUntil(s: string, now: Date) {
  return Math.round((parse(s).getTime() - now.getTime()) / 60_000);
}

function EventRow({ e, now, next, first }: { e: CalEvent; now: Date; next: boolean; first: boolean }) {
  const past = parse(e.end) <= now;
  const live = parse(e.start) <= now && !past;
  const until = minutesUntil(e.start, now);
  const meta = [e.location, e.video && `${e.video} call`, e.attendees?.length && `with ${e.attendees.map((a) => a.split(" ")[0]).join(", ")}`].filter(Boolean).join(" · ");
  return (
    <li className={cx(!first && "border-t border-line")}>
      <a href={href(`calendar/${e.id}`)} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-x-3 px-1 py-3 transition-colors hover:bg-soft/60">
        <span className="pt-px font-mono text-[12.5px] leading-5 tabular-nums">
          <span className={past ? "text-faint" : "text-ink"}>{time(e.start)}</span>
          <span className="block text-[11px] text-faint">{time(e.end)}</span>
        </span>
        <span className="min-w-0">
          <span className={cx("flex items-center gap-2 text-[14px] leading-5", past ? "text-muted" : "text-ink")}>
            <Dot tone={past ? "neutral" : calTone[e.calendar]} />
            <span className="truncate">{e.title}</span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-4 text-[12.5px] text-muted">
            {meta && <span className="min-w-0 truncate">{meta}</span>}
            <Source id={e.source} />
          </span>
          {e.notes && !past && <span className="mt-1 block pl-4 text-[12.5px] text-muted">{e.notes}</span>}
        </span>
        <span className="pt-0.5 text-right">
          {live ? <Tag tone="accent">On now</Tag> : next && until > 0 && until <= 180 ? <span className="font-mono text-[11.5px] text-muted">in {until < 60 ? `${until} min` : `${Math.floor(until / 60)} h ${until % 60 ? `${until % 60} min` : ""}`.trim()}</span> : null}
        </span>
      </a>
    </li>
  );
}

function NowMarker({ now, first }: { now: Date; first: boolean }) {
  return (
    <li className={cx("flex items-center gap-3 px-1", first ? "pb-1" : "py-1")}>
      <span className="w-[52px] font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-accent">
        Now<span className="sr-only">, {time(now.toISOString())}</span>
      </span>
      <span aria-hidden className="h-px flex-1 bg-accent" />
      <span aria-hidden className="font-mono text-[11px] tabular-nums text-accent">
        {time(now.toISOString())}
      </span>
    </li>
  );
}

function Schedule({ v, now }: { v: DB; now: Date }) {
  const all = eventsOn(v, 0);
  const allDay = all.filter((e) => e.allDay);
  const timed = all.filter((e) => !e.allDay);
  const nextIdx = timed.findIndex((e) => parse(e.start) > now);
  const markerAt = nextIdx === -1 ? timed.length : nextIdx;
  const rows: ReactNode[] = [];
  timed.forEach((e, i) => {
    if (i === markerAt) rows.push(<NowMarker key="now" now={now} first={i === 0} />);
    rows.push(<EventRow key={e.id} e={e} now={now} next={i === nextIdx} first={i === 0 || i === markerAt} />);
  });
  if (markerAt === timed.length && timed.length) rows.push(<NowMarker key="now" now={now} first={false} />);

  return (
    <Section title="Today's schedule" meta={timed.length ? `${timed.length} ${timed.length === 1 ? "event" : "events"}` : undefined} action={<SeeAll to="calendar" label="Calendar" />}>
      {allDay.length > 0 && (
        <p className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          {allDay.map((e) => (
            <a key={e.id} href={href(`calendar/${e.id}`)} className="hover:text-ink">
              All day · {e.title}
            </a>
          ))}
        </p>
      )}
      {timed.length ? (
        <ol aria-label="Events today" className="border-y border-line">
          {rows}
        </ol>
      ) : (
        <div className="border-y border-line">
          <Empty title="A clear day">Nothing is in the diary today.</Empty>
        </div>
      )}
    </Section>
  );
}

function SeeAll({ to, label }: { to: string; label: string }) {
  return (
    <a href={href(to)} className="inline-flex shrink-0 items-center gap-1 text-[12.5px] text-muted hover:text-ink">
      {label}
      <ArrowRight size={12} />
    </a>
  );
}

/* Needs you --------------------------------------------------------------------------------------- */

/** Dismissed items last for the session, so they stay gone while you move around the app. */
const dismissed = new Set<string>();

const needIcon = { reply: EnvelopeSimple, checkin: AirplaneTilt, price: TrendUp, shop: Storefront } as const;

function completeTask(id: string, title: string) {
  db.patch("tasks", id, { done: true, doneAt: new Date().toISOString() });
  toast(`Done: ${title}`, { label: "Undo", run: () => db.patch("tasks", id, { done: false, doneAt: undefined }) });
}

function NeedRow({ n, onDismiss, first }: { n: Need; onDismiss: () => void; first: boolean }) {
  const Icon = n.kind === "task" ? null : needIcon[n.kind];
  return (
    <li className={cx("flex items-start gap-3 px-1 py-3", !first && "border-t border-line")}>
      <span className="grid size-5 shrink-0 place-items-center pt-0.5">
        {n.taskId ? (
          <Check checked={false} label={`Mark "${n.kind === "checkin" ? "Check in" : n.title}" done`} onChange={() => completeTask(n.taskId!, n.title)} />
        ) : Icon ? (
          <Icon size={17} className="text-faint" />
        ) : null}
      </span>
      <a href={href(n.href)} className="group min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[14px] leading-5 text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{n.title}</span>
          {n.due && (
            <span className={cx("shrink-0 font-mono text-[11px] tabular-nums", n.due === "Overdue" || n.due.endsWith("late") ? "text-coral" : "text-faint")}>{n.due}</span>
          )}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted">{n.reason}</span>
        <Source id={n.source} className="mt-1.5" />
      </a>
      {n.kind !== "task" && (
        <IconButton label={n.kind === "reply" ? "Doesn't need a reply" : "Dismiss"} className="-mr-1 -mt-1 size-8" onClick={onDismiss}>
          <X size={15} />
        </IconButton>
      )}
    </li>
  );
}

function NeedsYou({ v, now, withShop }: { v: DB; now: Date; withShop: boolean }) {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(dismissed));
  const items = needsYou(v, now, withShop).filter((n) => !hidden.has(n.key));
  const shown = items.slice(0, 7);

  const dismiss = (n: Need) => {
    if (n.messageId) {
      const id = n.messageId;
      db.patch("messages", id, { needsReply: false });
      toast("Marked as not needing a reply", { label: "Undo", run: () => db.patch("messages", id, { needsReply: true }) });
      return;
    }
    const hide = (on: boolean) => {
      if (on) dismissed.add(n.key);
      else dismissed.delete(n.key);
      setHidden(new Set(dismissed));
    };
    hide(true);
    toast("Dismissed", { label: "Undo", run: () => hide(false) });
  };

  return (
    <Section title="Needs you" meta={items.length ? `${items.length} ${items.length === 1 ? "thing" : "things"}` : undefined}>
      {shown.length ? (
        <ul className="border-y border-line">
          {shown.map((n, i) => (
            <NeedRow key={n.key} n={n} first={i === 0} onDismiss={() => dismiss(n)} />
          ))}
        </ul>
      ) : (
        <div className="border-y border-line">
          <Empty title="Nothing needs you">Replies, overdue tasks and anything time-sensitive will show up here.</Empty>
        </div>
      )}
      {items.length > shown.length && (
        <p className="mt-2 text-[12.5px] text-muted">
          And {items.length - shown.length} more in <a className="underline decoration-line-strong underline-offset-4 hover:text-ink" href={href("inbox")}>Inbox</a> and{" "}
          <a className="underline decoration-line-strong underline-offset-4 hover:text-ink" href={href("tasks")}>
            Tasks
          </a>
          .
        </p>
      )}
    </Section>
  );
}

/* Coming up --------------------------------------------------------------------------------------- */

const weekday = (s: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(parse(s));

const kindLabel: Record<Upcoming["kind"], string> = { bill: "Bill", booking: "Booking", birthday: "Birthday", renewal: "Renewal", delivery: "Delivery" };

function ComingUp({ v }: { v: DB }) {
  const items = comingUp(v, 1, 10);
  const days = new Map<string, Upcoming[]>();
  for (const it of items) {
    const k = on(daysFrom(it.date));
    days.set(k, [...(days.get(k) ?? []), it]);
  }
  return (
    <Section title="Coming up" meta="Next 10 days">
      {items.length ? (
        <div className="border-y border-line">
          {[...days].map(([day, list], i) => (
            <div key={day} className={cx("grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[112px_minmax(0,1fr)]", i > 0 && "border-t border-line")}>
              <h3 className="px-1 pt-1.5">
                <span className="block text-[13.5px] font-medium text-ink">{daysFrom(day) < 2 ? relDay(day) : weekday(day)}</span>
                <span className="font-mono text-[11px] text-faint">{shortDate(day)}</span>
              </h3>
              <ul>
                {list.map((it) => (
                  <li key={it.key}>
                    <a href={href(it.href)} className="flex items-start gap-3 rounded-[6px] px-1 py-1.5 transition-colors hover:bg-soft/60">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] leading-5 text-ink">
                          <span className="sr-only">{kindLabel[it.kind]}: </span>
                          {it.title}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
                          {it.meta && <span className="min-w-0">{it.meta}</span>}
                          <Source id={it.source} />
                        </span>
                      </span>
                      {it.amount != null && <Amount value={it.amount} className="pt-px text-[13.5px] text-ink" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-y border-line">
          <Empty title="A quiet stretch">No bills, bookings, birthdays or renewals in the next 10 days.</Empty>
        </div>
      )}
    </Section>
  );
}

/* Glances ---------------------------------------------------------------------------------------- */

function Glance({ title, to, children }: { title: string; to: string; children: ReactNode }) {
  return (
    <section className="min-w-0 border-t border-line py-4 first:border-t-0 first:pt-0 max-lg:sm:[&:nth-child(2)]:border-t-0 max-lg:sm:[&:nth-child(2)]:pt-0">
      <a href={href(to)} className="group mb-2 flex items-center justify-between gap-2">
        <Label className="group-hover:text-ink">{title}</Label>
        <ArrowUpRight size={13} className="text-faint group-hover:text-ink" aria-hidden />
      </a>
      {children}
    </section>
  );
}

const spend = (v: DB, fromDay: number, toDay: number) =>
  -v.txns
    .filter((t) => t.amount < 0 && t.category !== "transfers" && t.category !== "business" && daysFrom(t.date) >= fromDay && daysFrom(t.date) <= toDay)
    .reduce((s, t) => s + t.amount, 0);

const hm = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;

function Glances({ v, withShop }: { v: DB; withShop: boolean }) {
  const current = v.accounts.filter((a) => a.type === "current");
  const thisWeek = spend(v, -6, 0);
  const lastWeek = spend(v, -13, -7);
  const diff = thisWeek - lastWeek;

  const arriving = v.orders.filter((o) => isActiveOrder(o) && o.eta && daysFrom(o.eta) === 0);
  const nextParcel = v.orders.filter((o) => isActiveOrder(o) && o.eta && daysFrom(o.eta) > 0).sort((a, b) => a.eta!.localeCompare(b.eta!))[0];

  const yRev = v.revenue.find((r) => r.date === on(-1));
  const weekRev = v.revenue.filter((r) => daysFrom(r.date) >= -6).reduce((s, r) => s + r.revenue, 0);
  const weekOrders = v.revenue.filter((r) => daysFrom(r.date) >= -6).reduce((s, r) => s + r.orders, 0);
  const toSend = v.shopOrders.filter((o) => o.status === "unfulfilled").length;

  const yDay = v.daily.find((x) => x.date === on(-1));
  const night = v.daily.find((x) => x.date === on(0));
  const avgSleep = v.daily.length ? Math.round(v.daily.reduce((s, x) => s + x.sleepMin, 0) / v.daily.length) : 0;

  const small = "text-[12.5px] leading-snug text-muted";

  return (
    <aside aria-label="At a glance" className="grid content-start sm:max-lg:grid-cols-2 sm:max-lg:gap-x-8">
      {current.length > 0 && (
        <Glance title="Money" to="money">
          <p className="text-[24px] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">{money(current.reduce((s, a) => s + a.balance, 0))}</p>
          <p className={cx(small, "mt-1.5")}>In {current.length === 1 ? current[0].name : "current accounts"}</p>
          <p className={cx(small, "mt-2")}>
            Spent <span className="text-ink tabular-nums">{money(thisWeek, true)}</span> in the last 7 days,{" "}
            {Math.abs(diff) < 1 ? "about the same as the week before" : `${money(Math.abs(diff), true)} ${diff < 0 ? "less" : "more"} than the week before`}.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3">
            {[...new Set(current.map((a) => a.institution))].map((s) => (
              <Source key={s} id={s} />
            ))}
          </div>
        </Glance>
      )}

      <Glance title="Deliveries" to="deliveries">
        {arriving.length ? (
          <ul className="flex flex-col gap-2">
            {arriving.map((o) => (
              <li key={o.id}>
                <a href={href(`deliveries/${o.id}`)} className="block hover:text-ink">
                  <span className="block text-[14px] text-ink">{o.retailer}</span>
                  <span className={small}>
                    {o.status === "out-for-delivery" ? "Out for delivery" : "Due today"}, {deliveryWindow(o)}
                  </span>
                </a>
                <Source id={o.source} className="mt-1" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-ink">Nothing arriving today</p>
        )}
        {nextParcel && (
          <p className={cx(small, "mt-2")}>
            Next: {nextParcel.retailer}, {relDay(nextParcel.eta!).toLowerCase()}
          </p>
        )}
      </Glance>

      {withShop && v.revenue.length > 0 && (
        <Glance title="Fern & Thread" to="business">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[18px] font-medium leading-none text-ink tabular-nums">{money(yRev?.revenue ?? 0, true)}</p>
              <p className={cx(small, "mt-1")}>Yesterday, {yRev?.orders ?? 0} orders</p>
            </div>
            <div>
              <p className="text-[18px] font-medium leading-none text-ink tabular-nums">{money(weekRev, true)}</p>
              <p className={cx(small, "mt-1")}>Last 7 days, {weekOrders} orders</p>
            </div>
          </div>
          {toSend > 0 && <p className={cx(small, "mt-2")}>{toSend} {toSend === 1 ? "order" : "orders"} waiting to be sent</p>}
          <div className="mt-2 flex gap-3">
            <Source id="shopify" />
            <Source id="etsy" />
          </div>
        </Glance>
      )}

      {(yDay || night) && (
        <Glance title="Health" to="health">
          <div className="grid grid-cols-2 gap-3">
            {yDay && (
              <div>
                <p className="text-[18px] font-medium leading-none text-ink tabular-nums">{yDay.steps.toLocaleString("en-GB")}</p>
                <p className={cx(small, "mt-1")}>Steps yesterday</p>
              </div>
            )}
            {night && (
              <div>
                <p className="text-[18px] font-medium leading-none text-ink tabular-nums">{hm(night.sleepMin)}</p>
                <p className={cx(small, "mt-1")}>Sleep last night</p>
              </div>
            )}
          </div>
          {night && avgSleep > 0 && (
            <p className={cx(small, "mt-2")}>
              {Math.abs(night.sleepMin - avgSleep) < 10 ? "About your usual" : `${hm(Math.abs(night.sleepMin - avgSleep)).replace(/^0h /, "")} ${night.sleepMin > avgSleep ? "more" : "less"} than your two-week average`}.
            </p>
          )}
          <Source id="apple-health" className="mt-2" />
        </Glance>
      )}
    </aside>
  );
}

/* Page ------------------------------------------------------------------------------------------- */

export default function TodayPage() {
  const v = useDB(visible);
  const settings = useDB((d) => d.settings);
  const now = useNow();
  const lines = briefing(v, now);
  const name = settings.name.trim();

  return (
    <Page eyebrow={longDate(on(0))} title={`${greeting(now)}${name ? `, ${name}` : ""}.`}>
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_236px]">
        <div className="flex min-w-0 flex-col gap-10">
          {lines.length > 0 && (
            <div className="max-w-[64ch]">
              <p className="font-serif text-[19px] leading-[1.5] tracking-[-0.005em] text-ink md:text-[21px]">{lines.join(" ")}</p>
              <p className="mt-3 text-[12px] text-faint">Written from your connected sample data at {time(now.toISOString())}.</p>
            </div>
          )}
          <Schedule v={v} now={now} />
          <NeedsYou v={v} now={now} withShop={settings.showBusinessInToday} />
          <ComingUp v={v} />
        </div>
        <div className="min-w-0 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-1">
          <Glances v={v} withShop={settings.showBusinessInToday} />
        </div>
      </div>
    </Page>
  );
}
