import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { MagnifyingGlass } from "phosphor-react-native";
import { categoryName, type Category, type Txn } from "@orbit/data/money";
import { dayLabel, daysFrom, longDate, parse, relDay, time, ymd } from "@orbit/time";
import { money } from "@orbit/format";
import { db, useDB } from "../../store";
import { Amount, Button, Empty, Field, Input, Label, List, Sheet, SkeletonList, Source, Tag, Text, Textarea, toast, useTheme } from "./kit";
import { accountOf, Chip, ChipRow, Facts, LinkText, TxnRow } from "./shared";

const allCategories = Object.keys(categoryName) as Category[];

function TxnSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const last = useRef(id);
  if (id) last.current = id;
  const t = useDB((d) => d.txns.find((x) => x.id === last.current));
  const accounts = useDB((d) => d.accounts);
  const acc = t && accountOf(accounts, t.accountId);
  return (
    <Sheet
      open={!!id}
      onClose={onClose}
      title={t?.merchant ?? "Transaction"}
      footer={
        <Button variant="primary" onPress={onClose}>
          Done
        </Button>
      }
    >
      {t ? (
        <View style={{ gap: 24 }}>
          <View>
            <Amount value={t.amount} signed size={40} style={{ fontFamily: "Newsreader_400Regular", letterSpacing: -0.8, lineHeight: 44 }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
              <Tag>{t.pending ? "Pending" : "Settled"}</Tag>
              <Text size={13} tone="muted">
                {t.amount > 0 ? "Money in" : "Money out"}
              </Text>
            </View>
          </View>
          <Facts
            items={[
              ["When", `${longDate(t.date)}, ${time(t.date)}`],
              ["Account", acc ? `${acc.name} ··${acc.mask}` : "Unknown"],
              ["Source", acc ? <Source id={acc.institution} /> : "—"],
            ]}
          />
          <Field label="Category">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {allCategories.map((k) => (
                <Chip
                  key={k}
                  label={categoryName[k]}
                  on={t.category === k}
                  onPress={() => {
                    if (k === t.category) return;
                    const prev = t.category;
                    db.patch("txns", t.id, { category: k });
                    toast(`Moved to ${categoryName[k]}`, { label: "Undo", run: () => db.patch("txns", t.id, { category: prev }) });
                  }}
                />
              ))}
            </View>
          </Field>
          <Field label="Note" hint="Only you see this. It's kept on this device.">
            <Textarea value={t.note ?? ""} placeholder="What was this for?" onChangeText={(v) => db.patch("txns", t.id, { note: v || undefined })} />
          </Field>
        </View>
      ) : (
        <Empty title="Not found">This transaction isn't in your sample data any more.</Empty>
      )}
    </Sheet>
  );
}

export function TransactionsSkeleton() {
  return <SkeletonList rows={8} />;
}

export default function Transactions({ openId, onOpen, onClose }: { openId?: string; onOpen: (id: string) => void; onClose: () => void }) {
  const { c } = useTheme();
  const txns = useDB((d) => d.txns);
  const accounts = useDB((d) => d.accounts);
  const [q, setQ] = useState("");
  const [account, setAccount] = useState("all");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [shown, setShown] = useState(10);

  const days = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = txns
      .filter((t) => account === "all" || t.accountId === account)
      .filter((t) => category === "all" || t.category === category)
      .filter((t) => !needle || t.merchant.toLowerCase().includes(needle) || (t.note ?? "").toLowerCase().includes(needle) || categoryName[t.category].toLowerCase().includes(needle))
      .sort((a, b) => b.date.localeCompare(a.date));
    const groups = new Map<string, Txn[]>();
    for (const t of list) {
      const k = ymd(parse(t.date));
      groups.set(k, [...(groups.get(k) ?? []), t]);
    }
    return [...groups.entries()];
  }, [txns, q, account, category]);

  const filtered = !!q || account !== "all" || category !== "all";
  const count = days.reduce((s, [, l]) => s + l.length, 0);

  return (
    <View>
      <View style={{ justifyContent: "center" }}>
        <Input value={q} onChangeText={setQ} placeholder="Search by name, category or note" accessibilityLabel="Search transactions" returnKeyType="search" clearButtonMode="while-editing" autoCorrect={false} style={{ paddingLeft: 38 }} />
        <View pointerEvents="none" style={{ position: "absolute", left: 12 }}>
          <MagnifyingGlass size={16} color={c.faint} />
        </View>
      </View>
      <View style={{ marginTop: 10, gap: 6 }}>
        <ChipRow>
          <Chip label="All accounts" on={account === "all"} onPress={() => setAccount("all")} />
          {accounts.map((a) => (
            <Chip key={a.id} label={a.name} on={account === a.id} onPress={() => setAccount(a.id)} />
          ))}
        </ChipRow>
        <ChipRow>
          <Chip label="All categories" on={category === "all"} onPress={() => setCategory("all")} />
          {allCategories.map((k) => (
            <Chip key={k} label={categoryName[k]} on={category === k} onPress={() => setCategory(k)} />
          ))}
        </ChipRow>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 }}>
        <Text size={12.5} tone="muted" num>
          {count} {count === 1 ? "transaction" : "transactions"}
        </Text>
        {filtered ? (
          <LinkText
            onPress={() => {
              setQ("");
              setAccount("all");
              setCategory("all");
            }}
          >
            Clear filters
          </LinkText>
        ) : null}
      </View>

      {days.length ? (
        <View style={{ marginTop: 18, gap: 24 }}>
          {days.slice(0, shown).map(([day, list]) => {
            const out = list.filter((t) => t.amount < 0 && t.category !== "transfers").reduce((s, t) => s - t.amount, 0);
            return (
              <View key={day}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, paddingHorizontal: 2 }}>
                  <Text size={13} font="sansMedium" accessibilityRole="header">
                    {relDay(day)}
                    {daysFrom(day) >= -1 ? <Text size={13} tone="muted">{` · ${dayLabel(day)}`}</Text> : null}
                  </Text>
                  {out > 0 ? (
                    <Text size={12.5} tone="muted" num>
                      {money(out)} out
                    </Text>
                  ) : null}
                </View>
                <List>
                  {list.map((t) => (
                    <TxnRow key={t.id} t={t} accounts={accounts} onPress={() => onOpen(t.id)} />
                  ))}
                </List>
              </View>
            );
          })}
          {days.length > shown ? <Button onPress={() => setShown((n) => n + 10)}>Show earlier</Button> : null}
        </View>
      ) : (
        <Empty title="No transactions match">Try a different search, or clear the filters.</Empty>
      )}
      <TxnSheet id={openId} onClose={onClose} />
    </View>
  );
}
