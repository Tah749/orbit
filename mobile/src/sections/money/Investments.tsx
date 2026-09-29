import { useState, type ReactNode } from "react";
import { View } from "react-native";
import type { Holding } from "@orbit/data/money";
import { money } from "@orbit/format";
import { useDB } from "../../store";
import { Label, List, Row, Section, Segmented, Skeleton, SkeletonBlock, SkeletonList, Source, Sparkline, Text, useTheme } from "./kit";
import { useWidth } from "./shared";

const wrappers: { key: Holding["account"]; name: string; tone: "accent" | "muted" | "line" }[] = [
  { key: "ISA", name: "Stocks and shares ISA", tone: "accent" },
  { key: "SIPP", name: "Pension (SIPP)", tone: "muted" },
  { key: "GIA", name: "General account", tone: "line" },
];

const value = (h: Holding) => h.units * h.price;
const pct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n))}`;
const units = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });

type Range = "4 weeks" | "8 weeks" | "12 weeks";
const ranges: readonly Range[] = ["4 weeks", "8 weeks", "12 weeks"];
const weeks: Record<Range, number> = { "4 weeks": 4, "8 weeks": 8, "12 weeks": 12 };

function Change({ n, children, size = 13.5 }: { n: number; children: ReactNode; size?: number }) {
  return (
    <Text size={size} num tone={n > 0 ? "accent" : n < 0 ? "coral" : "muted"}>
      {children}
    </Text>
  );
}

export function InvestmentsSkeleton() {
  return (
    <View style={{ gap: 22 }}>
      <Skeleton width={70} height={10} />
      <Skeleton width={190} height={44} />
      <SkeletonBlock height={120} />
      <SkeletonList rows={5} />
    </View>
  );
}

export default function Investments() {
  const { c } = useTheme();
  const holdings = useDB((d) => d.holdings);
  const history = useDB((d) => d.portfolioHistory);
  const [range, setRange] = useState<Range>("12 weeks");
  const [width, lay] = useWidth();
  const total = holdings.reduce((s, h) => s + value(h), 0);
  const cost = holdings.reduce((s, h) => s + h.cost, 0);
  const gain = total - cost;
  const all = [...history, total];
  const series = all.slice(-Math.min(all.length, weeks[range] + 1));
  const since = total - series[0];
  const brokers = [...new Set(holdings.map((h) => h.broker))];
  const split = wrappers.map((w) => ({ ...w, value: holdings.filter((h) => h.account === w.key).reduce((s, h) => s + value(h), 0) })).filter((w) => w.value > 0);
  const swatch = (t: "accent" | "muted" | "line") => (t === "accent" ? c.accent : t === "muted" ? c.muted : c.lineStrong);
  const sorted = [...holdings].sort((a, b) => value(b) - value(a));

  return (
    <View>
      <View style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 24, marginBottom: 26 }}>
        <Label>Portfolio value</Label>
        <Text size={44} font="serif" num style={{ marginTop: 8, lineHeight: 48, letterSpacing: -0.9 }}>
          {money(total)}
        </Text>
        <View style={{ marginTop: 14, gap: 6 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Text size={13.5} tone="muted" style={{ width: 130 }}>Against what you paid</Text>
            <View style={{ flex: 1 }}>
              <Change n={gain}>{`${signed(gain)} (${pct((gain / cost) * 100)})`}</Change>
              <Text size={12.5} tone="muted" num>{`on ${money(cost, true)}`}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Text size={13.5} tone="muted" style={{ width: 130 }}>Over {range}</Text>
            <Change n={since}>{signed(since)}</Change>
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4, marginTop: 14 }}>
          {brokers.map((b) => (
            <Source key={b} id={b} />
          ))}
        </View>
        <View style={{ marginTop: 20 }}>
          <Segmented<Range> label="Range" items={ranges} value={range} onChange={setRange} />
        </View>
        <View style={{ marginTop: 16 }} onLayout={lay.onLayout}>
          <Sparkline values={series} width={width} height={120} area />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Label tone="faint" style={{ fontSize: 10 }}>{`${range} ago · ${money(series[0], true)}`}</Label>
            <Label tone="faint" style={{ fontSize: 10 }}>Today</Label>
          </View>
        </View>
      </View>

      <Section title="Where it's held">
        <View accessibilityLabel={split.map((w) => `${w.name} ${Math.round((w.value / total) * 100)}%`).join(", ")} style={{ flexDirection: "row", height: 10, gap: 2, borderRadius: 3, overflow: "hidden" }}>
          {split.map((w) => (
            <View key={w.key} style={{ flex: w.value, backgroundColor: swatch(w.tone) }} />
          ))}
        </View>
        <View style={{ marginTop: 14, gap: 10 }}>
          {split.map((w) => (
            <View key={w.key} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: swatch(w.tone) }} />
              <Text size={13.5} style={{ flex: 1 }}>{w.name}</Text>
              <Text size={13} tone="muted" num>{`${money(w.value, true)} · ${Math.round((w.value / total) * 100)}%`}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Holdings" meta={`${holdings.length} holdings`}>
        <List>
          {sorted.map((h) => {
            const v = value(h);
            const g = ((v - h.cost) / h.cost) * 100;
            return (
              <Row
                key={h.id}
                minHeight={64}
                right={
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text size={14.5} num font="sansMedium">{money(v)}</Text>
                    <Change n={g} size={12.5}>{pct(g)}</Change>
                  </View>
                }
              >
                <Text size={14.5} lines={1}>{h.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <Text size={11.5} font="mono" tone="muted">{h.ticker}</Text>
                  <Text size={12} tone="muted">· {h.account}</Text>
                  <Source id={h.broker} />
                </View>
                <Text size={12} tone="faint" num style={{ marginTop: 2 }}>{`${units.format(h.units)} units at ${money(h.price)}`}</Text>
              </Row>
            );
          })}
        </List>
      </Section>

      <Text size={13} tone="muted" style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 14, lineHeight: 19 }}>
        Orbit shows your investments. It doesn't give financial advice. Values are sample data and past changes say nothing about what happens next.
      </Text>
    </View>
  );
}
