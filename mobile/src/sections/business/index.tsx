import { useCallback, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { revenueBefore, shop, untracked, type Product, type ShopOrder } from "@orbit/data/business";
import type { Task } from "@orbit/data/tasks";
import { change, findOrderTask, findRestockTask, orderTaskTitle, plural, sold, totals, within } from "@orbit/sections/business/shop";
import { daysFrom, inDays, on, parse, relDay, shortDate, time } from "@orbit/time";
import { money } from "@orbit/format";
import { db, newId, useDB } from "../../store";
import { Amount, Bars, Button, Empty, Figure, Label, List, Page, Row, Screen, Section, Segmented, Skeleton, SkeletonBlock, SkeletonList, Source, Tag, Text, toast, useSimulatedLoad } from "../../ui";
import { useTheme } from "../../theme";

type Range = "7 days" | "30 days";

const weekdayInitial = new Intl.DateTimeFormat("en-GB", { weekday: "narrow" });
const weekdayLong = new Intl.DateTimeFormat("en-GB", { weekday: "long" });

function addTask(task: Omit<Task, "id" | "done" | "list" | "source" | "createdAt">) {
  const id = newId("tk");
  db.insert("tasks", { ...task, id, done: false, list: "shop", source: "orbit", createdAt: new Date().toISOString() });
  toast("Added to Fern & Thread tasks", { label: "Undo", run: () => db.remove("tasks", id) });
}

const itemsText = (o: ShopOrder, products: Product[]) =>
  o.items.map((it) => `${it.qty > 1 ? `${it.qty} × ` : ""}${products.find((p) => p.id === it.productId)?.name ?? "Item"}`).join(", ");

const nOf = (r: Range) => (r === "7 days" ? 7 : 30);

/* Headline ------------------------------------------------------------------------------------------ */

function Headline({ range }: { range: Range }) {
  const { c } = useTheme();
  const n = nOf(range);
  const days = useDB((d) => d.revenue);
  const orders = useDB((d) => d.shopOrders);
  const now = totals(days.slice(-n), within(orders, n));
  const prevDays = n === 7 ? days.slice(-14, -7) : revenueBefore;
  const before = prevDays.length === n ? totals(prevDays, n === 7 ? within(orders, 7, 7) : []) : undefined;
  const cells = [
    { label: "Revenue", value: money(now.revenue), note: before && change(now.revenue, before.revenue, range) },
    { label: "Orders", value: String(now.orders), note: before && change(now.orders, before.orders, range) },
    { label: "Average order", value: money(now.aov), note: before && change(now.aov, before.aov, range) },
    { label: "Refunds", value: money(now.refunds), note: now.refunds ? `${plural(now.refundCount || 1, "order")}${before ? `, against ${money(before.refunds, true)} before` : ""}` : "None in this period" },
  ];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 20, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 22, marginBottom: 26 }}>
      {cells.map((x, i) => (
        <View key={x.label} style={{ width: "50%", paddingLeft: i % 2 ? 14 : 0, paddingRight: i % 2 ? 0 : 14, borderLeftWidth: i % 2 ? 1 : 0, borderLeftColor: c.line }}>
          <Figure label={x.label} value={x.value} note={x.note} size={24} />
        </View>
      ))}
    </View>
  );
}

/* Today ---------------------------------------------------------------------------------------------- */

function Today() {
  const days = useDB((d) => d.revenue);
  const today = days[days.length - 1];
  const yesterday = days[days.length - 2];
  if (!today) return null;
  return (
    <Section title="Today so far" meta="Shopify and Etsy together">
      <Text size={40} font="serif" num style={{ lineHeight: 44, letterSpacing: -0.8 }}>
        {money(today.revenue)}
      </Text>
      <Text size={13.5} tone="muted" style={{ marginTop: 6 }}>
        {plural(today.orders, "order")}
        {yesterday ? ` · ${money(yesterday.revenue)} by the end of yesterday` : ""}
      </Text>
    </Section>
  );
}

/* Revenue chart -------------------------------------------------------------------------------------- */

