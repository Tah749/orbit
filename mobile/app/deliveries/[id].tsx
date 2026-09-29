import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Order } from "@orbit/data/plans";
import type { Task } from "@orbit/data/tasks";
import { dayLabel, daysFrom, relDay, stamp } from "@orbit/time";
import { etaText, eventStamp, returnReminderDue, returnWindow } from "@orbit/sections/deliveries/lib";
import { useTheme } from "../../src/theme";
import { db, newId, useDB } from "../../src/store";
import { Amount, Button, Empty, Label, Page, Screen, Skeleton, SkeletonList, Source, Tag, Text, toast, useSimulatedLoad } from "../../src/ui";
import { CodeText, Facts, LinkRow, NoteEditor } from "../../src/sections/calendar/shared";
import { statusText } from "../../src/sections/deliveries/parts";

function markReceived(o: Order) {
  const prev = { status: o.status, events: o.events };
  db.patch("orders", o.id, { status: "delivered", events: [...o.events, { at: new Date().toISOString(), text: "Marked as received by you" }] });
  toast("Marked as received", { label: "Undo", run: () => db.patch("orders", o.id, prev) });
}

function Timeline({ o }: { o: Order }) {
  const { c } = useTheme();
  const pending = o.status !== "delivered" && o.status !== "returned";
  const last = o.events.length - 1;
  const dot = (fill: string, ring?: string) => <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: fill, borderWidth: ring ? 1.5 : 0, borderColor: ring }} />;
  return (
    <View>
      {o.events.map((e, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 12, paddingBottom: i < last || pending ? 16 : 0 }}>
          <View style={{ width: 10, alignItems: "center" }}>
            {dot(i === last ? c.accent : c.ink)}
            {(i < last || pending) && <View style={{ position: "absolute", top: 18, bottom: -16, width: 1, backgroundColor: c.lineStrong }} />}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text size={14} font={i === last ? "sansMedium" : "sans"}>
              {e.text}
            </Text>
            <Text size={11.5} font="mono" num tone="muted">
              {eventStamp(e.at)}
            </Text>
          </View>
        </View>
      ))}
      {pending && (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ width: 10, alignItems: "center" }}>{dot(c.paper, c.lineStrong)}</View>
          <View>
            <Text size={14} tone="muted">
              Delivered
            </Text>
            <Text size={11.5} font="mono" tone="faint">
              {etaText(o)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function OrderScreen() {
  const { c } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const o = useDB((d) => d.orders.find((x) => x.id === id));
  const mails = useDB((d) => d.messages.filter((m) => m.links?.some((l) => l.kind === "order" && l.id === id)));
  const task = useDB((d) => d.tasks.find((t) => !t.done && t.from?.kind === "order" && t.from.id === id));
  const loading = useSimulatedLoad(`order-${id}`);

  if (!o && !loading)
    return (
      <Screen back>
        <Page eyebrow="Deliveries" title="Order">
          <Empty title="That order isn't here any more" />
        </Page>
      </Screen>
    );

  const rw = o ? returnWindow(o) : undefined;
  const received = o?.status === "delivered" || o?.status === "returned";

  const remind = () => {
    if (!o) return;
    const t: Task = {
      id: newId("tk"),
      title: `Return ${o.items[0]?.name ?? "order"} to ${o.retailer}`,
      notes: `Return window ends ${dayLabel(o.returnBy!)}.`,
      due: returnReminderDue(o),
      done: false,
      list: "personal",
      from: { kind: "order", id: o.id },
      source: "manual",
      createdAt: new Date().toISOString(),
    };
    db.insert("tasks", t);
    const due = relDay(t.due!);
    toast(`Reminder set for ${Math.abs(daysFrom(t.due!)) <= 1 ? due.toLowerCase() : due}`, { label: "Undo", run: () => db.remove("tasks", t.id) });
  };

  return (
    <Screen back>
      <Page eyebrow="Order" title={o?.retailer ?? " "}>
        {loading || !o ? (
          <View style={{ gap: 22 }}>
            <View style={{ gap: 8 }}>
              <Skeleton width={90} height={20} />
              <Skeleton width="55%" height={15} />
            </View>
            <SkeletonList rows={3} />
            <SkeletonList rows={3} />
          </View>
        ) : (
          <View style={{ gap: 28 }}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <Tag tone={o.status === "out-for-delivery" ? "accent" : o.status === "returned" ? "info" : "neutral"}>{statusText[o.status]}</Tag>
                <Text size={13} tone="muted">
                  Ordered {dayLabel(o.orderedAt)}
                </Text>
              </View>
              <Text size={15} num tone={rw?.urgent ? "coral" : "ink"} style={{ marginTop: 12 }}>
                {received ? (rw ? rw.text : statusText[o.status]) : etaText(o)}
              </Text>
            </View>

            <View>
              <Label style={{ marginBottom: 8 }}>Items</Label>
              <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
                {o.items.map((it, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "baseline", gap: 12, minHeight: 44, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
                    <Text size={14} style={{ flex: 1 }}>
                      {it.name}
                      {it.qty > 1 ? <Text size={14} tone="muted"> × {it.qty}</Text> : null}
                    </Text>
                    <Amount value={it.price * it.qty} />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderBottomWidth: 1, borderBottomColor: c.ink, paddingVertical: 12 }}>
                <Text size={14.5} font="sansMedium">
                  Total
                </Text>
                <Amount value={o.total} />
              </View>
            </View>

            {o.tracking ? (
              <View>
                <Label style={{ marginBottom: 6 }}>Tracking number</Label>
                <CodeText value={o.tracking} size={17} />
                <Text size={12} tone="faint" style={{ marginTop: 4 }}>
                  Press and hold to copy.
                </Text>
              </View>
            ) : null}

            <View>
              <Label style={{ marginBottom: 12 }}>Tracking</Label>
              <Timeline o={o} />
            </View>

            <Facts
              items={[
                ["Carrier", o.carrier ?? "Not given yet"],
                ...(o.returnBy ? ([["Return by", `${dayLabel(o.returnBy)}${rw?.open ? `, ${rw.short}` : ""}`]] as [string, string][]) : []),
                ["From", <Source key="s" id={o.source} />],
              ]}
            />

            {mails.length > 0 && (
              <View>
                <Label style={{ marginBottom: 8 }}>Related</Label>
                <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
                  {mails.map((m) => (
                    <LinkRow key={m.id} kind="Email" title={m.subject} meta={stamp(m.date)} onPress={() => router.push(`/inbox/${m.id}`)} />
                  ))}
                </View>
              </View>
            )}

            <NoteEditor label="Your notes" value={o.notes} placeholder="Size runs small, gift for Sam, leave with number 12" onSave={(v) => db.patch("orders", o.id, { notes: v })} />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 20, borderTopWidth: 1, borderTopColor: c.line }}>
              {rw?.open &&
                (task ? (
                  <Button onPress={() => router.push("/tasks")}>Return reminder set</Button>
                ) : (
                  <Button variant={received ? "primary" : "outline"} onPress={remind}>
                    Remind me to return
                  </Button>
                ))}
              {!received && (
                <Button variant="primary" onPress={() => markReceived(o)}>
                  Mark as received
                </Button>
              )}
            </View>
          </View>
        )}
      </Page>
    </Screen>
  );
}
