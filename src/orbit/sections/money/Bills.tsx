import type { ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { db, newId, useDB } from "../../store";
import type { Bill } from "../../data/money";
import { go, href } from "../../router";
import { Amount, Button, cx, Empty, Facts, Figure, Label, List, money, Row, Sheet, Source, Tag, toast } from "../../ui";
import { daysFrom, longDate, relDay, shortDate, stamp } from "../../time";
import { canCompare, nextDue, perMonth, recurrenceName, remindBy, tasksFor } from "./lib";
import { accountOf } from "./shared";

function dueText(b: Bill) {
  if (b.status === "paid") return "Paid";
  const d = daysFrom(b.due);
  if (d < 0) return "Overdue";
  if (d < 7) return relDay(b.due);
  return shortDate(b.due);
}

function BillRow({ b }: { b: Bill }) {
  const accounts = useDB((d) => d.accounts);
  const acc = accountOf(accounts, b.accountId);
  const d = daysFrom(b.due);
  const rise = b.previous && b.amount > b.previous;
  return (
    <Row href={href(`money/bills/${b.id}`)} className="min-h-[52px] py-2.5">
      <span
        className={cx(
          "w-[4.75rem] shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] tabular-nums",
          b.status === "paid" ? "text-faint" : d < 0 ? "text-coral" : d <= 3 ? "text-ink" : "text-muted",
        )}
      >
        {dueText(b)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[14px] text-ink">
          <span className="truncate">{b.name}</span>
          {rise && <Tag tone="warn">Up {money(b.amount - b.previous!)}</Tag>}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {recurrenceName[b.recurrence]} · {b.autopay ? "Autopay" : "Pay by hand"}
          <span className="max-sm:hidden"> · {acc?.name}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Amount value={b.amount} className={cx("text-[14px]", b.status === "paid" ? "text-muted" : "text-ink")} />
        <Source id={b.source} />
      </div>
    </Row>
  );
}

function BillSheet({ id }: { id?: string }) {
  const b = useDB((d) => (id ? d.bills.find((x) => x.id === id) : undefined));
  const accounts = useDB((d) => d.accounts);
  const tasks = useDB((d) => d.tasks);
  const close = () => go("money/bills");
  const acc = b && accountOf(accounts, b.accountId);
  const linked = b ? tasksFor(b, tasks) : [];

  const markPaid = (b: Bill) => {
    const before = { due: b.due, status: b.status, lastPaid: b.lastPaid };
    const once = b.recurrence === "once";
    const due = once ? b.due : nextDue(b);
    db.patch("bills", b.id, once ? { status: "paid", lastPaid: new Date().toISOString() } : { due, status: "upcoming", lastPaid: new Date().toISOString() });
    toast(once ? `${b.name} marked as paid` : `${b.name} paid. Next due ${shortDate(due)}`, { label: "Undo", run: () => db.patch("bills", b.id, before) });
  };

  const addTask = (b: Bill, title: string, notes: string) => {
    const tid = newId("tk");
    db.insert("tasks", {
      id: tid,
      title,
      notes,
      due: remindBy(b.due),
      done: false,
      list: acc?.type === "business" ? "shop" : "personal",
      from: { kind: "bill", id: b.id },
      source: "manual",
      createdAt: new Date().toISOString(),
    });
    toast("Added to your tasks", { label: "Undo", run: () => db.remove("tasks", tid) });
  };

  return (
    <Sheet
      open={!!id}
      onClose={close}
      title={b?.name ?? "Bill"}
      footer={
        b && b.status !== "paid" ? (
          <Button variant="primary" onClick={() => markPaid(b)}>
            Mark as paid
          </Button>
        ) : undefined
      }
    >
      {b ? (
        <div className="flex flex-col gap-7">
          <div>
            <p className="font-serif text-[40px] leading-none tracking-[-0.02em]">
              <Amount value={b.amount} />
            </p>
            <p className="mt-2 text-[13.5px] text-muted">
              {b.status === "paid" ? (
                "Paid"
              ) : (
                <>
                  Due {longDate(b.due)}, {daysFrom(b.due) < 0 ? <span className="text-coral">overdue</span> : relDay(b.due).toLowerCase() === "today" ? "today" : `in ${daysFrom(b.due)} ${daysFrom(b.due) === 1 ? "day" : "days"}`}
                </>
              )}
            </p>
          </div>

          {b.previous && b.previous !== b.amount && (
            <p className="border-l-2 border-warn pl-3 text-[14px] leading-relaxed text-ink">
              {b.amount > b.previous ? "Up" : "Down"} {money(Math.abs(b.amount - b.previous))} from {money(b.previous)}
              {b.recurrence === "yearly" ? " last year" : " last time"}.
            </p>
          )}

          <Facts
            items={[
              ["Payee", b.payee],
              ["Amount", <Amount key="a" value={b.amount} />],
              ...(b.previous ? ([["Previous", <Amount key="p" value={b.previous} className="text-muted" />]] as [string, ReactNode][]) : []),
              ["Repeats", recurrenceName[b.recurrence]],
              ["Pays from", acc ? `${acc.name} ··${acc.mask}` : "Unknown"],
              ["Payment", b.autopay ? "Autopay" : "You pay it by hand"],
              ...(b.kind === "subscription" ? ([["Per year", <Amount key="y" value={perMonth(b) * 12} />]] as [string, ReactNode][]) : []),
              ...(b.lastPaid ? ([["Last marked paid", stamp(b.lastPaid)]] as [string, ReactNode][]) : []),
              ["Source", <Source key="s" id={b.source} />],
            ]}
          />

          <div>
            <Label className="mb-2">Follow up</Label>
            {linked.length > 0 && (
              <ul className="mb-3 divide-y divide-line border-y border-line">
                {linked.map((t) => (
                  <li key={t.id}>
                    <a href={href(`tasks/${t.id}`)} className="flex items-center gap-3 px-1 py-2.5 text-[13.5px] hover:bg-soft/60">
                      <span className="min-w-0 flex-1 truncate text-ink">{t.title}</span>
                      {t.due && <span className="text-[12.5px] text-muted">{relDay(t.due)}</span>}
                      <ArrowUpRight size={14} className="text-faint" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              {b.kind === "subscription" && !linked.some((t) => /cancel/i.test(t.title)) && (
                <Button onClick={() => addTask(b, `Cancel ${b.name}`, `${money(b.amount)} ${recurrenceName[b.recurrence].toLowerCase()}, next due ${longDate(b.due)}.`)}>
                  Remind me to cancel
                </Button>
              )}
              {canCompare(b) && !linked.some((t) => /compare/i.test(t.title)) && (
                <Button
                  onClick={() =>
                    addTask(
                      b,
                      `Compare ${b.name.toLowerCase()} prices`,
                      `Currently ${money(b.amount)}${b.previous && b.amount > b.previous ? `, up from ${money(b.previous)}` : ""}. Due ${longDate(b.due)}.`,
                    )
                  }
                >
                  Remind me to compare prices
                </Button>
              )}
              {b.kind !== "subscription" && !canCompare(b) && linked.length === 0 && <p className="text-[13px] text-muted">Nothing to follow up.</p>}
            </div>
          </div>
        </div>
      ) : (
        <Empty title="Not found">This bill isn't in your sample data any more.</Empty>
      )}
    </Sheet>
  );
}

export default function Bills({ openId }: { openId?: string }) {
  const bills = useDB((d) => d.bills);
  const sorted = [...bills].sort((a, b) => (a.status === "paid" ? 1 : 0) - (b.status === "paid" ? 1 : 0) || a.due.localeCompare(b.due));
  const regular = sorted.filter((b) => b.kind === "bill");
  const subs = sorted.filter((b) => b.kind === "subscription");
  const live = bills.filter((b) => b.status !== "paid");
  const monthly = live.reduce((s, b) => s + perMonth(b), 0);
  const subsMonthly = live.filter((b) => b.kind === "subscription").reduce((s, b) => s + perMonth(b), 0);
  const next30 = live.filter((b) => daysFrom(b.due) <= 30).reduce((s, b) => s + b.amount, 0);

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-y-6 border-b border-line pb-6 md:grid-cols-3">
        <Figure label="Due in the next 30 days" value={money(next30)} note="Bills and subscriptions" className="pr-4" />
        <Figure label="A typical month" value={money(monthly)} note="Yearly bills spread over 12" className="border-l border-line pl-4 md:pl-5" />
        <Figure
          label="Subscriptions"
          value={
            <>
              {money(subsMonthly)}
              <span className="text-[15px] text-muted"> a month</span>
            </>
          }
          note={`${money(subsMonthly * 12)} a year`}
          className="md:border-l md:border-line md:pl-5"
        />
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[13.5px] font-semibold text-ink">Bills</h2>
          <span className="text-[12.5px] tabular-nums text-muted">{regular.length} regular payments</span>
        </div>
        {regular.length ? (
          <List>
            {regular.map((b) => (
              <BillRow key={b.id} b={b} />
            ))}
          </List>
        ) : (
          <Empty title="No bills" />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[13.5px] font-semibold text-ink">Subscriptions</h2>
          <span className="text-[12.5px] tabular-nums text-muted">{money(subsMonthly * 12)} a year</span>
        </div>
        {subs.length ? (
          <List>
            {subs.map((b) => (
              <BillRow key={b.id} b={b} />
            ))}
          </List>
        ) : (
          <Empty title="No subscriptions" />
        )}
      </section>

      <BillSheet id={openId} />
    </div>
  );
}
