import { Pressable, View } from "react-native";
import type { Order } from "@orbit/data/plans";
import { dayLabel } from "@orbit/time";
import { deliveredAt, etaText, itemsLine, returnWindow, type Group } from "@orbit/sections/deliveries/lib";
import { useTheme } from "../../theme";
import { Amount, Skeleton, SkeletonRow, Source, Text } from "../../ui";

export const statusText: Record<Order["status"], string> = {
  ordered: "Ordered",
  dispatched: "On the way",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  returned: "Returned",
};

/** What the status line says for an order: when it comes, or how long is left to return it. */
export function When({ o, group }: { o: Order; group: Group | "returns" }) {
  if (group === "returns") {
    const rw = returnWindow(o);
    return (
      <Text size={12.5} num tone={rw?.urgent ? "coral" : "ink"}>
        {rw?.text}
      </Text>
    );
  }
  if (group !== "delivered")
    return (
      <Text size={12.5} num tone={group === "today" ? "accent" : "ink"}>
        {etaText(o)}
      </Text>
    );
  if (o.status === "returned")
    return (
      <Text size={12.5} tone="muted">
        Returned
      </Text>
    );
  return (
    <Text size={12.5} tone="muted">
      Delivered {dayLabel(deliveredAt(o))}
    </Text>
  );
}

export function OrderRow({ o, group, onOpen }: { o: Order; group: Group | "returns"; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => onOpen(o.id)}
      accessibilityRole="button"
      accessibilityLabel={`${o.retailer}, ${itemsLine(o)}`}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 68, paddingVertical: 12, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: pressed ? c.soft : "transparent" })}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text size={14.5} lines={1} tone={o.status === "returned" ? "muted" : "ink"}>
          {o.retailer}
        </Text>
        <Text size={12.5} tone="muted" lines={1}>
          {itemsLine(o)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 6 }}>
          <When o={o} group={group} />
          <Text size={12.5} tone="muted">
            · {o.carrier ?? "Carrier not known yet"}
          </Text>
        </View>
        <Source id={o.source} />
      </View>
      <Amount value={o.total} size={13.5} />
    </Pressable>
  );
}

/** Mirrors the deliveries list: two sections of rows. */
export function DeliveriesSkeleton() {
  const { c } = useTheme();
  return (
    <View style={{ gap: 28 }}>
      {[2, 3].map((n) => (
        <View key={n} style={{ gap: 12 }}>
          <Skeleton width={110} height={13} />
          <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
            {Array.from({ length: n }, (_, i) => (
              <SkeletonRow key={i} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
