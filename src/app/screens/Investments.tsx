import { useState } from "react";
import { Info } from "@phosphor-icons/react";
import { portfolio } from "../data";
import { Card, CardHead, PageHeader, Segmented, money } from "../ui";

const ranges = ["1D", "1M", "1Y", "ALL"] as const;
type Range = (typeof ranges)[number];

function chart(data: number[], w: number, h: number) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 16) - 8]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return { d, area: `${d} L${w},${h} L0,${h} Z` };
}

export function InvestmentsScreen() {
  const [range, setRange] = useState<Range>("1D");
  const r = portfolio.ranges[range];
  const { d, area } = chart(r.series, 600, 180);
  const circ = 2 * Math.PI * 38;
  let acc = 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Investments" subtitle="Your portfolio at a glance." />
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12.5px] text-muted">Portfolio value</p>
            <p className="font-mono text-[34px] tracking-[-0.03em]">{money(portfolio.value)}</p>
            <p className="font-mono text-[13px] text-accent-fg">+{money(r.change)} ({r.pct.toFixed(2)}%) {range === "ALL" ? "all time" : range === "1D" ? "today" : `past ${range === "1M" ? "month" : "year"}`}</p>
          </div>
          <Segmented items={ranges} value={range} onChange={setRange} label="Chart range" />
        </div>
        <svg viewBox="0 0 600 180" className="h-44 w-full md:h-56" preserveAspectRatio="none" role="img" aria-label={`Portfolio value over ${range}, rising to ${money(portfolio.value)}`}>
          <defs>
            <linearGradient id="app-inv" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--green)" }} stopOpacity="0.28" />
              <stop offset="1" style={{ stopColor: "var(--green)" }} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[45, 90, 135].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 4" />)}
          <path d={area} fill="url(#app-inv)" />
          <path d={d} fill="none" stroke="var(--green)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="flex flex-col gap-4 p-5">
          <CardHead title="Asset allocation" />
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" aria-hidden="true">
              {portfolio.allocation.map((a) => {
                const len = (a.v / 100) * circ;
                const el = <circle key={a.k} cx="50" cy="50" r="38" fill="none" stroke={a.c} strokeWidth="13" strokeDasharray={`${len - 2} ${circ}`} strokeDashoffset={-acc} />;
                acc += len;
                return el;
              })}
            </svg>
            <ul className="flex flex-1 flex-col gap-2">
              {portfolio.allocation.map((a) => (
                <li key={a.k} className="flex items-center gap-2 text-[13px]">
                  <span className="size-2.5 rounded-sm" style={{ background: a.c }} />
                  <span className="flex-1 text-muted">{a.k}</span>
                  <span className="font-mono">{a.v}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="p-5 pb-2"><CardHead title="Holdings" /></div>
          <ul className="divide-y divide-line">
            {portfolio.holdings.map((h) => (
              <li key={h.name} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px]">{h.name}</p>
                  <p className="truncate text-[12px] text-muted">{h.account}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[13.5px]">{money(h.value)}</p>
                  <p className="font-mono text-[11.5px] text-accent-fg">{h.day ? `+${h.day}%` : "0.0%"}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="flex items-start gap-2 text-[12px] leading-snug text-muted">
        <Info size={14} className="mt-px shrink-0" />
        Fictional figures for illustration. Orbit organises information and does not give personalised investment advice.
      </p>
    </div>
  );
}
