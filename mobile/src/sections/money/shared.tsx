import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { categoryName, type Account, type Txn } from "@orbit/data/money";
import { time } from "@orbit/time";
import { Amount, Label, Row, Source, Tag, Text, useTheme } from "./kit";

export const accountOf = (accounts: Account[], id: string) => accounts.find((a) => a.id === id);

/** Measures its container so svg charts can draw at the real width. */
export function useWidth(initial = 320) {
  const [w, setW] = useState(initial);
  return [w, { onLayout: (e: { nativeEvent: { layout: { width: number } } }) => setW(Math.max(1, Math.round(e.nativeEvent.layout.width))) }] as const;
}

/** A small selectable chip for filters and category choices. */
export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 7, borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : c.surface, justifyContent: "center" }}
    >
      <Text size={13} font={on ? "sansMedium" : "sans"} style={{ color: on ? c.paper : c.muted }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 16 }} style={{ flexGrow: 0 }}>
      {children}
    </ScrollView>
  );
}

/** Label and value pairs, separated by hairlines. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  const { c } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
      {items.map(([k, v]) => (
        <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, minHeight: 44, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <Label>{k}</Label>
          <View style={{ flexShrink: 1, alignItems: "flex-end" }}>{typeof v === "string" ? <Text size={14} align="right">{v}</Text> : v}</View>
        </View>
      ))}
    </View>
  );
}

/** A text link-style button. */
export function LinkText({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={{ minHeight: 32, justifyContent: "center" }}>
      <Text size={12.5} tone="muted" style={{ textDecorationLine: "underline" }}>
        {children}
      </Text>
    </Pressable>
  );
}

/** One transaction: merchant, category and account, amount right-aligned. */
export function TxnRow({ t, accounts, onPress }: { t: Txn; accounts: Account[]; onPress: () => void }) {
  return (
    <Row onPress={onPress} minHeight={56} label={`${t.merchant}, ${t.amount}`} right={<TxnRight t={t} accounts={accounts} />}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text size={14.5} lines={1} style={{ flexShrink: 1 }}>
          {t.merchant}
        </Text>
        {t.pending ? <Tag>Pending</Tag> : null}
      </View>
      <Text size={12.5} tone="muted" lines={1} style={{ marginTop: 2 }}>
        {categoryName[t.category]} · {time(t.date)}
        {t.note ? ` · ${t.note}` : ""}
      </Text>
    </Row>
  );
}

/** The right-hand side of a transaction row is built into Row's `right`; this wraps it for reuse. */
export function TxnRight({ t, accounts }: { t: Txn; accounts: Account[] }) {
  const acc = accountOf(accounts, t.accountId);
  return (
    <View style={{ alignItems: "flex-end", gap: 4 }}>
      <Amount value={t.amount} signed tone={t.pending ? "muted" : undefined} />
      {acc ? <Source id={acc.institution} /> : null}
    </View>
  );
}

/** Line chart: each series is drawn over the same scale. Values are per day, starting at the left edge. */
export function LineChart({ width, height = 132, days, series }: { width: number; height?: number; days: number; series: { values: number[]; color: string; dashed?: boolean; dot?: boolean }[] }) {
  const { c } = useTheme();
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i: number) => (i / Math.max(1, days - 1)) * (width - 6) + 3;
  const y = (v: number) => height - 4 - (v / max) * (height - 12);
  return (
    <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no">
      <Line x1={0} x2={width} y1={height - 4} y2={height - 4} stroke={c.line} strokeWidth={1} />
      {series.map((s, k) => (
        <Path
          key={k}
          d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={s.color}
          strokeWidth={s.dashed ? 1.5 : 1.75}
          strokeDasharray={s.dashed ? "3 3" : undefined}
          strokeLinejoin="round"
        />
      ))}
      {series.map((s, k) => (s.dot && s.values.length ? <Circle key={`d${k}`} cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r={3.5} fill={s.color} /> : null))}
    </Svg>
  );
}
