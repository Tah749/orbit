import { useRef, type ReactNode } from "react";
import { View } from "react-native";
import type { Bill } from "@orbit/data/money";
import { daysFrom, longDate, relDay, shortDate, stamp } from "@orbit/time";
import { money } from "@orbit/format";
import { canCompare, nextDue, perMonth, recurrenceName, remindBy, tasksFor } from "@orbit/sections/money/lib";
import { db, newId, useDB } from "../../store";
import { Amount, Button, Empty, Figure, Label, List, Row, Sheet, Skeleton, SkeletonList, Source, Tag, Text, toast, useTheme } from "./kit";
import { accountOf, Facts } from "./shared";

function dueText(b: Bill) {
  if (b.status === "paid") return "Paid";
  const d = daysFrom(b.due);
  if (d < 0) return "Overdue";
  if (d < 7) return relDay(b.due);
  return shortDate(b.due);
}

function BillRow({ b, onPress }: { b: Bill; onPress: () => void }) {
  const accounts = useDB((d) => d.accounts);
  const acc = accountOf(accounts, b.accountId);
  const d = daysFrom(b.due);
  const rise = !!b.previous && b.amount > b.previous;
  return (
    <Row onPress={onPress} minHeight={60} label={b.name} right={<BillRight b={b} />}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text size={14.5} lines={1} style={{ flexShrink: 1 }}>
          {b.name}
        </Text>
        {rise ? <Tag tone="warn">Up {money(b.amount - b.previous!)}</Tag> : null}
      </View>
      <Text size={12.5} tone="muted" lines={1} style={{ marginTop: 2 }}>
        {recurrenceName[b.recurrence]} · {b.autopay ? "Autopay" : "Pay by hand"}
        {acc ? ` · ${acc.name}` : ""}
      </Text>
      <Label tone={b.status === "paid" ? "faint" : d < 0 ? "coral" : d <= 3 ? "ink" : "muted"} style={{ marginTop: 5 }}>
        {dueText(b)}
      </Label>
    </Row>
  );
}

function BillRight({ b }: { b: Bill }) {
  return (
    <View style={{ alignItems: "flex-end", gap: 4 }}>
      <Amount value={b.amount} tone={b.status === "paid" ? "muted" : undefined} />
      <Source id={b.source} />
    </View>
  );
}

function BillSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const { c } = useTheme();
  const last = useRef(id);
  if (id) last.current = id;
  const b = useDB((d) => d.bills.find((x) => x.id === last.current));
  const accounts = useDB((d) => d.accounts);
  const tasks = useDB((d) => d.tasks);
  const acc = b && accountOf(accounts, b.accountId);
  const linked = b ? tasksFor(b, tasks) : [];

  const markPaid = (x: Bill) => {
    const before = { due: x.due, status: x.status, lastPaid: x.lastPaid };
    const once = x.recurrence === "once";
    const due = once ? x.due : nextDue(x);
    db.patch("bills", x.id, once ? { status: "paid", lastPaid: new Date().toISOString() } : { due, status: "upcoming", lastPaid: new Date().toISOString() });
    toast(once ? `${x.name} marked as paid` : `${x.name} paid. Next due ${shortDate(due)}`, { label: "Undo", run: () => db.patch("bills", x.id, before) });
  };

  const addTask = (x: Bill, title: string, notes: string) => {
    const tid = newId("tk");
    db.insert("tasks", {
      id: tid,
      title,
      notes,
      due: remindBy(x.due),
      done: false,
      list: acc?.type === "business" ? "shop" : "personal",
      from: { kind: "bill", id: x.id },
      source: "manual",
      createdAt: new Date().toISOString(),
    });
    toast("Added to your tasks", { label: "Undo", run: () => db.remove("tasks", tid) });
  };

  const dd = b ? daysFrom(b.due) : 0;
  return (
    <Sheet
      open={!!id}
      onClose={onClose}
      title={b?.name ?? "Bill"}
      footer={
        b && b.status !== "paid" ? (
          <Button variant="primary" onPress={() => markPaid(b)}>
            Mark as paid
          </Button>
        ) : undefined
      }
    >
      {b ? (
        <View style={{ gap: 24 }}>
          <View>
            <Amount value={b.amount} size={40} style={{ fontFamily: "Newsreader_400Regular", letterSpacing: -0.8, lineHeight: 44 }} />
            <Text size={13.5} tone="muted" style={{ marginTop: 8 }}>
              {b.status === "paid" ? (
                "Paid"
              ) : (
                <>
                  {`Due ${longDate(b.due)}, `}
                  {dd < 0 ? <Text size={13.5} tone="coral">overdue</Text> : dd === 0 ? "today" : `in ${dd} ${dd === 1 ? "day" : "days"}`}
                </>
              )}
            </Text>
          </View>

          {b.previous && b.previous !== b.amount ? (
            <View style={{ borderLeftWidth: 2, borderLeftColor: c.warn, paddingLeft: 12 }}>
              <Text size={14.5} style={{ lineHeight: 22 }}>
                {b.amount > b.previous ? "Up" : "Down"} {money(Math.abs(b.amount - b.previous))} from {money(b.previous)}
                {b.recurrence === "yearly" ? " last year" : " last time"}.
              </Text>
            </View>
          ) : null}

          <Facts
            items={[
              ["Payee", b.payee],
              ["Amount", <Amount key="a" value={b.amount} />],
              ...(b.previous ? ([["Previous", <Amount key="p" value={b.previous} tone="muted" />]] as [string, ReactNode][]) : []),
              ["Repeats", recurrenceName[b.recurrence]],
              ["Pays from", acc ? `${acc.name} ··${acc.mask}` : "Unknown"],
              ["Payment", b.autopay ? "Autopay" : "You pay it by hand"],
              ...(b.kind === "subscription" ? ([["Per year", <Amount key="y" value={perMonth(b) * 12} />]] as [string, ReactNode][]) : []),
              ...(b.lastPaid ? ([["Last marked paid", stamp(b.lastPaid)]] as [string, ReactNode][]) : []),
              ["Source", <Source key="s" id={b.source} />],
            ]}
          />

          <View>
            <Label style={{ marginBottom: 8 }}>Follow up</Label>
            {linked.length > 0 ? (
              <List style={{ marginBottom: 12 }}>
                {linked.map((t) => (
                  <Row key={t.id} minHeight={44}>
                    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                      <Text size={13.5} lines={1} style={{ flex: 1 }}>
                        {t.title}
                      </Text>
                      {t.due ? (
                        <Text size={12.5} tone="muted">
                          {relDay(t.due)}
                        </Text>
                      ) : null}
                    </View>
                  </Row>
                ))}
              </List>
            ) : null}
            <View style={{ gap: 8 }}>
              {b.kind === "subscription" && !linked.some((t) => /cancel/i.test(t.title)) ? (
                <Button full onPress={() => addTask(b, `Cancel ${b.name}`, `${money(b.amount)} ${recurrenceName[b.recurrence].toLowerCase()}, next due ${longDate(b.due)}.`)}>
                  Remind me to cancel
                </Button>
              ) : null}
              {canCompare(b) && !linked.some((t) => /compare/i.test(t.title)) ? (
                <Button
                  full
                  onPress={() =>
                    addTask(b, `Compare ${b.name.toLowerCase()} prices`, `Currently ${money(b.amount)}${b.previous && b.amount > b.previous ? `, up from ${money(b.previous)}` : ""}. Due ${longDate(b.due)}.`)
                  }
                >
                  Remind me to compare prices
                </Button>
              ) : null}
              {b.kind !== "subscription" && !canCompare(b) && linked.length === 0 ? (
                <Text size={13} tone="muted">
                  Nothing to follow up.
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : (
        <Empty title="Not found">This bill isn't in your sample data any more.</Empty>
      )}
    </Sheet>
  );
}

export function BillsSkeleton() {
  return (
    <View style={{ gap: 24 }}>
      <View style={{ flexDirection: "row", gap: 24 }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ flex: 1, gap: 10 }}>
            <Skeleton width={90} height={10} />
            <Skeleton width={100} height={24} />
          </View>
        ))}
      </View>
      <SkeletonList rows={7} />
    </View>
  );
}