function RevenueChart({ range }: { range: Range }) {
  const n = nOf(range);
  const days = useDB((d) => d.revenue).slice(-n);
  const labels = days.map((d, i) => (n === 7 ? weekdayInitial.format(parse(d.date)) : (n - 1 - i) % 7 === 0 ? String(parse(d.date).getDate()) : ""));
  const past = days.slice(0, -1);
  const best = past.reduce((a, b) => (b.revenue > a.revenue ? b : a), past[0]);
  const today = days[days.length - 1];
  return (
    <Section title="Revenue by day" meta="Shopify and Etsy together">
      <Bars values={days.map((d) => d.revenue)} highlight={days.length - 1} height={170} />
      <View style={{ flexDirection: "row", gap: 3, marginTop: 6 }}>
        {labels.map((l, i) => (
          <View key={i} style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
            <Label tone="faint" style={{ fontSize: 9.5, letterSpacing: 0 }}>{l}</Label>
          </View>
        ))}
      </View>
      <Text size={13} tone="muted" style={{ marginTop: 14 }}>
        {best ? (
          <>
            {`Best day was ${weekdayLong.format(parse(best.date))} ${shortDate(best.date)}, with `}
            <Amount value={best.revenue} size={13} />
            {". "}
          </>
        ) : null}
        {"Today so far "}
        <Amount value={today?.revenue ?? 0} size={13} tone="accent" />
        {"."}
      </Text>
    </Section>
  );
}

/* Channels ------------------------------------------------------------------------------------------- */

function Channels({ range }: { range: Range }) {
  const { c } = useTheme();
  const orders = within(useDB((d) => d.shopOrders), nOf(range));
  const shopify = orders.filter((o) => o.channel === "shopify").reduce((s, o) => s + o.total, 0);
  const etsy = orders.filter((o) => o.channel === "etsy").reduce((s, o) => s + o.total, 0);
  const all = shopify + etsy || 1;
  const rows = [
    { id: "shopify", name: "Shopify", value: shopify, color: c.ink },
    { id: "etsy", name: "Etsy", value: etsy, color: c.lineStrong },
  ];
  return (
    <Section title="By channel">
      <View accessibilityLabel={`Shopify ${Math.round((shopify / all) * 100)}%, Etsy ${Math.round((etsy / all) * 100)}%`} style={{ flexDirection: "row", height: 8, gap: 2, borderRadius: 4, overflow: "hidden", backgroundColor: c.soft }}>
        {rows.map((r) => (
          <View key={r.id} style={{ flex: r.value || 0.0001, backgroundColor: r.color }} />
        ))}
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        {rows.map((r) => (
          <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color }} />
            <Text size={13.5} style={{ flex: 1 }}>{r.name}</Text>
            <Text size={12} font="mono" tone="faint" num>{`${Math.round((r.value / all) * 100)}%`}</Text>
            <View style={{ width: 84, alignItems: "flex-end" }}>
              <Amount value={r.value} />
            </View>
          </View>
        ))}
      </View>
    </Section>
  );
}

/* Top products --------------------------------------------------------------------------------------- */

