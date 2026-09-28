import { useDB } from "../../store";
import type { Order } from "../../data/plans";
import { go, useRoute } from "../../router";
import { Amount, cx, Empty, Page, Section, Source, Tag } from "../../ui";
import { dayLabel } from "../../time";
import { byDeliveredDesc, byEta, count, deliveredAt, etaText, groupOf, groupTitle, itemsLine, returnWindow, type Group } from "./lib";
import { OrderSheet } from "./OrderSheet";

/** What the right-hand status says for an order: when it comes, or how long is left to return it. */
function When({ o, group }: { o: Order; group: Group }) {
  if (group !== "delivered") return <span className={cx("tabular-nums", group === "today" ? "text-accent" : "text-ink")}>{etaText(o)}</span>;
  if (o.status === "returned") return <span className="text-muted">Returned</span>;
  const rw = returnWindow(o);
  if (!rw) return <span className="text-muted">Delivered {dayLabel(deliveredAt(o))}</span>;
  return <span className={cx("tabular-nums", rw.urgent ? "text-coral" : rw.open ? "text-ink" : "text-muted")}>{rw.text}</span>;
}

function OrderRow({ o, group }: { o: Order; group: Group }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => go(`deliveries/${o.id}`)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-1 py-3.5 text-left transition-colors hover:bg-soft/60 md:grid-cols-[minmax(0,1fr)_120px_230px_80px] md:items-center"
      >
        <span className="min-w-0">
          <span className={cx("block truncate text-[14px]", o.status === "returned" ? "text-muted" : "text-ink")}>{o.retailer}</span>
          <span className="block truncate text-[12.5px] text-muted">{itemsLine(o)}</span>
          <span className="mt-1 block text-[12.5px] md:hidden">
            <When o={o} group={group} />
            {o.carrier && <span className="text-muted"> · {o.carrier}</span>}
          </span>
        </span>
        <span className="hidden truncate text-[13px] text-muted md:block">{o.carrier ?? "Not known yet"}</span>
        <span className="hidden text-[13px] md:block">
          <When o={o} group={group} />
        </span>
        <Amount value={o.total} className="text-right text-[13.5px] text-ink" />
      </button>
    </li>
  );
}

const order: Group[] = ["today", "way", "ordered", "delivered"];

export default function DeliveriesPage() {
  const { rest } = useRoute();
  const orders = useDB((d) => d.orders);
  const groups = Object.fromEntries(order.map((g) => [g, [] as Order[]])) as Record<Group, Order[]>;
  for (const o of orders) {
    const g = groupOf(o);
    if (g) groups[g].push(o);
  }
  groups.today.sort(byEta);
  groups.way.sort(byEta);
  groups.ordered.sort(byEta);
  groups.delivered.sort(byDeliveredDesc);

  const t = groups.today.length;
  const w = groups.way.length + groups.ordered.length;
  const lede =
    t + w === 0
      ? "Nothing on its way right now."
      : [t ? `${count(t)} ${t === 1 ? "parcel" : "parcels"} arriving today` : "", w ? `${t ? count(w).toLowerCase() : count(w)} more on the way` : ""].filter(Boolean).join(", ") + ".";
  const urgent = groups.delivered.filter((o) => returnWindow(o)?.urgent);

  const openId = rest[0];
  const missing = openId && !orders.some((o) => o.id === openId);

  return (
    <Page title="Deliveries" lede={lede}>
      {missing && <p className="mb-6 border-y border-line py-3 text-[13.5px] text-muted">That order isn't here any more.</p>}
      {urgent.length > 0 && (
        <p className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-line py-3 text-[13.5px] text-ink">
          <Tag tone="coral">Return soon</Tag>
          {urgent.map((o, i) => (
            <span key={o.id}>
              <button type="button" onClick={() => go(`deliveries/${o.id}`)} className="underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                {o.items[0]?.name} from {o.retailer}
              </button>
              <span className="text-muted">, {returnWindow(o)!.short}</span>
              {i < urgent.length - 1 && ";"}
            </span>
          ))}
        </p>
      )}

      {orders.length === 0 ? (
        <Empty title="No orders yet">When an order confirmation arrives in your email, Orbit starts tracking it here.</Empty>
      ) : (
        <div className="grid gap-10">
          {order.map((g) => {
            const list = groups[g];
            if (!list.length && g !== "today") return null;
            return (
              <Section key={g} title={groupTitle[g]} meta={g === "delivered" ? "Last 30 days" : list.length > 1 ? `${list.length} orders` : undefined}>
                {list.length ? (
                  <>
                    <div className="hidden grid-cols-[minmax(0,1fr)_120px_230px_80px] gap-x-4 px-1 pb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint md:grid">
                      <span>Order</span>
                      <span>Carrier</span>
                      <span>{g === "delivered" ? "Returns" : "Expected"}</span>
                      <span className="text-right">Total</span>
                    </div>
                    <ul className="divide-y divide-line border-y border-line">
                      {list.map((o) => (
                        <OrderRow key={o.id} o={o} group={g} />
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="border-y border-line py-3.5 text-[13.5px] text-muted">Nothing due today.</p>
                )}
              </Section>
            );
          })}
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
        <p className="text-[12.5px] text-muted">Tracking updates come from the carrier. Items, prices and return windows come from your confirmation emails.</p>
        <div className="flex gap-4">
          <Source id="royal-mail" />
          <Source id="gmail" />
        </div>
      </div>

      <OrderSheet id={missing ? undefined : openId} onClose={() => go("deliveries")} />
    </Page>
  );
}
