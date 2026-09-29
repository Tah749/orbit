import { useCallback, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { Order } from "@orbit/data/plans";
import { byDeliveredDesc, byEta, count, groupOf, groupTitle, returnWindow, type Group } from "@orbit/sections/deliveries/lib";
import { daysFrom } from "@orbit/time";
import { useDB } from "../../src/store";
import { Empty, List, Page, Screen, Section, Source, Text, useSimulatedLoad } from "../../src/ui";
import { DeliveriesSkeleton, OrderRow } from "../../src/sections/deliveries/parts";

const order: Group[] = ["today", "way", "ordered", "delivered"];

export default function DeliveriesScreen() {
  const router = useRouter();
  const orders = useDB((d) => d.orders);
  const [refresh, setRefresh] = useState(0);
  const loading = useSimulatedLoad("deliveries", refresh);
  const onRefresh = useCallback(() => setRefresh((n) => n + 1), []);

  const groups = Object.fromEntries(order.map((g) => [g, [] as Order[]])) as Record<Group, Order[]>;
  for (const o of orders) {
    const g = groupOf(o);
    if (g) groups[g].push(o);
  }
  groups.today.sort(byEta);
  groups.way.sort(byEta);
  groups.ordered.sort(byEta);
  groups.delivered.sort(byDeliveredDesc);
  // Anything with a return window still open, soonest deadline first.
  const returns = orders.filter((o) => returnWindow(o)?.open).sort((a, b) => daysFrom(a.returnBy!) - daysFrom(b.returnBy!));

  const t = groups.today.length;
  const w = groups.way.length + groups.ordered.length;
  const lede =
    t + w === 0
      ? "Nothing on its way right now."
      : [t ? `${count(t)} ${t === 1 ? "parcel" : "parcels"} arriving today` : "", w ? `${t ? count(w).toLowerCase() : count(w)} more on the way` : ""].filter(Boolean).join(", ") + ".";

  const open = (id: string) => router.push(`/deliveries/${id}`);

  return (
    <Screen back onRefresh={onRefresh}>
      <Page eyebrow="Life" title="Deliveries" lede={loading ? undefined : lede}>
        {loading ? (
          <DeliveriesSkeleton />
        ) : orders.length === 0 ? (
          <Empty title="No orders yet">When an order confirmation arrives in your email, Orbit starts tracking it here.</Empty>
        ) : (
          <View style={{ gap: 30 }}>
            {order.map((g) => {
              const list = groups[g];
              if (!list.length && g !== "today") return null;
              return (
                <Section key={g} title={groupTitle[g]} meta={g === "delivered" ? "Last 30 days" : list.length > 1 ? `${list.length} orders` : undefined} style={{ marginBottom: 0 }}>
                  {list.length ? (
                    <List>
                      {list.map((o) => (
                        <OrderRow key={o.id} o={o} group={g} onOpen={open} />
                      ))}
                    </List>
                  ) : (
                    <List>
                      <View style={{ paddingVertical: 14 }}>
                        <Text size={13.5} tone="muted">
                          Nothing due today.
                        </Text>
                      </View>
                    </List>
                  )}
                </Section>
              );
            })}

            {returns.length > 0 && (
              <Section title="Return windows" meta="Still open" style={{ marginBottom: 0 }}>
                <List>
                  {returns.map((o) => (
                    <OrderRow key={o.id} o={o} group="returns" onOpen={open} />
                  ))}
                </List>
              </Section>
            )}

            <View style={{ gap: 10 }}>
              <Text size={12.5} tone="muted">
                Tracking updates come from the carrier. Items, prices and return windows come from your confirmation emails.
              </Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <Source id="royal-mail" />
                <Source id="gmail" />
              </View>
            </View>
          </View>
        )}
      </Page>
    </Screen>
  );
}