function Group({ title, meta, list, empty, onOpen }: { title: string; meta: string; list: Bill[]; empty: string; onOpen: (id: string) => void }) {
  return (
    <View style={{ marginBottom: 26 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <Text size={13.5} font="sansSemi" accessibilityRole="header">
          {title}
        </Text>
        <Text size={12.5} tone="muted" num>
          {meta}
        </Text>
      </View>
      {list.length ? (
        <List>
          {list.map((b) => (
            <BillRow key={b.id} b={b} onPress={() => onOpen(b.id)} />
          ))}
        </List>
      ) : (
        <Empty title={empty} />
      )}
    </View>
  );
}

export default function Bills({ openId, onOpen, onClose }: { openId?: string; onOpen: (id: string) => void; onClose: () => void }) {
  const { c } = useTheme();
  const bills = useDB((d) => d.bills);
  const sorted = [...bills].sort((a, b) => (a.status === "paid" ? 1 : 0) - (b.status === "paid" ? 1 : 0) || a.due.localeCompare(b.due));
  const regular = sorted.filter((b) => b.kind === "bill");
  const subs = sorted.filter((b) => b.kind === "subscription");
  const live = bills.filter((b) => b.status !== "paid");
  const monthly = live.reduce((s, b) => s + perMonth(b), 0);
  const subsMonthly = live.filter((b) => b.kind === "subscription").reduce((s, b) => s + perMonth(b), 0);
  const next30 = live.filter((b) => daysFrom(b.due) <= 30).reduce((s, b) => s + b.amount, 0);

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 18, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 22, marginBottom: 26 }}>
        <View style={{ width: "50%", paddingRight: 14 }}>
          <Figure label="Next 30 days" value={money(next30)} size={24} note="Bills and subscriptions" />
        </View>
        <View style={{ width: "50%", paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: c.line }}>
          <Figure label="A typical month" value={money(monthly)} size={24} note="Yearly bills spread over 12" />
        </View>
        <View style={{ width: "100%" }}>
          <Figure label="Subscriptions" value={`${money(subsMonthly)} a month`} size={24} note={`${money(subsMonthly * 12)} a year`} />
        </View>
      </View>
      <Group title="Bills" meta={`${regular.length} regular payments`} list={regular} empty="No bills" onOpen={onOpen} />
      <Group title="Subscriptions" meta={`${money(subsMonthly * 12)} a year`} list={subs} empty="No subscriptions" onOpen={onOpen} />
      <BillSheet id={openId} onClose={onClose} />
    </View>
  );
}
