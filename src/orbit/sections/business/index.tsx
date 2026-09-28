import { useEffect, useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { db, newId, useDB } from "../../store";
import { useRoute, href } from "../../router";
import { revenueBefore, shop, untracked, type Product, type ShopOrder } from "../../data/business";
import type { Task } from "../../data/tasks";
import { Amount, Bars, Button, cx, Dot, Empty, Figure, Label, List, money, Page, Row, Section, Segmented, Source, Tag, toast } from "../../ui";
import { daysFrom, inDays, on, parse, relDay, shortDate, time } from "../../time";
import { change, findOrderTask, findRestockTask, orderTaskTitle, plural, sold, totals, within } from "./shop";

type Range = "7 days" | "30 days";

const weekdayInitial = new Intl.DateTimeFormat("en-GB", { weekday: "narrow" });
const weekdayLong = new Intl.DateTimeFormat("en-GB", { weekday: "long" });

function addTask(task: Omit<Task, "id" | "done" | "list" | "source" | "createdAt">) {
  const id = newId("tk");
  db.insert("tasks", { ...task, id, done: false, list: "shop", source: "orbit", createdAt: new Date().toISOString() });
  toast("Added to Fern & Thread tasks", { label: "Undo", run: () => db.remove("tasks", id) });
}

function itemsText(o: ShopOrder, products: Product[]) {
  return o.items.map((it) => `${it.qty > 1 ? `${it.qty} × ` : ""}${products.find((p) => p.id === it.productId)?.name ?? "Item"}`).join(", ");
}

/* Headline ----------------------------------------------------------------------------------------- */

function Headline({ range }: { range: Range }) {
  const n = range === "7 days" ? 7 : 30;
  const days = useDB((d) => d.revenue);
  const orders = useDB((d) => d.shopOrders);
  const now = totals(days.slice(-n), within(orders, n));
  const prevDays = n === 7 ? days.slice(-14, -7) : revenueBefore;
  const before = prevDays.length === n ? totals(prevDays, n === 7 ? within(orders, 7, 7) : []) : undefined;
  const period = n === 7 ? "7 days" : "30 days";
  const cells = [
    { label: "Revenue", value: money(now.revenue), note: before && change(now.revenue, before.revenue, period) },
    { label: "Orders", value: now.orders, note: before && change(now.orders, before.orders, period) },
    { label: "Average order", value: money(now.aov), note: before && change(now.aov, before.aov, period) },
    {
      label: "Refunds",
      value: money(now.refunds),
      note: now.refunds ? `${plural(now.refundCount || 1, "order")}${before ? `, against ${money(before.refunds, true)} before` : ""}` : "None in this period",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-y-6 border-b border-line pb-6 md:grid-cols-4">
      {cells.map((c, i) => (
        <Figure
          key={c.label}
          label={c.label}
          value={c.value}
          note={c.note}
          className={cx(i % 2 === 1 && "border-l border-line pl-4", i > 0 && "md:border-l md:border-line md:pl-5", i === 2 && "md:pl-5")}
        />
      ))}
    </div>
  );
}

/* Revenue chart ------------------------------------------------------------------------------------ */

function RevenueChart({ range }: { range: Range }) {
  const n = range === "7 days" ? 7 : 30;
  const days = useDB((d) => d.revenue).slice(-n);
  const labels = days.map((d, i) => (n === 7 ? weekdayInitial.format(parse(d.date)) : (n - 1 - i) % 7 === 0 ? String(parse(d.date).getDate()) : ""));
  const past = days.slice(0, -1);
  const best = past.reduce((a, b) => (b.revenue > a.revenue ? b : a), past[0]);
  const today = days[days.length - 1];
  return (
    <Section title="Revenue by day" meta="Shopify and Etsy together">
      <Bars values={days.map((d) => d.revenue)} highlight={days.length - 1} labels={labels} height={190} className={n === 7 ? "gap-2 sm:gap-3" : ""} />
      <p className="mt-4 text-[13px] text-muted">
        {best && (
          <>
            Best day was {weekdayLong.format(parse(best.date))} {shortDate(best.date)}, with <Amount value={best.revenue} className="text-ink" />.{" "}
          </>
        )}
        Today so far <Amount value={today?.revenue ?? 0} className="text-accent" />.
      </p>
      <table className="sr-only">
        <caption>Revenue by day</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{relDay(d.date)}</th>
              <td>{money(d.revenue)}</td>
              <td>{plural(d.orders, "order")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

/* Channel split ------------------------------------------------------------------------------------ */

function Channels({ range }: { range: Range }) {
  const n = range === "7 days" ? 7 : 30;
  const orders = within(useDB((d) => d.shopOrders), n);
  const shopify = orders.filter((o) => o.channel === "shopify").reduce((s, o) => s + o.total, 0);
  const etsy = orders.filter((o) => o.channel === "etsy").reduce((s, o) => s + o.total, 0);
  const all = shopify + etsy || 1;
  const rows = [
    { id: "shopify" as const, name: "Shopify", value: shopify, tone: "bg-ink", dot: "ink" as const },
    { id: "etsy" as const, name: "Etsy", value: etsy, tone: "bg-line-strong", dot: "neutral" as const },
  ];
  return (
    <Section title="By channel">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-soft" role="img" aria-label={`Shopify ${Math.round((shopify / all) * 100)}%, Etsy ${Math.round((etsy / all) * 100)}%`}>
        {rows.map((r) => (
          <div key={r.id} className={cx("h-full first:border-r-2 first:border-paper", r.tone)} style={{ width: `${(r.value / all) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-3 grid gap-1.5 text-[13.5px]">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <Dot tone={r.dot} className={r.id === "etsy" ? "bg-line-strong" : undefined} />
            <dt className="flex-1 text-ink">{r.name}</dt>
            <dd className="font-mono text-[12px] tabular-nums text-faint">{Math.round((r.value / all) * 100)}%</dd>
            <dd className="w-[88px] text-right">
              <Amount value={r.value} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* Top products ------------------------------------------------------------------------------------- */

function TopProducts({ range }: { range: Range }) {
  const n = range === "7 days" ? 7 : 30;
  const products = useDB((d) => d.products);
  const orders = within(useDB((d) => d.shopOrders), n);
  const top = sold(products, orders)
    .filter((s) => s.units > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const max = top[0]?.value ?? 1;
  return (
    <Section title="Top products" meta={`Last ${range}`}>
      {top.length ? (
        <ol className="grid gap-3">
          {top.map((s) => (
            <li key={s.product.id}>
              <div className="flex items-baseline gap-3 text-[13.5px]">
                <span className="min-w-0 flex-1 truncate text-ink">{s.product.name}</span>
                <span className="font-mono text-[12px] tabular-nums text-faint">{s.units} sold</span>
                <Amount value={s.value} whole className="w-[56px] text-right" />
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-soft">
                <div className="h-full rounded-full bg-faint" style={{ width: `${(s.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[13.5px] text-muted">No sales in this period.</p>
      )}
    </Section>
  );
}

/* Orders to fulfil --------------------------------------------------------------------------------- */

function Orders({ focus }: { focus?: string }) {
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
              <Row key={o.id} active={focus === o.id} className="flex-wrap items-start sm:flex-nowrap sm:items-center">
                <div id={`order-${o.id}`} className="min-w-0 flex-1 scroll-mt-24">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[12.5px] tabular-nums text-ink">{o.number}</span>
                    <Source id={o.channel} />
                  </div>
                  <p className="mt-0.5 text-[14px] text-ink">{itemsText(o, products)}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {o.shipTo} ·{" "}
                    <span className={cx(age > 2 && "text-coral")}>
                      placed {age === 0 ? `today at ${time(o.date)}` : age === 1 ? "yesterday" : `${age} days ago`}
                    </span>
                  </p>
                </div>
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                  <Amount value={o.total} className="text-[14px] text-ink" />
                  {task ? (
                    <a href={href(`tasks/${task.id}`)} className="inline-flex h-8 items-center gap-1 rounded-[7px] px-2.5 text-[12.5px] text-muted hover:bg-soft hover:text-ink">
                      {task.done ? "Done" : "In tasks"} <ArrowUpRight size={13} />
                    </a>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
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
                </div>
              </Row>
            );
          })}
        </List>
      ) : (
        <Empty title="Nothing to post">Every order has been sent.</Empty>
      )}
      <p className="mt-3 text-[12.5px] leading-relaxed text-muted">Orbit only reads the shop. Mark orders as sent in Shopify or Etsy and they'll drop off this list.</p>
    </Section>
  );
}

/* Stock -------------------------------------------------------------------------------------------- */

function Stock() {
  const products = useDB((d) => d.products);
  const orders = within(useDB((d) => d.shopOrders), 30);
  const tasks = useDB((d) => d.tasks);
  const rows = sold(products, orders);
  const low = rows.filter((r) => !untracked(r.product) && r.product.stock <= r.product.reorderAt);
  const daysLeft = (r: (typeof rows)[number]) => (r.units ? Math.floor(r.product.stock / (r.units / 30)) : undefined);
  return (
    <Section title="Stock" meta="Sold figures cover the last 30 days">
      {low.length > 0 && (
        <div className="mb-6">
          <Label className="mb-2">Running low</Label>
          <List>
            {low.map((r) => {
              const task = findRestockTask(tasks, r.product);
              const left = daysLeft(r);
              return (
                <Row key={r.product.id} className="flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[14px] text-ink">
                      {r.product.name}
                      <Tag tone={r.product.stock === 0 ? "coral" : "warn"}>{r.product.stock === 0 ? "Sold out" : `${r.product.stock} left`}</Tag>
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      Reorder level is {r.product.reorderAt}. {left !== undefined && `At the last month's pace, that's about ${plural(left, "day")} of stock.`}
                    </p>
                  </div>
                  {task ? (
                    <a href={href(`tasks/${task.id}`)} className="inline-flex h-8 items-center gap-1 rounded-[7px] px-2.5 text-[12.5px] text-muted hover:bg-soft hover:text-ink">
                      In tasks {task.due && `· due ${inDays(task.due)}`} <ArrowUpRight size={13} />
                    </a>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => addTask({ title: `Restock ${r.product.name}`, notes: `${r.product.stock} left in stock. Reorder level is ${r.product.reorderAt}.`, due: on(3) })}
                    >
                      Add restock task
                    </Button>
                  )}
                </Row>
              );
            })}
          </List>
        </div>
      )}
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="pb-2 font-normal">
              <Label>Product</Label>
            </th>
            <th className="hidden pb-2 text-right font-normal sm:table-cell">
              <Label>Price</Label>
            </th>
            <th className="pb-2 text-right font-normal">
              <Label>In stock</Label>
            </th>
            <th className="pb-2 pl-4 text-right font-normal">
              <Label>Sold</Label>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line border-b border-line">
          {rows.map((r) => {
            const isLow = !untracked(r.product) && r.product.stock <= r.product.reorderAt;
            return (
              <tr key={r.product.id} className="h-11">
                <td className="pr-3 text-ink">{r.product.name}</td>
                <td className="hidden text-right tabular-nums text-muted sm:table-cell">{money(r.product.price)}</td>
                <td className={cx("text-right tabular-nums", isLow ? "text-coral" : "text-ink")}>{untracked(r.product) ? <span className="text-muted">Digital</span> : r.product.stock}</td>
                <td className="pl-4 text-right tabular-nums text-muted">{r.units}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Section>
  );
}

/* Payouts ------------------------------------------------------------------------------------------ */

function Payouts() {
  const payouts = useDB((d) => d.payouts);
  const coming = payouts.filter((p) => p.status !== "paid").sort((a, b) => a.date.localeCompare(b.date));
  const paid = payouts.filter((p) => p.status === "paid").sort((a, b) => b.date.localeCompare(a.date));
  const [showAll, setShowAll] = useState(false);
  const onTheWay = coming.reduce((s, p) => s + p.amount, 0);
  return (
    <Section title="Payouts" meta={coming.length ? `${money(onTheWay)} on the way` : undefined}>
      {coming.length > 0 && (
        <List className="mb-5">
          {coming.map((p) => (
            <Row key={p.id}>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-ink">{p.status === "in-transit" ? "In transit" : `Due ${relDay(p.date)}`}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted">
                  {p.status === "in-transit" ? `Sent ${inDays(p.date)}` : `${shortDate(p.date)}, ${inDays(p.date)}`}
                  <Source id={p.channel} />
                </p>
              </div>
              <Amount value={p.amount} className="text-[14px] text-ink" />
            </Row>
          ))}
        </List>
      )}
      <Label className="mb-1">Paid</Label>
      <ul className="divide-y divide-line">
        {(showAll ? paid : paid.slice(0, 4)).map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5 text-[13.5px]">
            <span className="w-[64px] shrink-0 tabular-nums text-muted">{shortDate(p.date)}</span>
            <span className="flex-1">
              <Source id={p.channel} />
            </span>
            <Amount value={p.amount} className="text-ink" />
          </li>
        ))}
      </ul>
      {paid.length > 4 && (
        <Button variant="ghost" size="sm" className="-ml-2.5 mt-1" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show all ${paid.length}`}
        </Button>
      )}
    </Section>
  );
}

/* Page --------------------------------------------------------------------------------------------- */

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

export default function BusinessPage() {
  const [range, setRange] = useState<Range>("7 days");
  const { rest } = useRoute();
  const focus = rest[0];
  const summary = useSummary();

  useEffect(() => {
    if (focus) document.getElementById(`order-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus]);

  return (
    <Page
      eyebrow="Business"
      title={shop.name}
      lede={
        <>
          {summary}
          <span className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            <Source id="shopify" />
            <Source id="etsy" />
          </span>
        </>
      }
      actions={<Segmented<Range> label="Period" items={["7 days", "30 days"]} value={range} onChange={setRange} />}
    >
      <Headline range={range} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-12">
        <RevenueChart range={range} />
        <div className="grid content-start gap-8">
          <Channels range={range} />
          <TopProducts range={range} />
        </div>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-12">
        <div className="grid content-start gap-12">
          <Orders focus={focus} />
          <Stock />
        </div>
        <Payouts />
      </div>
      <p className="mt-12 border-t border-line pt-4 text-[12px] text-faint">
        Figures include postage. Refunds are counted against the day the order was placed.
      </p>
    </Page>
  );
}
