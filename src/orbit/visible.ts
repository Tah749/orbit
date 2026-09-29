import type { DB } from "./seed";
import type { Ref, SourceId } from "./data/sources";

/**
 * The store with every item from a switched-off connection removed: its own source, the account it
 * sits in, or the item it was found in. Sources that aren't connections (manual, Orbit) always show.
 * The store applies this for every section (see `useDB`), so switching a connection off in Settings
 * hides its data everywhere.
 */
export function visible(d: DB): DB {
  const off = new Set<SourceId>(d.connections.filter((c) => c.status !== "connected").map((c) => c.id));
  if (!off.size) return d;
  const ok = (s: SourceId) => !off.has(s);

  const accounts = d.accounts.filter((a) => ok(a.institution));
  const accIds = new Set(accounts.map((a) => a.id));
  const messages = d.messages.filter((m) => ok(m.source));
  const bookings = d.bookings.filter((b) => ok(b.source));
  const orders = d.orders.filter((o) => ok(o.source));
  const docs = d.docs.filter((x) => ok(x.source));
  const contacts = d.contacts.filter((c) => ok(c.source));
  const bills = d.bills.filter((b) => ok(b.source) && accIds.has(b.accountId));

  const ids: Record<Ref["kind"], Set<string> | null> = {
    message: new Set(messages.map((x) => x.id)),
    booking: new Set(bookings.map((x) => x.id)),
    order: new Set(orders.map((x) => x.id)),
    doc: new Set(docs.map((x) => x.id)),
    contact: new Set(contacts.map((x) => x.id)),
    bill: new Set(bills.map((x) => x.id)),
    event: null,
    task: null,
    txn: null,
  };
  const alive = (r?: Ref) => !r || !ids[r.kind] || ids[r.kind]!.has(r.id);
  const shopOn = ok("shopify") || ok("etsy");

  return {
    ...d,
    accounts,
    messages,
    bookings,
    orders,
    docs,
    contacts,
    bills,
    txns: d.txns.filter((t) => accIds.has(t.accountId)),
    events: d.events.filter((e) => ok(e.source) && (e.links ?? []).every(alive)),
    tasks: d.tasks.filter((t) => ok(t.source) && alive(t.from)),
    holdings: d.holdings.filter((h) => ok(h.broker)),
    trips: d.trips.filter((t) => bookings.some((b) => b.tripId === t.id)),
    workouts: d.workouts.filter((w) => ok(w.source)),
    daily: ok("apple-health") ? d.daily : [],
    shopOrders: d.shopOrders.filter((o) => ok(o.channel)),
    payouts: d.payouts.filter((p) => ok(p.channel)),
    revenue: shopOn ? d.revenue : [],
    products: shopOn ? d.products : [],
  };
}

