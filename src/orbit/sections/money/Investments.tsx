import type { ReactNode } from "react";
import { useDB } from "../../store";
import type { Holding } from "../../data/money";
import { cx, Label, money, Source, Sparkline } from "../../ui";

const wrappers: { key: Holding["account"]; name: string; swatch: string }[] = [
  { key: "ISA", name: "Stocks and shares ISA", swatch: "bg-accent" },
  { key: "SIPP", name: "Pension (SIPP)", swatch: "bg-muted" },
  { key: "GIA", name: "General account", swatch: "bg-line-strong" },
];

const value = (h: Holding) => h.units * h.price;
const pct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n))}`;
const units = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });

function Change({ n, children }: { n: number; children: ReactNode }) {
  return <span className={cx("tabular-nums", n > 0 ? "text-accent" : n < 0 ? "text-coral" : "text-muted")}>{children}</span>;
}

export default function Investments() {
  const holdings = useDB((d) => d.holdings);
  const history = useDB((d) => d.portfolioHistory);
  const total = holdings.reduce((s, h) => s + value(h), 0);
  const cost = holdings.reduce((s, h) => s + h.cost, 0);
  const gain = total - cost;
  const series = [...history, total];
  const since = total - history[0];
  const brokers = [...new Set(holdings.map((h) => h.broker))];
  const split = wrappers.map((w) => ({ ...w, value: holdings.filter((h) => h.account === w.key).reduce((s, h) => s + value(h), 0) })).filter((w) => w.value > 0);
  const sorted = [...holdings].sort((a, b) => value(b) - value(a));

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-x-12 gap-y-8 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <Label>Portfolio value</Label>
          <p className="mt-2 font-serif text-[44px] leading-none tracking-[-0.02em] text-ink tabular-nums">{money(total)}</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-[13.5px]">
            <dt className="text-muted">Against what you paid</dt>
            <dd>
              <Change n={gain}>
                {signed(gain)} ({pct((gain / cost) * 100)})
              </Change>
              <span className="text-muted"> on {money(cost, true)}</span>
            </dd>
            <dt className="text-muted">Over 12 weeks</dt>
            <dd>
              <Change n={since}>{signed(since)}</Change>
            </dd>
          </dl>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {brokers.map((b) => (
              <Source key={b} id={b} />
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <Sparkline values={series} width={560} height={120} className="h-auto w-full" />
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
            <span>12 weeks ago · {money(history[0], true)}</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-[13.5px] font-semibold text-ink">Where it's held</h2>
        <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-[3px]" role="img" aria-label={split.map((w) => `${w.name} ${Math.round((w.value / total) * 100)}%`).join(", ")}>
          {split.map((w) => (
            <div key={w.key} className={w.swatch} style={{ width: `${(w.value / total) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-3">
          {split.map((w) => (
            <li key={w.key} className="flex items-baseline gap-2.5">
              <span aria-hidden className={cx("size-2 shrink-0 translate-y-[-1px] rounded-[2px]", w.swatch)} />
              <div className="min-w-0">
                <p className="text-[13.5px] text-ink">{w.name}</p>
                <p className="text-[12.5px] tabular-nums text-muted">
                  {money(w.value, true)} · {Math.round((w.value / total) * 100)}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[13.5px] font-semibold text-ink">Holdings</h2>
          <span className="text-[12.5px] tabular-nums text-muted">{holdings.length} holdings</span>
        </div>
        <div role="table" aria-label="Holdings" className="border-y border-line">
          <div role="row" className="hidden grid-cols-[minmax(0,2.4fr)_4rem_5rem_5.5rem_6.5rem_4.5rem] gap-4 border-b border-line px-1 py-2 md:grid">
            {["Holding", "Account", "Units", "Price", "Value", "Gain"].map((h, i) => (
              <span key={h} role="columnheader" className={cx("font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted", i > 1 && "text-right")}>
                {h}
              </span>
            ))}
          </div>
          <div className="divide-y divide-line">
            {sorted.map((h) => {
              const v = value(h);
              const g = ((v - h.cost) / h.cost) * 100;
              return (
                <div
                  key={h.id}
                  role="row"
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-1 py-3 md:grid-cols-[minmax(0,2.4fr)_4rem_5rem_5.5rem_6.5rem_4.5rem]"
                >
                  <div role="cell" className="min-w-0">
                    <p className="truncate text-[14px] text-ink">{h.name}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted">
                      <span className="font-mono text-[11.5px] tracking-[0.04em]">{h.ticker}</span>
                      <span className="md:hidden">· {h.account}</span>
                      <Source id={h.broker} />
                    </p>
                  </div>
                  <span role="cell" className="hidden text-[13px] text-muted md:block">
                    {h.account}
                  </span>
                  <span role="cell" className="hidden text-right text-[13px] tabular-nums text-muted md:block">
                    {units.format(h.units)}
                  </span>
                  <span role="cell" className="hidden text-right text-[13px] tabular-nums text-muted md:block">
                    {money(h.price)}
                  </span>
                  <div role="cell" className="text-right max-md:row-span-2">
                    <p className="text-[14px] tabular-nums text-ink">{money(v)}</p>
                    <p className="text-[12.5px] md:hidden">
                      <Change n={g}>{pct(g)}</Change>
                    </p>
                  </div>
                  <span role="cell" className="hidden text-right text-[13px] md:block">
                    <Change n={g}>{pct(g)}</Change>
                  </span>
                  <p className="text-[12px] tabular-nums text-faint md:hidden">
                    {units.format(h.units)} units at {money(h.price)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <p className="max-w-[60ch] border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
        Orbit shows your investments. It doesn't give financial advice. Values are sample data and past changes say nothing about what happens next.
      </p>
    </div>
  );
}
