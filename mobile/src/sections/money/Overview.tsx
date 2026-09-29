import { View } from "react-native";
import { categoryName, type Account, type Category } from "@orbit/data/money";
import { daysFrom, relDay, shortDate, stamp } from "@orbit/time";
import { money } from "@orbit/format";
import { byCategory, cumulative, inRange, isSpend, monthWindows, notices, ordinal } from "@orbit/sections/money/lib";
import { useDB } from "../../store";
import { Amount, Label, List, Meter, Row, Section, Skeleton, SkeletonBlock, SkeletonList, Source, Tag, Text, useTheme } from "./kit";
import { LineChart, LinkText, TxnRow, useWidth } from "./shared";

function Balances({ accounts }: { accounts: Account[] }) {
  const { c } = useTheme();
  const of = (type: Account["type"]) => accounts.filter((a) => a.type === type);
  const sum = (type: Account["type"]) => of(type).reduce((s, a) => s + a.balance, 0);
  const latest = (list: Account[]) => list.reduce((a, x) => (x.updatedAt > a ? x.updatedAt : a), "");
  const cells = [
    { label: "Current accounts", value: sum("current"), list: of("current") },
    { label: "Savings", value: sum("savings"), list: of("savings") },
    { label: "Credit card owed", value: -sum("credit"), list: of("credit") },
    { label: "Business, kept apart", value: sum("business"), list: of("business"), apart: true },
  ];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 8, marginBottom: 26 }}>
      {cells.map((x, i) => (
        <View key={x.label} style={{ width: "50%", paddingBottom: 18, paddingLeft: i % 2 ? 14 : 0, paddingRight: i % 2 ? 0 : 14, borderLeftWidth: i % 2 ? 1 : 0, borderLeftColor: c.line, borderStyle: x.apart ? "dashed" : "solid" }}>
          <Label>{x.label}</Label>
          <Text size={24} font="sansMedium" num style={{ marginTop: 6, letterSpacing: -0.5 }}>
            {money(x.value).replace("-", "−")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8, rowGap: 3, marginTop: 6 }}>
            {x.list.map((a) => (
              <Source key={a.id} id={a.institution} />
            ))}
            {x.list.length ? (
              <Text size={12} tone="muted" num>
                {stamp(latest(x.list))}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function Spending() {
  const { c } = useTheme();
  const accounts = useDB((d) => d.accounts);
  const txns = useDB((d) => d.txns);
  const budgets = useDB((d) => d.budgets);
  const [width, lay] = useWidth();
  const w = monthWindows();
  const spend = txns.filter((t) => isSpend(t, accounts));
  const thisMonth = spend.filter((t) => inRange(t.date, w.thisStart, new Date()));
  const lastToDate = spend.filter((t) => inRange(t.date, w.lastStart, w.lastSameEnd));
  const lastMonth = spend.filter((t) => inRange(t.date, w.lastStart, w.lastEnd));
  const total = thisMonth.reduce((s, t) => s - t.amount, 0);
  const lastTotal = lastToDate.reduce((s, t) => s - t.amount, 0);
  const diff = total - lastTotal;
  const cats = [...byCategory(thisMonth).entries()].sort((a, b) => b[1] - a[1]);
  const budgeted = (Object.keys(budgets) as Category[]).filter((k) => budgets[k]);
  const lastCats = byCategory(lastMonth);
  const days = Math.max(w.daysInMonth, w.lastDays);

  return (
    <Section title="Spent this month" meta={`${w.thisName} so far`}>
      <Text size={40} font="serif" num style={{ lineHeight: 44, letterSpacing: -0.8 }}>
        {money(total)}
      </Text>
      <Text size={13.5} tone="muted" style={{ marginTop: 6 }}>
        {Math.abs(diff) < 1 ? (
          `About the same as by the ${ordinal(w.day)} of ${w.lastName}.`
        ) : (
          <>
            <Text size={13.5} num>
              {money(Math.abs(diff))}
            </Text>
            {` ${diff < 0 ? "less" : "more"} than by this point in ${w.lastName} (${money(lastTotal)}).`}
          </>
        )}
      </Text>
      <View style={{ marginTop: 16 }} onLayout={lay.onLayout}>
        <LineChart
          width={width}
          days={days}
          series={[
            { values: cumulative(spend, w.lastStart, w.lastDays), color: c.lineStrong, dashed: true },
            { values: cumulative(spend, w.thisStart, w.day), color: c.accent, dot: true },
          ]}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          {["1st", "15th", ordinal(days)].map((l) => (
            <Label key={l} tone="faint" style={{ fontSize: 10 }}>
              {l}
            </Label>
          ))}
        </View>
      </View>
      <View style={{ marginTop: 12, gap: 5 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 16, height: 2, backgroundColor: c.accent }} />
          <Text size={12} tone="muted">{w.thisName}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 16, borderTopWidth: 1.5, borderStyle: "dashed", borderColor: c.lineStrong }} />
          <Text size={12} tone="muted">
            {w.lastName}, {money(lastMonth.reduce((s, t) => s - t.amount, 0), true)} in all
          </Text>
        </View>
        <Text size={12} tone="faint">Personal accounts only, excluding transfers</Text>
      </View>

      <View style={{ marginTop: 26 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Label>By category</Label>
          <Label tone="faint">Budget</Label>
        </View>
        <List>
          {cats.map(([k, v]) => {
            const b = budgets[k];
            const near = !!b && v / b >= 0.85 && v < b;
            return (
              <View key={k} style={{ paddingVertical: 11, gap: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Text size={14}>{categoryName[k]}</Text>
                  <Text size={14} num>
                    {money(v)}
                    {b ? <Text size={14} tone="faint" num>{` / ${money(b, true)}`}</Text> : null}
                  </Text>
                </View>
                {b ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Meter value={v} max={b} tone={near ? "warn" : "neutral"} />
                    </View>
                    {v > b ? <Tag tone="coral">Over by {money(v - b, v - b >= 10)}</Tag> : null}
                  </View>
                ) : (
                  <Text size={12} tone="faint">
                    No budget{lastCats.get(k) ? ` · ${money(lastCats.get(k)!, true)} last month` : ""}
                  </Text>
                )}
              </View>
            );
          })}
          {budgeted
            .filter((k) => !cats.some(([x]) => x === k))
            .map((k) => (
              <View key={k} style={{ paddingVertical: 11, gap: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text size={14}>{categoryName[k]}</Text>
                  <Text size={14} tone="faint" num>{`${money(0)} / ${money(budgets[k]!, true)}`}</Text>
                </View>
                <Meter value={0} max={budgets[k]!} tone="neutral" />
              </View>
            ))}
        </List>
      </View>
    </Section>
  );
}

function Noticed({ onOpen }: { onOpen: (path: string) => void }) {
  const bills = useDB((d) => d.bills);
  const txns = useDB((d) => d.txns);
  const accounts = useDB((d) => d.accounts);
  const list = notices(bills, txns, accounts, (n) => money(n));
  if (!list.length) return null;
  return (
    <Section title="Orbit noticed">
      <List>
        {list.map((n) => (
          <Row key={n.id} onPress={() => onOpen(n.path)} chevron minHeight={64} label={n.text}>
            <Text size={16} font="serif" style={{ lineHeight: 22 }}>
              {n.text}
            </Text>
            <View style={{ marginTop: 6 }}>
              <Source id={n.source} />
            </View>
          </Row>
        ))}
      </List>
    </Section>
  );
}

function DueSoon({ onOpen, onAll }: { onOpen: (path: string) => void; onAll: () => void }) {
  const { c } = useTheme();
  const bills = useDB((d) => d.bills);
  const soon = bills.filter((b) => b.status !== "paid" && daysFrom(b.due) <= 14).sort((a, b) => a.due.localeCompare(b.due));
  const total = soon.reduce((s, b) => s + b.amount, 0);
  return (
    <Section title="Due in the next 14 days" action={<LinkText onPress={onAll}>All bills</LinkText>}>
      {soon.length ? (
        <>
          <List>
            {soon.map((b) => {
              const d = daysFrom(b.due);
              return (
                <Row key={b.id} onPress={() => onOpen(`money/bills/${b.id}`)} label={b.name}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Label tone={d < 0 ? "coral" : d <= 2 ? "ink" : "muted"} style={{ width: 66 }}>
                      {d < 0 ? "Overdue" : d < 7 ? relDay(b.due) : shortDate(b.due)}
                    </Label>
                    <View style={{ flex: 1 }}>
                      <Text size={14.5} lines={1}>
                        {b.name}
                        {!b.autopay ? <Text size={14.5} tone="muted">{" · pay by hand"}</Text> : null}
                      </Text>
                    </View>
                    <Amount value={b.amount} />
                  </View>
                </Row>
              );
            })}
          </List>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, paddingHorizontal: 2 }}>
            <Text size={13.5} tone="muted">
              {soon.length} {soon.length === 1 ? "payment" : "payments"}
            </Text>
            <Text size={13.5} font="sansMedium" num>
              {money(total)}
            </Text>
          </View>
        </>
      ) : (
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 16 }}>
          <Text size={13.5} tone="muted">Nothing due in the next two weeks.</Text>
        </View>
      )}
    </Section>
  );
}

function Recent({ onOpen, onAll }: { onOpen: (path: string) => void; onAll: () => void }) {
  const txns = useDB((d) => d.txns);
  const accounts = useDB((d) => d.accounts);
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return (
    <Section title="Recent" action={<LinkText onPress={onAll}>All transactions</LinkText>}>
      <List>
        {recent.map((t) => (
          <TxnRow key={t.id} t={t} accounts={accounts} onPress={() => onOpen(`money/transactions/${t.id}`)} />
        ))}
      </List>
    </Section>
  );
}

export function OverviewSkeleton() {
  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 22, marginBottom: 30 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: "50%", gap: 10, paddingRight: 14 }}>
            <Skeleton width={80} height={10} />
            <Skeleton width={110} height={24} />
            <Skeleton width={70} height={10} />
          </View>
        ))}
      </View>
      <Skeleton width={150} height={40} />
      <View style={{ height: 14 }} />
      <SkeletonBlock height={132} />
      <View style={{ height: 24 }} />
      <SkeletonList rows={5} />
    </View>
  );
}

export default function Overview({ onOpen, onTab }: { onOpen: (path: string) => void; onTab: (tab: "transactions" | "bills") => void }) {
  const accounts = useDB((d) => d.accounts);
  return (
    <View>
      <Balances accounts={accounts} />
      <Spending />
      <Noticed onOpen={onOpen} />
      <DueSoon onOpen={onOpen} onAll={() => onTab("bills")} />
      <Recent onOpen={onOpen} onAll={() => onTab("transactions")} />
    </View>
  );
}
