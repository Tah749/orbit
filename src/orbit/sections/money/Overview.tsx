import { ArrowRight } from "@phosphor-icons/react";
import { useDB } from "../../store";
import { categoryName, type Account, type Category } from "../../data/money";
import { href } from "../../router";
import { Amount, cx, Label, List, Meter, money, Row, Section, Source, Tag } from "../../ui";
import { daysFrom, relDay, shortDate, stamp } from "../../time";
import { byCategory, cumulative, inRange, isSpend, monthWindows, notices, ordinal } from "./lib";
import { TxnRow } from "./shared";

function Balances({ accounts }: { accounts: Account[] }) {
  const sum = (type: Account["type"]) => accounts.filter((a) => a.type === type).reduce((s, a) => s + a.balance, 0);
  const of = (type: Account["type"]) => accounts.filter((a) => a.type === type);
  const latest = (list: Account[]) => list.reduce((a, x) => (x.updatedAt > a ? x.updatedAt : a), "");
  const cols: { label: string; value: number; list: Account[] }[] = [
    { label: "Current accounts", value: sum("current"), list: of("current") },
    { label: "Savings", value: sum("savings"), list: of("savings") },
    { label: "Credit card owed", value: -sum("credit"), list: of("credit") },
  ];
  const biz = of("business");
  return (
    <div className="grid grid-cols-2 gap-y-6 border-b border-line pb-6 md:grid-cols-[1fr_1fr_1fr_1.1fr]">
      {cols.map((c, i) => (
        <div key={c.label} className={cx("min-w-0 pr-4", i > 0 && "md:border-l md:border-line md:pl-5", i === 1 && "max-md:border-l max-md:border-line max-md:pl-4")}>
          <Label>{c.label}</Label>
          <p className="mt-1.5 text-[26px] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">{money(c.value)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
            {c.list.map((a) => (
              <Source key={a.id} id={a.institution} />
            ))}
            {c.list.length > 0 && <span className="tabular-nums">{stamp(latest(c.list))}</span>}
          </div>
        </div>
      ))}
      <div className="min-w-0 max-md:border-l max-md:border-line max-md:pl-4 md:border-l md:border-dashed md:border-line-strong md:pl-5">
        <Label>Business, kept apart</Label>
        <p className="mt-1.5 text-[26px] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">{money(biz.reduce((s, a) => s + a.balance, 0))}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
          {biz.map((a) => (
            <Source key={a.id} id={a.institution} />
          ))}
          {biz.length > 0 && <span className="tabular-nums">{stamp(latest(biz))}</span>}
        </div>
      </div>
    </div>
  );
}

/** Running spend through this month, drawn over last month's for comparison. */
function MonthChart({ now, last, days }: { now: number[]; last: number[]; days: number }) {
  const w = 600;
  const h = 132;
  const max = Math.max(...now, ...last, 1);
  const x = (i: number) => (i / (days - 1)) * w;
  const y = (v: number) => h - 4 - (v / max) * (h - 12);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const endX = x(now.length - 1);
  const endY = y(now[now.length - 1] ?? 0);
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full overflow-visible" aria-hidden>
        <line x1={0} x2={w} y1={h - 4} y2={h - 4} className="stroke-line" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <path d={path(last)} fill="none" className="stroke-line-strong" strokeWidth={1.5} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <path d={path(now)} fill="none" className="stroke-accent" strokeWidth={1.75} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={endX} cy={endY} r={3} className="fill-accent" />
      </svg>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
        <span>1st</span>
        <span>15th</span>
        <span>{ordinal(days)}</span>
      </div>
    </div>
  );
}