function TopProducts({ range }: { range: Range }) {
  const { c } = useTheme();
  const products = useDB((d) => d.products);
  const orders = within(useDB((d) => d.shopOrders), nOf(range));
  const top = sold(products, orders).filter((s) => s.units > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  const max = top[0]?.value ?? 1;
  return (
    <Section title="Top products" meta={`Last ${range}`}>
      {top.length ? (
        <View style={{ gap: 14 }}>
          {top.map((s) => (
            <View key={s.product.id}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
                <Text size={14} lines={1} style={{ flex: 1 }}>{s.product.name}</Text>
                <Text size={12} font="mono" tone="faint" num>{`${s.units} sold`}</Text>
                <Amount value={s.value} whole />
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: c.soft, marginTop: 6, overflow: "hidden" }}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: c.faint, width: `${(s.value / max) * 100}%` }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text size={13.5} tone="muted">No sales in this period.</Text>
      )}
    </Section>
  );
}

/* Orders to post ------------------------------------------------------------------------------------- */

function Orders({ focus }: { focus?: string }) {
  const { c } = useTheme();
  const orders = useDB((d) => d.shopOrders.filter((o) => o.status === "unfulfilled"));
  const products = useDB((d) => d.products);
  const tasks = useDB((d) => d.tasks);
  const total = orders.reduce((s, o) => s + o.total, 0);
  return (
    <Section title="Orders to post" meta={orders.length ? `${orders.length} waiting · ${money(total)}` : undefined}>
      {orders.length ? (
        <List>
          {orders.map((o) => {
            const age = -daysFrom(o.date);
            const task = findOrderTask(tasks, o);
            return (
              <Row key={o.id} active={focus === o.id} minHeight={84} style={{ alignItems: "flex-start" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text size={12.5} font="mono" num>{o.number}</Text>
                  <Source id={o.channel === "stripe" ? "shopify" : o.channel} />
                </View>
                <Text size={14.5} style={{ marginTop: 3 }}>{itemsText(o, products)}</Text>
                <Text size={12.5} tone="muted" style={{ marginTop: 3 }}>
                  {`${o.shipTo} · `}
                  <Text size={12.5} tone={age > 2 ? "coral" : "muted"}>
                    {`placed ${age === 0 ? `today at ${time(o.date)}` : age === 1 ? "yesterday" : `${age} days ago`}`}
                  </Text>
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 12 }}>
                  <Amount value={o.total} />
                  {task ? (
                    <Tag tone={task.done ? "accent" : "neutral"}>{task.done ? "Done" : "In tasks"}</Tag>
                  ) : (
                    <Button
                      size="sm"
                      onPress={() =>
                        addTask({
                          title: orderTaskTitle(o),
                          notes: `${itemsText(o, products)}. ${o.channel === "etsy" ? "Etsy" : "Shopify"} order, ${money(o.total)}.`,
                          due: age >= 2 ? on(0) : on(1),
                        })
                      }
                    >
                      Add to tasks
                    </Button>
                  )}
                </View>
              </Row>
            );
          })}
        </List>
      ) : (
        <Empty title="Nothing to post">Every order has been sent.</Empty>
      )}
      <Text size={12.5} tone="muted" style={{ marginTop: 12, lineHeight: 18 }}>
        Orbit only reads the shop. Mark orders as sent in Shopify or Etsy and they'll drop off this list.
      </Text>
    </Section>
  );
}

/* Stock ---------------------------------------------------------------------------------------------- */

function Stock() {
  const { c } = useTheme();
  const products = useDB((d) => d.products);
  const orders = within(useDB((d) => d.shopOrders), 30);
  const tasks = useDB((d) => d.tasks);
  const rows = sold(products, orders);
  const low = rows.filter((r) => !untracked(r.product) && r.product.stock <= r.product.reorderAt);
  const daysLeft = (r: (typeof rows)[number]) => (r.units ? Math.floor(r.product.stock / (r.units / 30)) : undefined);
  return (
    <Section title="Products" meta="Sold figures cover the last 30 days">
      {low.length > 0 ? (
        <View style={{ marginBottom: 22 }}>
          <Label style={{ marginBottom: 6 }}>Running low</Label>
          <List>
            {low.map((r) => {
              const task = findRestockTask(tasks, r.product);
              const left = daysLeft(r);
              return (
                <Row key={r.product.id} minHeight={84} style={{ alignItems: "flex-start" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text size={14.5} lines={1} style={{ flexShrink: 1 }}>{r.product.name}</Text>
                    <Tag tone={r.product.stock === 0 ? "coral" : "warn"}>{r.product.stock === 0 ? "Sold out" : `${r.product.stock} left`}</Tag>
                  </View>
                  <Text size={12.5} tone="muted" style={{ marginTop: 3 }}>
                    {`Reorder level is ${r.product.reorderAt}.`}
                    {left !== undefined ? ` At the last month's pace, that's about ${plural(left, "day")} of stock.` : ""}
                  </Text>
                  <View style={{ marginTop: 10 }}>
                    {task ? (
                      <Tag>{`In tasks${task.due ? ` · due ${inDays(task.due)}` : ""}`}</Tag>
                    ) : (
                      <Button size="sm" onPress={() => addTask({ title: `Restock ${r.product.name}`, notes: `${r.product.stock} left in stock. Reorder level is ${r.product.reorderAt}.`, due: on(3) })}>
                        Add restock task
                      </Button>
                    )}
                  </View>
                </Row>
              );
            })}
          </List>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
        <Label style={{ flex: 1 }}>Product</Label>
        <Label style={{ width: 64, textAlign: "right" }}>In stock</Label>
        <Label style={{ width: 48, textAlign: "right" }}>Sold</Label>
      </View>
      {rows.map((r) => {
        const isLow = !untracked(r.product) && r.product.stock <= r.product.reorderAt;
        return (
          <View key={r.product.id} style={{ flexDirection: "row", alignItems: "center", minHeight: 48, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text size={14} lines={1}>{r.product.name}</Text>
              <Text size={12} tone="muted" num>{money(r.product.price)}</Text>
            </View>
            <View style={{ width: 64, alignItems: "flex-end" }}>
              {untracked(r.product) ? <Text size={13.5} tone="muted">Digital</Text> : <Text size={14} num tone={isLow ? "coral" : "ink"}>{String(r.product.stock)}</Text>}
            </View>
            <View style={{ width: 48, alignItems: "flex-end" }}>
              <Text size={14} num tone="muted">{String(r.units)}</Text>
            </View>
          </View>
        );
      })}
    </Section>
  );
}

/* Payouts -------------------------------------------------------------------------------------------- */

function Payouts() {
  const { c } = useTheme();
  const payouts = useDB((d) => d.payouts);
  const coming = payouts.filter((p) => p.status !== "paid").sort((a, b) => a.date.localeCompare(b.date));
  const paid = payouts.filter((p) => p.status === "paid").sort((a, b) => b.date.localeCompare(a.date));
  const [showAll, setShowAll] = useState(false);
  const onTheWay = coming.reduce((s, p) => s + p.amount, 0);
  return (
    <Section title="Payouts" meta={coming.length ? `${money(onTheWay)} on the way` : undefined}>
      {coming.length > 0 ? (
        <List style={{ marginBottom: 22 }}>
          {coming.map((p) => (
            <Row key={p.id} right={<Amount value={p.amount} />}>
              <Text size={14.5}>{p.status === "in-transit" ? "In transit" : `Due ${relDay(p.date)}`}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                <Text size={12.5} tone="muted">{p.status === "in-transit" ? `Sent ${inDays(p.date)}` : `${shortDate(p.date)}, ${inDays(p.date)}`}</Text>
                <Source id={p.channel === "stripe" ? "shopify" : p.channel} />
              </View>
            </Row>
          ))}
        </List>
      ) : null}
      <Label style={{ marginBottom: 4 }}>Paid</Label>
      <List>
        {(showAll ? paid : paid.slice(0, 4)).map((p) => (
          <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Text size={13.5} tone="muted" num style={{ width: 64 }}>{shortDate(p.date)}</Text>
            <View style={{ flex: 1 }}>
              <Source id={p.channel === "stripe" ? "shopify" : p.channel} />
            </View>
            <Amount value={p.amount} />
          </View>
        ))}
      </List>
      {paid.length > 4 ? (
        <View style={{ marginTop: 8 }}>
          <Button variant="ghost" size="sm" onPress={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : `Show all ${paid.length}`}
          </Button>
        </View>
      ) : null}
    </Section>
  );
}

/* Page ----------------------------------------------------------------------------------------------- */

function useSummary() {
  const orders = useDB((d) => d.shopOrders);
  const products = useDB((d) => d.products);
  const week = within(orders, 7).length;
  const waiting = orders.filter((o) => o.status === "unfulfilled");
  const oldest = waiting.reduce<ShopOrder | undefined>((a, o) => (!a || o.date < a.date ? o : a), undefined);
  const low = products.filter((p) => !untracked(p) && p.stock <= p.reorderAt);
  const parts = [`${plural(week, "order")} in the last week`];
  parts.push(waiting.length ? `${waiting.length} still to post${oldest && -daysFrom(oldest.date) > 2 ? `, the oldest from ${weekdayLong.format(parse(oldest.date))}` : ""}` : "nothing waiting to be posted");
  let text = `${parts.join(", ")}.`;
  if (low.length) text += ` ${low.map((p) => p.name).join(" and ")} ${low.length === 1 ? "is" : "are"} running low.`;
  return text;
}

function BusinessSkeleton() {
  return (
    <View style={{ gap: 22 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: "50%", gap: 10, paddingRight: 14 }}>
            <Skeleton width={70} height={10} />
            <Skeleton width={100} height={24} />
            <Skeleton width="80%" height={10} />
          </View>
        ))}
      </View>
      <Skeleton width={140} height={40} />
      <SkeletonBlock height={170} />
      <SkeletonList rows={4} />
    </View>
  );
}

export default function BusinessScreen() {
  const [range, setRange] = useState<Range>("7 days");
  const [refresh, setRefresh] = useState(0);
  const loading = useSimulatedLoad("business", refresh);
  const onRefresh = useCallback(() => setRefresh((n) => n + 1), []);
  const { order } = useLocalSearchParams<{ order?: string }>();
  const summary = useSummary();
  const { c } = useTheme();

  return (
    <Screen back onRefresh={onRefresh}>
      <Page
        eyebrow="Business"
        title={shop.name}
        lede={
          <>
            {summary}
          </>
        }
      >
        <View style={{ flexDirection: "row", gap: 14, marginTop: -8, marginBottom: 20 }}>
          <Source id="shopify" />
          <Source id="etsy" />
        </View>
        <View style={{ marginBottom: 24 }}>
          <Segmented<Range> label="Period" items={["7 days", "30 days"]} value={range} onChange={setRange} />
        </View>
        {loading ? (
          <BusinessSkeleton />
        ) : (
          <View>
            <Today />
            <Headline range={range} />
            <RevenueChart range={range} />
            <Channels range={range} />
            <TopProducts range={range} />
            <Orders focus={order} />
            <Stock />
            <Payouts />
            <Text size={12} tone="faint" style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 14 }}>
              Figures include postage. Refunds are counted against the day the order was placed.
            </Text>
          </View>
        )}
      </Page>
    </Screen>
  );
}
