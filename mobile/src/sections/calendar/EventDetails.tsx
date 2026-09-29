import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { VideoCamera } from "phosphor-react-native";
import { calendars, type CalEvent } from "@orbit/data/calendar";
import type { Ref } from "@orbit/data/sources";
import { longDate, minutesBetween, parse, shortDate, time } from "@orbit/time";
import { addDays, clashesWith, duration } from "@orbit/sections/calendar/lib";
import { useTheme } from "../../theme";
import { useDB, type DB } from "../../store";
import { Avatar, Dot, Label, Source, Text } from "../../ui";
import { calTone } from "./tone";
import { Facts, LinkRow } from "./shared";

/** Where each kind of link opens in the app. */
const kinds: Record<Ref["kind"], { label: string; path: (id: string) => string }> = {
  message: { label: "Email", path: (id) => `/inbox/${id}` },
  event: { label: "Event", path: (id) => `/event/${id}` },
  task: { label: "Task", path: () => "/tasks" },
  bill: { label: "Bill", path: () => "/money" },
  booking: { label: "Booking", path: (id) => `/plans/${id}` },
  order: { label: "Delivery", path: (id) => `/deliveries/${id}` },
  doc: { label: "Document", path: () => "/admin" },
  contact: { label: "Person", path: (id) => `/people/${id}` },
  txn: { label: "Payment", path: () => "/money" },
};

function refTitle(d: DB, r: Ref): string | undefined {
  switch (r.kind) {
    case "message":
      return d.messages.find((x) => x.id === r.id)?.subject;
    case "event":
      return d.events.find((x) => x.id === r.id)?.title;
    case "task":
      return d.tasks.find((x) => x.id === r.id)?.title;
    case "bill":
      return d.bills.find((x) => x.id === r.id)?.name;
    case "booking":
      return d.bookings.find((x) => x.id === r.id)?.title;
    case "order":
      return d.orders.find((x) => x.id === r.id)?.items[0]?.name;
    case "doc":
      return d.docs.find((x) => x.id === r.id)?.title;
    case "contact":
      return d.contacts.find((x) => x.id === r.id)?.name;
    case "txn":
      return d.txns.find((x) => x.id === r.id)?.merchant;
  }
}

/** "Tuesday 29 September · 16:20-17:45", or a span for multi-day all-day events. */
export function whenLabel(e: CalEvent) {
  if (e.allDay) {
    const last = addDays(parse(e.end), -1);
    const days = Math.round(minutesBetween(e.start, e.end) / 1440);
    return days > 1 ? `${shortDate(e.start)} – ${shortDate(last.toISOString())} · ${days} days` : `${longDate(e.start)} · All day`;
  }
  return `${longDate(e.start)} · ${time(e.start)}–${time(e.end)}`;
}

export function EventDetails({ e }: { e: CalEvent }) {
  const { c } = useTheme();
  const router = useRouter();
  const all = useDB((d) => d.events);
  const people = useDB((d) => d.contacts);
  const titles = useDB((d) => (e.links ?? []).map((r) => refTitle(d, r)));
  const clashes = clashesWith(e, all);
  const cal = calendars.find((x) => x.id === e.calendar)!;
  const mins = minutesBetween(e.start, e.end);

  const facts: [string, ReactNode][] = [
    [
      "Calendar",
      <View key="cal" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Dot tone={calTone[e.calendar]} />
        <Text size={14}>{cal.name}</Text>
      </View>,
    ],
  ];
  if (e.location) facts.push(["Where", e.location]);
  if (e.video)
    facts.push([
      "Call",
      <View key="call" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <VideoCamera size={15} color={c.faint} />
        <Text size={14} style={{ flexShrink: 1 }}>
          {e.video} · link in the invite
        </Text>
      </View>,
    ]);
  facts.push(["From", <Source key="src" id={e.source} />]);

  return (
    <View style={{ gap: 24 }}>
      <View>
        <Text size={15}>{whenLabel(e)}</Text>
        {!e.allDay && (
          <Text size={12} font="mono" num tone="muted" style={{ marginTop: 3 }}>
            {duration(mins)}
          </Text>
        )}
      </View>

      {clashes.length > 0 && (
        <View style={{ borderLeftWidth: 2, borderLeftColor: c.coral, backgroundColor: c.tintCoral, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 10, gap: 6 }}>
          <Text size={13}>Overlaps with</Text>
          {clashes.map((x) => (
            <Pressable key={x.id} onPress={() => router.push(`/event/${x.id}`)} accessibilityRole="button" style={{ minHeight: 32, justifyContent: "center" }}>
              <Text size={13.5} font="sansMedium" style={{ textDecorationLine: "underline" }}>
                {x.title}{" "}
                <Text size={11.5} font="mono" num tone="muted">
                  {time(x.start)}–{time(x.end)}
                </Text>
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Facts items={facts} />

      {!!e.attendees?.length && (
        <View>
          <Label style={{ marginBottom: 8 }}>With</Label>
          {e.attendees.map((name) => {
            const ct = people.find((x) => x.name === name);
            const inner = (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}>
                <Avatar name={name} size={28} />
                <Text size={14}>{name}</Text>
              </View>
            );
            return ct ? (
              <Pressable key={name} onPress={() => router.push(`/people/${ct.id}`)} accessibilityRole="button" accessibilityLabel={`Open ${name}`}>
                {inner}
              </Pressable>
            ) : (
              <View key={name}>{inner}</View>
            );
          })}
        </View>
      )}

      {e.notes ? (
        <View>
          <Label style={{ marginBottom: 8 }}>Notes</Label>
          <Text size={14} style={{ lineHeight: 21 }}>
            {e.notes}
          </Text>
        </View>
      ) : null}

      {!!e.links?.length && (
        <View>
          <Label style={{ marginBottom: 8 }}>Linked</Label>
          <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
            {e.links.map((r, i) => (
              <LinkRow key={r.kind + r.id} kind={kinds[r.kind].label} title={titles[i] ?? "Open"} onPress={() => router.push(kinds[r.kind].path(r.id))} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