function Spending() {
  const accounts = useDB((d) => d.accounts);
  const txns = useDB((d) => d.txns);
  const budgets = useDB((d) => d.budgets);
  const w = monthWindows();
  const spend = txns.filter((t) => isSpend(t, accounts));
  const thisMonth = spend.filter((t) => inRange(t.date, w.thisStart, new Date()));
  const lastToDate = spend.filter((t) => inRange(t.date, w.lastStart, w.lastSameEnd));
  const lastMonth = spend.filter((t) => inRange(t.date, w.lastStart, w.lastEnd));
  const total = thisMonth.reduce((s, t) => s - t.amount, 0);
  const lastTotal = lastToDate.reduce((s, t) => s - t.amount, 0);
  const diff = total - lastTotal;
  const cats = [...byCategory(thisMonth).entries()].sort((a, b) => b[1] - a[1]);
  const budgeted = (Object.keys(budgets) as Category[]).filter((c) => budgets[c]);
  const lastCats = byCategory(lastMonth);

  return (
    <Section title="Spent this month" meta={`${w.thisName} so far`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <p className="font-serif text-[40px] leading-none tracking-[-0.02em] text-ink tabular-nums">{money(total)}</p>
        <p className="max-w-[34ch] text-[13px] leading-snug text-muted">
          {Math.abs(diff) < 1 ? (
            <>About the same as by the {ordinal(w.day)} of {w.lastName}.</>
          ) : (
            <>
              <span className="text-ink tabular-nums">{money(Math.abs(diff))}</span> {diff < 0 ? "less" : "more"} than by this point in {w.lastName} (
              <span className="tabular-nums">{money(lastTotal)}</span>).
            </>
          )}
        </p>
      </div>
      <div className="mt-5">
        <MonthChart now={cumulative(spend, w.thisStart, w.day)} last={cumulative(spend, w.lastStart, w.lastDays)} days={Math.max(w.daysInMonth, w.lastDays)} />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-[2px] w-4 bg-accent" />
            {w.thisName}
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-0 w-4 border-t-[1.5px] border-dashed border-line-strong" />
            {w.lastName}, {money(lastMonth.reduce((s, t) => s - t.amount, 0), true)} in all
          </span>
          <span className="ml-auto">Personal accounts only, excluding transfers</span>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <Label>By category</Label>
          <Label className="text-faint">Budget</Label>
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {cats.map(([c, v]) => {
            const b = budgets[c];
            const near = b && v / b >= 0.85 && v < b;
            return (
              <li key={c} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
                <span className="text-[13.5px] text-ink">{categoryName[c]}</span>
                <span className="text-right text-[13.5px] tabular-nums text-ink sm:order-last">
                  {money(v)}
                  {b ? <span className="text-faint"> / {money(b, true)}</span> : null}
                </span>
                <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                  {b ? (
                    <>
                      <Meter value={v} max={b} tone={near ? "warn" : "neutral"} />
                      {v > b && <Tag tone="coral">Over by {money(v - b, v - b >= 10)}</Tag>}
                    </>
                  ) : (
                    <span className="text-[12px] text-faint">
                      No budget{lastCats.get(c) ? ` · ${money(lastCats.get(c)!, true)} last month` : ""}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
          {budgeted
            .filter((c) => !cats.some(([k]) => k === c))
            .map((c) => (
              <li key={c} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
                <span className="text-[13.5px] text-ink">{categoryName[c]}</span>
                <span className="text-right text-[13.5px] tabular-nums text-faint sm:order-last">{money(0)} / {money(budgets[c]!, true)}</span>
                <div className="col-span-2 sm:col-span-1">
                  <Meter value={0} max={budgets[c]!} tone="neutral" />
                </div>
              </li>
            ))}
        </ul>
      </div>
    </Section>
  );
}

function Noticed() {
  const bills = useDB((d) => d.bills);
  const txns = useDB((d) => d.txns);
  const accounts = useDB((d) => d.accounts);
  const list = notices(bills, txns, accounts, (n) => money(n));
  if (!list.length) return null;
  return (
    <Section title="Orbit noticed">
      <ul className="divide-y divide-line border-y border-line">
        {list.map((n) => (
          <li key={n.id}>
            <a href={href(n.path)} className="group block py-3 pr-1 transition-colors hover:bg-soft/60 focus-visible:bg-soft/60">
              <p className="font-serif text-[16px] leading-snug text-ink">{n.text}</p>
              <p className="mt-1.5 flex items-center gap-3">
                <Source id={n.source} />
                <span className="inline-flex items-center gap-1 text-[12px] text-muted group-hover:text-ink">
                  Open <ArrowRight size={12} />
                </span>
              </p>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function DueSoon() {
  const bills = useDB((d) => d.bills);
  const soon = bills
    .filter((b) => b.status !== "paid" && daysFrom(b.due) <= 14)
    .sort((a, b) => a.due.localeCompare(b.due));
  const total = soon.reduce((s, b) => s + b.amount, 0);
  return (
    <Section title="Due in the next 14 days" action={<a href={href("money/bills")} className="text-[12.5px] text-muted hover:text-ink">All bills</a>}>
      {soon.length ? (
        <>
          <List>
            {soon.map((b) => {
              const d = daysFrom(b.due);
              return (
                <Row key={b.id} href={href(`money/bills/${b.id}`)} className="py-2.5">
                  <span className={cx("w-[4.5rem] shrink-0 font-mono text-[11px] uppercase tracking-[0.06em]", d < 0 ? "text-coral" : d <= 2 ? "text-ink" : "text-muted")}>
                    {d < 0 ? "Overdue" : d < 7 ? relDay(b.due) : shortDate(b.due)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                    {b.name}
                    {!b.autopay && <span className="text-muted"> · pay by hand</span>}
                  </span>
                  <Amount value={b.amount} className="text-[14px] text-ink" />
                </Row>
              );
            })}
          </List>
          <div className="flex items-baseline justify-between px-1 pt-3 text-[13.5px]">
            <span className="text-muted">
              {soon.length} {soon.length === 1 ? "payment" : "payments"}
            </span>
            <span className="font-medium tabular-nums text-ink">{money(total)}</span>
          </div>
        </>
      ) : (
        <p className="border-y border-line py-4 text-[13.5px] text-muted">Nothing due in the next two weeks.</p>
      )}
    </Section>
  );
}

function Recent() {
  const txns = useDB((d) => d.txns);
  const accounts = useDB((d) => d.accounts);
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return (
    <Section title="Recent" action={<a href={href("money/transactions")} className="text-[12.5px] text-muted hover:text-ink">All transactions</a>}>
      <List>
        {recent.map((t) => (
          <TxnRow key={t.id} t={t} accounts={accounts} />
        ))}
      </List>
    </Section>
  );
}

export default function Overview() {
  const accounts = useDB((d) => d.accounts);
  return (
    <div className="flex flex-col gap-10">
      <Balances accounts={accounts} />
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Spending />
        <div className="flex flex-col gap-10">
          <Noticed />
          <DueSoon />
        </div>
      </div>
      <Recent />
    </div>
  );
}
